import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Button, AppBar, Toolbar, Divider,
  Snackbar, Alert, Paper,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, openLocationStream } from '../api';
import StudentsTable from '../components/StudentsTable';
import LocationMap   from '../components/LocationMap';
import { haversineDistance, OUT_OF_RANGE_KM, isJerusalemArea, JER_CENTER } from '../utils/geo';

// Converts browser decimal degrees to the DMS format the backend expects
function decimalToDMS(decimal) {
  const abs = Math.abs(decimal);
  const Degrees = Math.floor(abs);
  const minutesFloat = (abs - Degrees) * 60;
  const Minutes = Math.floor(minutesFloat);
  const Seconds = ((minutesFloat - Minutes) * 60).toFixed(2);
  return { Degrees: String(Degrees), Minutes: String(Minutes), Seconds: String(Seconds) };
}

export default function DashboardPage() {
  const { teacherId, logout } = useAuth();
  const navigate = useNavigate();

  const [teacher, setTeacher]             = useState(null);
  const [myStudents, setMyStudents]       = useState([]);
  const [liveLocations, setLiveLocations] = useState({});
  const [teacherCoords, setTeacherCoords] = useState(null);
  const [toast, setToast]                 = useState({ open: false, msg: '', severity: 'info' });

  const sseRef     = useRef(null);
  const watchIdRef = useRef(null);
  // Tracks which students have already triggered an out-of-range alert
  const alertedRef = useRef(new Set());

  function applyLocation(update) {
    setLiveLocations(prev => ({
      ...prev,
      [update.student_id_number]: update,
    }));
  }

  useEffect(() => {
    if (!teacherId) { navigate('/login'); return; }

    async function load() {
      try {
        const [teacherData, students, locations] = await Promise.all([
          api.getTeacher(teacherId),
          api.getMyStudents(),
          api.getStudentLocations(),
        ]);
        setTeacher(teacherData);
        setMyStudents(students);

        // Seed proximity data from the initial snapshot
        const locMap = {};
        locations.forEach(s => { locMap[s.id_number] = { student_id_number: s.id_number, ...s }; });
        setLiveLocations(locMap);
      } catch {
        alert('שגיאה בטעינת הנתונים. נסי שוב.');
      }
    }
    load();

    const es = openLocationStream();
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        applyLocation(data);

        // Single-trigger alert — only fires the first time a student breaks the perimeter
        if (data.out_of_range && !alertedRef.current.has(data.student_id_number)) {
          alertedRef.current.add(data.student_id_number);
          setToast({ open: true, msg: `התראה: ${data.first_name} ${data.last_name} התרחקה יותר מ-3 ק"מ!`, severity: 'error' });
        }
      } catch { /* ignore parse errors */ }
    };
    es.onerror = () => { /* SSE retries on its own */ };

    // Initialize GPS tracking for the teacher
    if (navigator.geolocation) {
      const sendLocation = (lat, lon) => {
        setTeacherCoords({ lat, lon });
        api.updateTeacherLocation({
          Coordinates: {
            Latitude:  decimalToDMS(lat),
            Longitude: decimalToDMS(lon),
          },
          Time: new Date().toISOString(),
        }).catch(() => {});
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Outside Jerusalem means the device isn't on the trip (dev/test environment) —
          // simulate a position at trip center so the map stays coherent
          if (isJerusalemArea(latitude, longitude)) {
            sendLocation(latitude, longitude);
          } else {
            sendLocation(JER_CENTER.lat, JER_CENTER.lon);
          }
        },
        () => sendLocation(JER_CENTER.lat, JER_CENTER.lon),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      es.close();
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [teacherId]);

  const studentsWithLocations = myStudents.map(s => {
    const base = { ...s, ...(liveLocations[s.id_number] || {}) };

    // Recalculate distance client-side once teacher coords are available —
    // the backend value may be null if the teacher's location hadn't reached the DB yet
    if (teacherCoords && base.latitude != null && base.longitude != null) {
      const distance_km = parseFloat(
        haversineDistance(teacherCoords.lat, teacherCoords.lon, base.latitude, base.longitude).toFixed(3)
      );
      return { ...base, distance_km, out_of_range: distance_km > OUT_OF_RANGE_KM };
    }

    return base;
  });

  function handleLogout() {
    sseRef.current?.close();
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    logout();
    navigate('/login');
  }

  return (
    <Box sx={styles.root}>
      <AppBar position="static" elevation={0} sx={styles.appBar}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.3px' }}>
            בנות משה
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#888' }}>
              ת.ז. {teacherId}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={handleLogout}
              sx={styles.logoutBtn}
            >
              יציאה
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={styles.content}>
        <Box sx={styles.greeting}>
          <Typography variant="h5" sx={{ fontWeight: 400, color: '#2c2c2c' }}>
            שלום,{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {teacher ? `${teacher.first_name} ${teacher.last_name}` : '…'}
            </Box>
          </Typography>
          {teacher && (
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              כיתה {teacher.class_name} · {myStudents.length} תלמידות
            </Typography>
          )}
        </Box>

        <Divider />

        <StudentsTable students={studentsWithLocations} />

        <LocationMap students={studentsWithLocations} teacherCoords={teacherCoords} />
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={7000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 72, sm: 80 } }}
      >
        <Paper elevation={0} sx={styles.alertCard}>
          <WarningAmberRoundedIcon sx={{ fontSize: 28, color: '#c62828', flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#7f1d1d' }}>
              התראת מרחק
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#991b1b', mt: 0.2 }}>
              {toast.msg}
            </Typography>
          </Box>
        </Paper>
      </Snackbar>
    </Box>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8f6f2 0%, #ede8df 100%)',
  },
  appBar: {
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0,0,0,0.07)',
    color: '#2c2c2c',
  },
  content: {
    maxWidth: 860,
    mx: 'auto',
    p: { xs: 2, sm: 3 },
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  greeting: {
    pt: 1,
  },
  logoutBtn: {
    borderColor: '#ddd',
    color: '#555',
    textTransform: 'none',
    '&:hover': { borderColor: '#bbb', background: 'rgba(0,0,0,0.03)' },
  },
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 3,
    py: 2,
    borderRadius: 3,
    background: 'rgba(255, 245, 245, 0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(198, 40, 40, 0.2)',
    boxShadow: '0 8px 32px rgba(198, 40, 40, 0.18)',
    minWidth: 280,
  },
};

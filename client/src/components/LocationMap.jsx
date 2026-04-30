import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const JER_CENTER = [31.7683, 35.2137];
const CITY_ZOOM  = 14;

const JER_BOUNDS = { latMin: 31.70, latMax: 31.85, lonMin: 35.14, lonMax: 35.30 };
function isJerusalemArea(lat, lon) {
  return lat >= JER_BOUNDS.latMin && lat <= JER_BOUNDS.latMax &&
         lon >= JER_BOUNDS.lonMin && lon <= JER_BOUNDS.lonMax;
}

const pinSVG = (fill) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="24" height="30">
    <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 22 8 22s8-16.5 8-22C20 3.58 16.42 0 12 0z" fill="${fill}"/>
    <circle cx="12" cy="8" r="3.5" fill="white"/>
  </svg>`;

const studentIcon = new L.DivIcon({
  className: '',
  html: pinSVG('#3d3830'),
  iconSize: [24, 30],
  iconAnchor: [12, 30],
  popupAnchor: [0, -32],
});

const alertIcon = new L.DivIcon({
  className: '',
  html: pinSVG('#c62828'),
  iconSize: [24, 30],
  iconAnchor: [12, 30],
  popupAnchor: [0, -32],
});

const teacherIcon = new L.DivIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34">
    <circle cx="17" cy="17" r="16" fill="#3949ab" fill-opacity="0.18"/>
    <circle cx="17" cy="17" r="10" fill="#3949ab"/>
    <circle cx="17" cy="17" r="4"  fill="white"/>
  </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -20],
});

const teacherMarkerLabel = 'המיקום שלי';

// Fits to all valid students once on first load
function FitBounds({ students, autoMovingRef }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const valid = students.filter(
      s => s.latitude && s.longitude && isJerusalemArea(parseFloat(s.latitude), parseFloat(s.longitude))
    );
    if (!valid.length) return;
    autoMovingRef.current = true;
    map.fitBounds(valid.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]), { padding: [60, 60] });
    setTimeout(() => { autoMovingRef.current = false; }, 1500);
    fitted.current = true;
  }, [students, map, autoMovingRef]);

  return null;
}

// Manages auto-follow; uses autoMovingRef to distinguish programmatic vs. user-initiated moves
function MapController({ teacherCoords, followMode, onUserInteract, autoMovingRef }) {
  const map = useMap();

  useEffect(() => {
    function handleInteract() {
      if (!autoMovingRef.current) onUserInteract();
    }
    map.on('dragstart', handleInteract);
    map.on('zoomstart', handleInteract);
    return () => {
      map.off('dragstart', handleInteract);
      map.off('zoomstart', handleInteract);
    };
  }, [map, onUserInteract, autoMovingRef]);

  useEffect(() => {
    if (!teacherCoords || !followMode) return;
    autoMovingRef.current = true;
    map.flyTo([teacherCoords.lat, teacherCoords.lon], map.getZoom(), { duration: 1.2 });
    setTimeout(() => { autoMovingRef.current = false; }, 1500);
  }, [teacherCoords, followMode, map, autoMovingRef]);

  return null;
}

function RecenterButton({ teacherCoords, onRecenter, autoMovingRef }) {
  const map = useMap();

  function handleClick() {
    const center = teacherCoords ? [teacherCoords.lat, teacherCoords.lon] : JER_CENTER;
    autoMovingRef.current = true;
    map.flyTo(center, CITY_ZOOM, { duration: 1 });
    setTimeout(() => { autoMovingRef.current = false; }, 1500);
    onRecenter();
  }

  return (
    <Box sx={styles.recenterBtn} onClick={handleClick}>
      <Tooltip title="חזרה למיקומי" placement="right">
        <MyLocationIcon sx={{ fontSize: 20, color: '#3949ab' }} />
      </Tooltip>
    </Box>
  );
}

export default function LocationMap({ students, teacherCoords }) {
  const [followMode, setFollowMode] = useState(true);
  const autoMovingRef = useRef(false);

  const located = students.filter(
    s => s.latitude && s.longitude && isJerusalemArea(parseFloat(s.latitude), parseFloat(s.longitude))
  );

  return (
    <Paper elevation={0} sx={styles.container}>
      <Typography variant="subtitle1" sx={styles.heading}>
        מפת מיקומים בזמן אמת
      </Typography>
      <Box sx={styles.mapWrapper}>
        <MapContainer
          center={JER_CENTER}
          zoom={CITY_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
        
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />

          <FitBounds students={students} autoMovingRef={autoMovingRef} />

          <MapController
            teacherCoords={teacherCoords}
            followMode={followMode}
            onUserInteract={() => setFollowMode(false)}
            autoMovingRef={autoMovingRef}
          />

          <RecenterButton
            teacherCoords={teacherCoords}
            onRecenter={() => setFollowMode(true)}
            autoMovingRef={autoMovingRef}
          />

          {teacherCoords && (
            <Marker position={[teacherCoords.lat, teacherCoords.lon]} icon={teacherIcon}>
              <Popup>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#3949ab' }}>
                  {teacherMarkerLabel}
                </Typography>
              </Popup>
            </Marker>
          )}

          {located.map(s => (
            <Marker
              key={s.id_number}
              position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
              icon={s.out_of_range ? alertIcon : studentIcon}
            >
              <Popup>
                <Box sx={{ lineHeight: 1.6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: s.out_of_range ? '#c62828' : '#2c2c2c' }}>
                    {s.first_name} {s.last_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                    ת.ז.&nbsp;{s.id_number}
                  </Typography>
                  {s.distance_km != null && (
                    <Typography variant="caption" sx={{ color: s.out_of_range ? '#c62828' : '#555' }}>
                      {s.distance_km} ק"מ מהמורה
                    </Typography>
                  )}
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}

const styles = {
  container: {
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.7)',
  },
  heading: {
    fontWeight: 600,
    px: 2,
    py: 1.5,
    borderBottom: '1px solid #f0f0f0',
    color: '#2c2c2c',
  },
  mapWrapper: {
    height: 400,
    position: 'relative',
    '& .leaflet-container': {
      borderRadius: '0 0 8px 8px',
    },
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    zIndex: 1000,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease, background 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.98)',
      boxShadow: '0 4px 18px rgba(0,0,0,0.16)',
    },
  },
};

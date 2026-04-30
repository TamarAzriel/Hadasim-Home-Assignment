import { useState } from 'react';
import {
  Box, TextField, Button, Typography, Paper, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function LoginPage() {
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (!/^\d{9}$/.test(idNumber)) {
      alert('מספר תעודת הזהות חייב להכיל 9 ספרות.');
      return;
    }

    setLoading(true);
    try {
      await api.verifyTeacher(idNumber);
      login(idNumber);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message === 'Teacher not found.'
        ? 'מורה לא נמצאת. בדקי את מספר הזהות.'
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={styles.page}>
      <Paper sx={styles.card} elevation={0}>
        <Typography variant="h5" sx={styles.title}>
          כניסה למורה
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
          הזיני את מספר תעודת הזהות שלך
        </Typography>

        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="מספר תעודת זהות"
            value={idNumber}
            onChange={e => setIdNumber(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ maxLength: 9, pattern: '\\d{9}' }}
            autoFocus
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={styles.btn}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'כניסה'}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/')}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            חזרה להרשמה
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8f6f2 0%, #ede8df 100%)',
    p: 2,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    p: { xs: 3, sm: 4 },
    borderRadius: 3,
    border: '1px solid rgba(0,0,0,0.07)',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    textAlign: 'center',
    fontWeight: 600,
    mb: 1,
    letterSpacing: '-0.5px',
    color: '#2c2c2c',
  },
  btn: {
    py: 1.2,
    background: '#2c2c2c',
    '&:hover': { background: '#444' },
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 600,
  },
};

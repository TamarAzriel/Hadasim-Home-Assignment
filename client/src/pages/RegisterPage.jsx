import { useState } from 'react';
import {
  Box, Tabs, Tab, TextField, Button, Typography,
  Snackbar, Alert, Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const emptyForm = { first_name: '', last_name: '', id_number: '', class_name: '' };

export default function RegisterPage() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const navigate = useNavigate();

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    if (!form.first_name || !form.last_name || !form.id_number || !form.class_name) {
      return 'כל השדות הם חובה.';
    }
    if (!/^\d{9}$/.test(form.id_number)) {
      return 'מספר תעודת הזהות חייב להכיל בדיוק 9 ספרות.';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { alert(err); return; }

    try {
      if (tab === 0) {
        await api.registerStudent(form);
      } else {
        await api.registerTeacher(form);
      }
      setSnack({ open: true, msg: 'הרישום הושלם בהצלחה!', severity: 'success' });
      setForm(emptyForm);
    } catch (ex) {
      setSnack({ open: true, msg: ex.message, severity: 'error' });
    }
  }

  return (
    <Box sx={styles.page}>
      <Paper sx={styles.card} elevation={0}>
        <Typography variant="h5" sx={styles.title}>
          בנות משה - רישום לטיול
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setForm(emptyForm); }}
          centered
          sx={styles.tabs}
        >
          <Tab label="תלמידה" />
          <Tab label="מורה" />
        </Tabs>

        <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
          <TextField
            label="שם פרטי"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            fullWidth
            size="small"
          />
          <TextField
            label="שם משפחה"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            fullWidth
            size="small"
          />
          <TextField
            label="מספר תעודת זהות"
            name="id_number"
            value={form.id_number}
            onChange={handleChange}
            fullWidth
            size="small"
            inputProps={{ maxLength: 9, pattern: '\\d{9}' }}
            helperText="9 ספרות בדיוק"
          />
          <TextField
            label="כיתה"
            name="class_name"
            value={form.class_name}
            onChange={handleChange}
            fullWidth
            size="small"
          />

          <Button type="submit" variant="contained" fullWidth sx={styles.btn}>
            הרשמה
          </Button>

          {tab === 1 && (
            <Button
              variant="text"
              fullWidth
              size="small"
              onClick={() => navigate('/login')}
              sx={{ mt: 0.5, color: 'text.secondary' }}
            >
              כבר רשומה? כניסה לדשבורד
            </Button>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
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
    maxWidth: 420,
    p: { xs: 3, sm: 4 },
    borderRadius: 3,
    border: '1px solid rgba(0,0,0,0.07)',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    textAlign: 'center',
    fontWeight: 600,
    mb: 2,
    letterSpacing: '-0.5px',
    color: '#2c2c2c',
  },
  tabs: {
    mb: 3,
    '& .MuiTab-root': { fontWeight: 500 },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  btn: {
    mt: 1,
    py: 1.2,
    background: '#2c2c2c',
    '&:hover': { background: '#444' },
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
};

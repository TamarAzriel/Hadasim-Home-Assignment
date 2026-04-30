import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import RegisterPage  from './pages/RegisterPage';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
  palette: {
    background: { default: '#f8f6f2' },
  },
  components: {
    MuiTextField: {
      defaultProps: { dir: 'rtl' },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"          element={<RegisterPage />}  />
            <Route path="/login"     element={<LoginPage />}     />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

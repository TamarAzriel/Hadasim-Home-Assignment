import {
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Paper, Typography, Chip,
} from '@mui/material';

const palette = {
  safe: {
    row:        'rgba(209, 250, 229, 0.45)',
    border:     '#6ee7b7',
    chip:       { background: 'rgba(209,250,229,0.8)', color: '#065f46' },
  },
  alert: {
    row:        'rgba(254, 226, 226, 0.5)',
    border:     '#fca5a5',
    chip:       { background: 'rgba(254,226,226,0.8)', color: '#991b1b' },
  },
  neutral: {
    chip:       { background: '#f5f5f5', color: '#555' },
  },
};

function rowStyle(s) {
  if (s.out_of_range)                          return palette.alert.row;
  if (s.latitude != null && s.longitude != null) return palette.safe.row;
  return 'transparent';
}

function borderStyle(s) {
  if (s.out_of_range)                          return `3px solid ${palette.alert.border}`;
  if (s.latitude != null && s.longitude != null) return `3px solid ${palette.safe.border}`;
  return '3px solid transparent';
}

export default function StudentsTable({ students }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={styles.container}>
      <Typography variant="subtitle1" sx={styles.heading}>
        תלמידות הכיתה שלי
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 600, color: '#555', borderBottom: '1px solid #e0e0e0' } }}>
            <TableCell>שם פרטי</TableCell>
            <TableCell>שם משפחה</TableCell>
            <TableCell>ת.ז.</TableCell>
            <TableCell>מיקום אחרון</TableCell>
            <TableCell>מרחק</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ color: '#aaa', py: 3 }}>
                אין תלמידות רשומות בכיתה זו
              </TableCell>
            </TableRow>
          ) : (
            students.map(s => (
              <TableRow
                key={s.id_number}
                hover
                sx={{
                  ...styles.row,
                  background:  rowStyle(s),
                  borderRight: borderStyle(s),
                }}
              >
                <TableCell>{s.first_name}</TableCell>
                <TableCell>{s.last_name}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{s.id_number}</TableCell>
                <TableCell>
                  {s.latitude && s.longitude ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#2e7d32' }}>
                      {parseFloat(s.latitude).toFixed(4)},&nbsp;{parseFloat(s.longitude).toFixed(4)}
                    </span>
                  ) : (
                    <span style={{ color: '#bbb', fontSize: '0.8rem' }}>—</span>
                  )}
                </TableCell>
                <TableCell>
                  {s.distance_km != null ? (
                    <Chip
                      label={`${s.distance_km} ק"מ`}
                      size="small"
                      sx={{
                        fontSize:   '0.7rem',
                        fontWeight: s.out_of_range ? 600 : 400,
                        ...(s.out_of_range ? palette.alert.chip : palette.neutral.chip),
                      }}
                    />
                  ) : (
                    <span style={{ color: '#bbb', fontSize: '0.8rem' }}>—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const styles = {
  container: {
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
  },
  heading: {
    fontWeight: 600,
    px: 2,
    py: 1.5,
    borderBottom: '1px solid #f0f0f0',
    color: '#2c2c2c',
  },
  row: {
    transition: 'background 0.2s ease',
    '&:last-child td': { border: 0 },
    '& td': { fontSize: '0.875rem' },
  },
};

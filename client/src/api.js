// All paths are relative — Vite proxies /api → server
const BASE = '/api';

// SSE must bypass Vite's proxy (it buffers event-stream writes and breaks real-time delivery)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

function getTeacherId() {
  return sessionStorage.getItem('teacherId') || '';
}

async function request(method, path, body, teacherIdOverride) {
  const headers = { 'Content-Type': 'application/json' };
  const tid = teacherIdOverride ?? getTeacherId();
  if (tid) headers['teacher-id'] = tid;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  registerTeacher:      (body) => request('POST', '/teachers', body),
  registerStudent:      (body) => request('POST', '/students', body),
  getTeacher:           (id)   => request('GET',  `/teachers/${id}`),
  getTeachers:          ()     => request('GET',  '/teachers'),
  getMyStudents:        ()     => request('GET',  '/my-students'),
  getStudentLocations:  ()     => request('GET',  '/student-locations'),
  updateTeacherLocation:(body) => request('POST', '/teacher-location', body),
  // Used during login to verify the teacher exists before committing to sessionStorage
  verifyTeacher:        (id)   => request('GET',  '/my-students', undefined, id),
};

export function openLocationStream() {
  const tid = getTeacherId();
  return new EventSource(`${SERVER_URL}/api/location-stream?teacher-id=${encodeURIComponent(tid)}`);
}

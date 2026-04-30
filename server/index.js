const express = require('express');
const cors = require('cors');
const { dbRun, dbGet, dbAll } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());


const classClients = new Map();

function sendToClass(className, data) {
    const clients = classClients.get(className);
    if (!clients?.size) return;
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => client.write(payload));
}


// teacher-id header must match a DB record
async function teacherAuth(req, res, next) {
    const teacherId = req.headers['teacher-id'] || req.query['teacher-id'];
    if (!teacherId) return res.status(401).json({ error: 'Teacher ID required (teacher-id header).' });

    try {
        const teacher = await dbGet('SELECT * FROM teachers WHERE id_number = ?', [teacherId]);
        if (!teacher) return res.status(403).json({ error: 'Teacher not found.' });
        req.teacher = teacher;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


function dmsToDecimal({ Degrees = 0, Minutes = 0, Seconds = 0 }) {
    return parseFloat(Degrees) + parseFloat(Minutes) / 60 + parseFloat(Seconds) / 3600;
}

function isValidDMSComponent({ Degrees, Minutes, Seconds }) {
    const d = parseFloat(Degrees);
    const m = parseFloat(Minutes);
    const s = parseFloat(Seconds);
    return !isNaN(d) && !isNaN(m) && !isNaN(s) && m >= 0 && m < 60 && s >= 0 && s < 60;
}

function isValidCoordinates(coords) {
    return coords?.Latitude && coords?.Longitude &&
        isValidDMSComponent(coords.Latitude) &&
        isValidDMSComponent(coords.Longitude);
}

// 3 km safety perimeter — students beyond this are flagged as out of range
const OUT_OF_RANGE_KM = 3;

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function withProximity(student, teacherLat, teacherLon) {
    if (student.latitude == null || student.longitude == null || teacherLat == null || teacherLon == null) {
        return { ...student, distance_km: null, out_of_range: false };
    }
    const distance_km = parseFloat(
        haversineDistance(teacherLat, teacherLon, student.latitude, student.longitude).toFixed(3)
    );
    return { ...student, distance_km, out_of_range: distance_km > OUT_OF_RANGE_KM };
}


app.post('/api/teachers', async (req, res) => {
    const { first_name, last_name, id_number, class_name } = req.body;

    if (!first_name || !last_name || !id_number || !class_name)
        return res.status(400).json({ error: 'All fields are required.' });

    try {
        await dbRun(
            'INSERT INTO teachers (first_name, last_name, id_number, class_name) VALUES (?, ?, ?, ?)',
            [first_name, last_name, id_number, class_name]
        );
        res.status(201).json({ first_name, last_name, id_number, class_name });
    } catch (err) {
        const isDuplicate = err.message.includes('UNIQUE constraint failed');
        res.status(isDuplicate ? 400 : 500).json({
            error: isDuplicate ? 'Teacher with this ID already exists.' : err.message,
        });
    }
});

app.post('/api/students', async (req, res) => {
    const { first_name, last_name, id_number, class_name } = req.body;

    if (!first_name || !last_name || !id_number || !class_name)
        return res.status(400).json({ error: 'All fields are required.' });

    try {
        await dbRun(
            'INSERT INTO students (first_name, last_name, id_number, class_name) VALUES (?, ?, ?, ?)',
            [first_name, last_name, id_number, class_name]
        );
        res.status(201).json({ first_name, last_name, id_number, class_name });
    } catch (err) {
        const isDuplicate = err.message.includes('UNIQUE constraint failed');
        res.status(isDuplicate ? 400 : 500).json({
            error: isDuplicate ? 'Student with this ID already exists.' : err.message,
        });
    }
});


app.get('/api/teachers', teacherAuth, async (req, res) => {
    res.json(await dbAll('SELECT * FROM teachers'));
});

app.get('/api/teachers/:id_number', teacherAuth, async (req, res) => {
    const teacher = await dbGet('SELECT * FROM teachers WHERE id_number = ?', [req.params.id_number]);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
    res.json(teacher);
});

app.get('/api/students', teacherAuth, async (req, res) => {
    res.json(await dbAll('SELECT * FROM students'));
});

app.get('/api/students/:id_number', teacherAuth, async (req, res) => {
    const student = await dbGet('SELECT * FROM students WHERE id_number = ?', [req.params.id_number]);
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json(student);
});

app.get('/api/my-students', teacherAuth, async (req, res) => {
    res.json(await dbAll('SELECT * FROM students WHERE class_name = ?', [req.teacher.class_name]));
});

app.get('/api/student-locations', teacherAuth, async (req, res) => {
    const students = await dbAll(
        'SELECT * FROM students WHERE class_name = ? AND longitude IS NOT NULL',
        [req.teacher.class_name]
    );
    const { latitude, longitude } = req.teacher;
    res.json(students.map(s => withProximity(s, latitude, longitude)));
});

// teacher sends her own location in the same DMS format as students
app.post('/api/teacher-location', teacherAuth, async (req, res) => {
    const { Coordinates, Time } = req.body;

    if (!Time || !isValidCoordinates(Coordinates))
        return res.status(400).json({ error: 'Invalid location data format.' });

    const lat = dmsToDecimal(Coordinates.Latitude);
    const lon = dmsToDecimal(Coordinates.Longitude);

    try {
        await dbRun(
            'UPDATE teachers SET latitude = ?, longitude = ?, last_updated = ? WHERE id_number = ?',
            [lat, lon, Time, req.teacher.id_number]
        );
        res.json({ message: 'Teacher location updated.', latitude: lat, longitude: lon });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// teachers subscribe here to get real-time location pushes for their class
app.get('/api/location-stream', teacherAuth, (req, res) => {
    const { class_name, id_number } = req.teacher;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!classClients.has(class_name)) classClients.set(class_name, new Set());
    classClients.get(class_name).add(res);
    console.log(`Teacher ${id_number} subscribed to SSE for class "${class_name}"`);

    const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
        classClients.get(class_name)?.delete(res);
        console.log(`Teacher ${id_number} unsubscribed from SSE`);
    });
});


// intentionally public — student devices POST without credentials
app.post('/api/tracking', async (req, res) => {
    const { ID, Coordinates, Time } = req.body;

    if (!ID || !Time || !isValidCoordinates(Coordinates))
        return res.status(400).json({ error: 'Invalid tracking data format.' });

    try {
        const student = await dbGet('SELECT * FROM students WHERE id_number = ?', [ID.toString()]);
        if (!student) return res.status(404).json({ error: 'Student not found.' });

        const lon = dmsToDecimal(Coordinates.Longitude);
        const lat = dmsToDecimal(Coordinates.Latitude);

        await dbRun(
            'UPDATE students SET longitude = ?, latitude = ?, last_updated = ? WHERE id_number = ?',
            [lon, lat, Time, ID.toString()]
        );

        const teacher = await dbGet('SELECT latitude, longitude FROM teachers WHERE class_name = ?', [student.class_name]);

        let distance_km = null;
        let out_of_range = false;
        if (teacher?.latitude != null && teacher?.longitude != null) {
            distance_km = parseFloat(
                haversineDistance(teacher.latitude, teacher.longitude, lat, lon).toFixed(3)
            );
            out_of_range = distance_km > OUT_OF_RANGE_KM;
        }

        sendToClass(student.class_name, {
            student_id_number: ID.toString(),
            first_name: student.first_name,
            last_name: student.last_name,
            longitude: lon,
            latitude: lat,
            last_updated: Time,
            distance_km,
            out_of_range,
        });

        res.json({ message: 'Location updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

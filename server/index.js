const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(cors());


// Root route to check if the server is running
app.get('/', (req, res) => {
    res.send('School trip system server is up and running');
});


// Endpoint to add a new teacher to the database
app.post('/api/teachers', (req, res) => {
    const { id, name, className } = req.body;

    // Simple validation: make sure all fields are provided
    if (!id || !name || !className) {
        return res.status(400).json({ error: "All fields are required (ID, Name, Class)." });
    }

    const sql = `INSERT INTO teachers (id, name, class) VALUES (?, ?, ?)`;
    const params = [id, name, className];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error inserting teacher:", err.message);
            return res.status(500).json({ error: "Failed to add teacher. The ID might already exist." });
        }
        
        // Success! Return the newly created teacher details
        res.status(201).json({
            message: "Teacher added successfully!",
            data: { id, name, className }
        });
    });
});

// Endpoint to add a new student to the database
app.post('/api/students', (req, res) => {
    const { id, name, className } = req.body;

    // Simple validation: make sure all fields are provided
    if (!id || !name || !className) {
        return res.status(400).json({ error: "All fields are required (ID, Name, Class)." });
    }

    const sql = `INSERT INTO students (id, name, class) VALUES (?, ?, ?)`;
    const params = [id, name, className];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error inserting student:", err.message);
            return res.status(500).json({ error: "Failed to add student. The ID might already exist." });
        }
        
        // Success! Return the newly created student details
        res.status(201).json({
            message: "Student added successfully!",
            data: { id, name, className }
        });
    });
});


//  Get all teachers
app.get('/api/teachers', (req, res) => {
    const sql = "SELECT * FROM teachers";
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching teachers:", err.message);
            return res.status(500).json({ error: "Failed to fetch teachers." });
        }
        res.status(200).json(rows);
    });
});

// Get all students
app.get('/api/students', (req, res) => {
    const sql = "SELECT * FROM students";
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching students:", err.message);
            return res.status(500).json({ error: "Failed to fetch students." });
        }
        res.status(200).json(rows);
    });
});

// Get a specific teacher by ID
app.get('/api/teachers/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM teachers WHERE id = ?";

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error("Error fetching teacher:", err.message);
            return res.status(500).json({ error: "Database error." });
        }
        if (!row) {
            return res.status(404).json({ error: "Teacher not found." });
        }
        res.status(200).json(row);
    });
});

// Get a specific student by ID
app.get('/api/students/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM students WHERE id = ?";

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error("Error fetching student:", err.message);
            return res.status(500).json({ error: "Database error." });
        }
        if (!row) {
            return res.status(404).json({ error: "Student not found." });
        }
        res.status(200).json(row);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
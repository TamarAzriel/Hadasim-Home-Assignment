const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(cors());

//  Connect to SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to the SQLite database successfully.");
    }
});

// Root route to check if the server is running
app.get('/', (req, res) => {
    res.send('School trip system server is up and running');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'school.db'));

db.serialize(() => {
    db.run('PRAGMA journal_mode = WAL');

    db.run(`
        CREATE TABLE IF NOT EXISTS teachers (
            id_number  TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name  TEXT NOT NULL,
            class_name TEXT NOT NULL,
            latitude   REAL,
            longitude  REAL,
            last_updated TEXT
        )
    `);

    // Migrate existing DB — ignored silently if columns already exist
    db.run('ALTER TABLE teachers ADD COLUMN latitude REAL',      () => {});
    db.run('ALTER TABLE teachers ADD COLUMN longitude REAL',     () => {});
    db.run('ALTER TABLE teachers ADD COLUMN last_updated TEXT',  () => {});

    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id_number    TEXT PRIMARY KEY,
            first_name   TEXT NOT NULL,
            last_name    TEXT NOT NULL,
            class_name   TEXT NOT NULL,
            latitude     REAL,
            longitude    REAL,
            last_updated TEXT
        )
    `);
});

const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

module.exports = { dbRun, dbGet, dbAll };

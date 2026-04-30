const { dbRun } = require('./database');

const CLASSES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'];

const TEACHERS = [
  { first_name: 'רחל',   last_name: 'כהן'     },
  { first_name: 'שרה',   last_name: 'לוי'     },
  { first_name: 'מרים',  last_name: 'מזרחי'   },
  { first_name: 'דבורה', last_name: 'פרץ'     },
  { first_name: 'אסתר',  last_name: 'ביטון'   },
  { first_name: 'חנה',   last_name: 'שפירא'   },
  { first_name: 'נעמי',  last_name: 'אברהם'   },
  { first_name: 'יעל',   last_name: 'גרינברג' },
];

const FIRST_NAMES = [
  'תמר',    'נועה',   'שירה',   'מיכל',   'אדוה',
  'גל',     'ורד',    'אורית',  'נורית',  'טובה',
  'שושנה',  'פנינה',  'זהבה',   'אביגיל', 'בת-שבע',
  'ציפורה', 'עדינה',  'גילה',   'חגית',   'שפרה',
  'ריבה',   'דינה',   'רות',    'לאה',    'יוכבד',
  'נעמה',   'מורן',   'שני',    'רוני',   'איילת',
  'ענת',    'אפרת',   'דפנה',   'הדס',    'ירדן',
  'כרמית',  'לירון',  'מיה',    'נטע',    'שלומית',
];

const LAST_NAMES = [
  'בן-דוד',    'רוזנברג',   'אדלר',     'פרידמן',    'גולדשטיין',
  'מוסקוביץ',  'שרון',      'אשכנזי',   'בן-יוסף',   'חיים',
  'שלמה',      'יעקב',      'דוד',       'ספרדי',     'בר-לב',
  'גבעוני',    'שמשון',     'אלון',      'ברק',        'כרמי',
  'ניר',       'עמית',      'פלד',       'צור',        'קדם',
  'רגב',       'שגיא',      'אוריאן',    'בוחבוט',    'נחשון',
];

// Spread pins around central Jerusalem
const JER_LAT = 31.7716;
const JER_LON = 35.2137;

function jitter() {
  return (Math.random() - 0.5) * 0.03;
}

async function seed() {
  for (let i = 0; i < CLASSES.length; i++) {
    const className = CLASSES[i];
    const teacher   = TEACHERS[i];
    const teacherId = (100000001 + i).toString();

    await dbRun(
      'INSERT OR IGNORE INTO teachers (id_number, first_name, last_name, class_name) VALUES (?, ?, ?, ?)',
      [teacherId, teacher.first_name, teacher.last_name, className]
    );

    for (let j = 0; j < 5; j++) {
      const studentIndex = i * 5 + j;
      const studentId    = (200000001 + studentIndex).toString();
      const firstName    = FIRST_NAMES[studentIndex];
      const lastName     = LAST_NAMES[studentIndex % LAST_NAMES.length];
      const lat          = +(JER_LAT + jitter()).toFixed(6);
      const lon          = +(JER_LON + jitter()).toFixed(6);
      const now          = new Date().toISOString();

      // ON CONFLICT: always reset coordinates so re-seeding moves everyone back to Jerusalem
      await dbRun(
        `INSERT INTO students (id_number, first_name, last_name, class_name, latitude, longitude, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id_number) DO UPDATE SET
           latitude     = excluded.latitude,
           longitude    = excluded.longitude,
           last_updated = excluded.last_updated`,
        [studentId, firstName, lastName, className, lat, lon, now]
      );
    }
  }

  console.log('Seed complete: 8 teachers, 40 students.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

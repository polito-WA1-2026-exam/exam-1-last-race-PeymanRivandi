import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('./lastrace.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lines (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT UNIQUE NOT NULL,
    color     TEXT NOT NULL,
    hex_color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS line_stations (
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    position   INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect      INTEGER NOT NULL CHECK (effect BETWEEN -4 AND 4)
  );

  CREATE TABLE IF NOT EXISTS games (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    score     INTEGER NOT NULL,
    played_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const seed = db.transaction(() => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count > 0) return;

  // --- Users ---
  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  );
  const userList = [
    { username: 'jon',      password: 'snow' },
    { username: 'daenerys', password: 'dragon' },
    { username: 'tyrion',   password: 'lannister' },
  ];
  const userIds = {};
  for (const u of userList) {
    const hash = bcrypt.hashSync(u.password, 10);
    const result = insertUser.run(u.username, hash);
    userIds[u.username] = result.lastInsertRowid;
  }

  // --- Lines ---
  const insertLine = db.prepare(
    'INSERT INTO lines (name, color, hex_color) VALUES (?, ?, ?)'
  );
  const lineList = [
    { name: 'Kingsroad Line',   color: 'White',  hex_color: '#ffffff' },
    { name: 'White Knife Line', color: 'Blue',   hex_color: '#0026ff' },
    { name: 'Gold Road Line',   color: 'Red',    hex_color: '#ff0000' },
    { name: 'Roseroad Line',    color: 'Green',  hex_color: '#00ff21' },
    { name: 'Ocean Road Line',  color: 'Cyan',   hex_color: '#00ffff' },
  ];
  const lineIds = {};
  for (const l of lineList) {
    const result = insertLine.run(l.name, l.color, l.hex_color);
    lineIds[l.name] = result.lastInsertRowid;
  }

  // --- Stations ---
  const insertStation = db.prepare('INSERT INTO stations (name) VALUES (?)');
  const stationNames = [
    'Winterfell', 'Greywater Watch', 'The Twins', 'Riverrun',
    "King's Landing", 'Dragonstone', 'Gultown',
    'White Harbor', 'The Eyrie', 'Pyke',
    'Lannisport', 'Highgarden', 'Oldtown',
    'Starfall', 'Sunspear', "Storm's End",
  ];
  const stationIds = {};
  for (const name of stationNames) {
    const result = insertStation.run(name);
    stationIds[name] = result.lastInsertRowid;
  }

  // --- Line-Station connections (defines topology + order) ---
  const insertLS = db.prepare(
    'INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)'
  );
  const topology = {
    'Kingsroad Line':   ['Winterfell', 'Greywater Watch', 'The Twins', 'Riverrun', "King's Landing", 'Dragonstone', 'Gultown'],
    'White Knife Line': ['White Harbor', 'The Eyrie', 'Riverrun', 'Pyke'],
    'Gold Road Line':   ['Lannisport', 'Highgarden', "King's Landing", 'The Eyrie'],
    'Roseroad Line':    ['Highgarden', 'Oldtown', 'Starfall', 'Sunspear', "Storm's End"],
    'Ocean Road Line':  ['Lannisport', 'Pyke', 'Winterfell', 'White Harbor'],
  };
  for (const [lineName, stations] of Object.entries(topology)) {
    stations.forEach((stationName, index) => {
      insertLS.run(lineIds[lineName], stationIds[stationName], index + 1);
    });
  }

  // --- Events ---
  const insertEvent = db.prepare(
    'INSERT INTO events (description, effect) VALUES (?, ?)'
  );
  const events = [
    { description: 'Quiet journey, no surprises.',              effect:  0 },
    { description: 'Wrong platform — had to backtrack.',        effect: -2 },
    { description: 'A kind passenger offered you their seat.',  effect:  1 },
    { description: 'Train delayed, coins lost waiting.',        effect: -1 },
    { description: 'Found a lucky coin on the floor.',          effect:  2 },
    { description: 'Pickpocket struck in the crowd.',           effect: -3 },
    { description: 'Station vendor gave you free coffee.',      effect:  1 },
    { description: 'Signal failure — long wait ahead.',         effect: -4 },
    { description: 'Express service, arrived ahead of time.',   effect:  3 },
    { description: 'Overcrowded carriage, exhausting trip.',    effect: -1 },
  ];
  for (const e of events) {
    insertEvent.run(e.description, e.effect);
  }

  // --- Past games (jon and daenerys have already played) ---
  const insertGame = db.prepare(
    'INSERT INTO games (user_id, score, played_at) VALUES (?, ?, ?)'
  );
  insertGame.run(userIds['jon'],      15, '2026-05-28 10:00:00');
  insertGame.run(userIds['jon'],       8, '2026-05-29 14:30:00');
  insertGame.run(userIds['daenerys'], 20, '2026-05-27 09:00:00');
  insertGame.run(userIds['daenerys'], 12, '2026-05-30 16:00:00');
  insertGame.run(userIds['daenerys'],  5, '2026-05-31 11:00:00');
});

seed();

export default db;

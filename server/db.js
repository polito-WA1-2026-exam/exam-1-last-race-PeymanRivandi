/** DB access module **/

import sqlite3 from 'sqlite3';
import crypto from 'crypto';

const db = new sqlite3.Database('lastrace.db', (err) => {
  if (err) throw err;
});

// Promisified helpers — sqlite3 is callback-based, so we wrap each call
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // `this.lastID` = last inserted id, `this.changes` = rows affected
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { hash, salt };
}

export async function initDb() {
  await dbRun('PRAGMA foreign_keys = ON');

  await dbRun(`CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    hash     TEXT NOT NULL,
    salt     TEXT NOT NULL
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS lines (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT UNIQUE NOT NULL,
    color     TEXT NOT NULL,
    hex_color TEXT NOT NULL
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS line_stations (
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    position   INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect      INTEGER NOT NULL CHECK (effect BETWEEN -4 AND 4)
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS games (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    score     INTEGER NOT NULL,
    played_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // Skip seeding if data already exists
  const row = await dbGet('SELECT COUNT(*) as count FROM users');
  if (row.count > 0) return;

  await dbRun('BEGIN TRANSACTION');
  try {
    // --- Users ---
    const userList = [
      { username: 'jon',      password: 'snow' },
      { username: 'daenerys', password: 'dragon' },
      { username: 'tyrion',   password: 'lannister' },
    ];
    const userIds = {};
    for (const u of userList) {
      const { hash, salt } = hashPassword(u.password);
      const result = await dbRun(
        'INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)',
        [u.username, hash, salt]
      );
      userIds[u.username] = result.lastID;
    }

    // --- Lines ---
    const lineList = [
      { name: 'Kingsroad Line',   color: 'White', hex_color: '#ffffff' },
      { name: 'White Knife Line', color: 'Blue',  hex_color: '#0026ff' },
      { name: 'Gold Road Line',   color: 'Red',   hex_color: '#ff0000' },
      { name: 'Roseroad Line',    color: 'Green', hex_color: '#00ff21' },
      { name: 'Ocean Road Line',  color: 'Cyan',  hex_color: '#00ffff' },
    ];
    const lineIds = {};
    for (const l of lineList) {
      const result = await dbRun(
        'INSERT INTO lines (name, color, hex_color) VALUES (?, ?, ?)',
        [l.name, l.color, l.hex_color]
      );
      lineIds[l.name] = result.lastID;
    }

    // --- Stations ---
    const stationNames = [
      'Winterfell', 'Greywater Watch', 'The Twins', 'Riverrun',
      "King's Landing", 'Dragonstone', 'Gultown',
      'White Harbor', 'The Eyrie', 'Pyke',
      'Lannisport', 'Highgarden', 'Oldtown',
      'Starfall', 'Sunspear', "Storm's End",
    ];
    const stationIds = {};
    for (const name of stationNames) {
      const result = await dbRun('INSERT INTO stations (name) VALUES (?)', [name]);
      stationIds[name] = result.lastID;
    }

    // --- Line-station connections (defines topology and stop order) ---
    const topology = {
      'Kingsroad Line':   ['Winterfell', 'Greywater Watch', 'The Twins', 'Riverrun', "King's Landing", 'Dragonstone', 'Gultown'],
      'White Knife Line': ['White Harbor', 'The Eyrie', 'Riverrun', 'Pyke'],
      'Gold Road Line':   ['Lannisport', 'Highgarden', "King's Landing", 'The Eyrie'],
      'Roseroad Line':    ['Highgarden', 'Oldtown', 'Starfall', 'Sunspear', "Storm's End"],
      'Ocean Road Line':  ['Lannisport', 'Pyke', 'Winterfell', 'White Harbor'],
    };
    for (const [lineName, stations] of Object.entries(topology)) {
      for (let i = 0; i < stations.length; i++) {
        await dbRun(
          'INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)',
          [lineIds[lineName], stationIds[stations[i]], i + 1]
        );
      }
    }

    // --- Events ---
    const events = [
      { description: 'Quiet journey, no surprises.',             effect:  0 },
      { description: 'Wrong platform — had to backtrack.',       effect: -2 },
      { description: 'A kind passenger offered you their seat.', effect:  1 },
      { description: 'Train delayed, coins lost waiting.',       effect: -1 },
      { description: 'Found a lucky coin on the floor.',         effect:  2 },
      { description: 'Pickpocket struck in the crowd.',          effect: -3 },
      { description: 'Station vendor gave you free coffee.',     effect:  1 },
      { description: 'Signal failure — long wait ahead.',        effect: -4 },
      { description: 'Express service, arrived ahead of time.',  effect:  3 },
      { description: 'Overcrowded carriage, exhausting trip.',   effect: -1 },
    ];
    for (const e of events) {
      await dbRun(
        'INSERT INTO events (description, effect) VALUES (?, ?)',
        [e.description, e.effect]
      );
    }

    // --- Past games (jon and daenerys have played before) ---
    await dbRun('INSERT INTO games (user_id, score, played_at) VALUES (?, ?, ?)', [userIds['jon'],      15, '2026-05-28 10:00:00']);
    await dbRun('INSERT INTO games (user_id, score, played_at) VALUES (?, ?, ?)', [userIds['jon'],       8, '2026-05-29 14:30:00']);
    await dbRun('INSERT INTO games (user_id, score, played_at) VALUES (?, ?, ?)', [userIds['daenerys'], 20, '2026-05-27 09:00:00']);
    await dbRun('INSERT INTO games (user_id, score, played_at) VALUES (?, ?, ?)', [userIds['daenerys'], 12, '2026-05-30 16:00:00']);
    await dbRun('INSERT INTO games (user_id, score, played_at) VALUES (?, ?, ?)', [userIds['daenerys'],  5, '2026-05-31 11:00:00']);

    await dbRun('COMMIT');
  } catch (err) {
    await dbRun('ROLLBACK');
    throw err;
  }
}

export default db;

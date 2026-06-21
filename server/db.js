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
      { description: 'Uneventful crossing through the Kingsroad.',                            effect:  0 },
      { description: 'Boarded the wrong carriage, forced to backtrack through the Riverlands.', effect: -2 },
      { description: 'A kind crow shared directions and a copper coin.',                       effect:  1 },
      { description: 'Sellswords at the gate demanded a toll for passage.',                    effect: -1 },
      { description: 'Lannister guards cleared the platform. You boarded without delay.',      effect:  2 },
      { description: 'A cutpurse from Flea Bottom lifted your coin pouch.',                    effect: -3 },
      { description: 'A maester tended to travelers with herbs fresh from Oldtown.',           effect:  1 },
      { description: 'Wildfire explosion blocked the tunnel. Emergency evacuation required.',  effect: -4 },
      { description: 'Dragon sighted beyond the hills. The panicked crowd made way for you.', effect:  3 },
      { description: 'Night Watch conscriptors held up the platform. Departure delayed.',      effect: -1 },
      { description: 'The Hand of the King granted you free passage and a full escort.',       effect:  4 },
      { description: 'White Walker frost swept through. All trains north of the Neck halted.', effect: -4 },
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

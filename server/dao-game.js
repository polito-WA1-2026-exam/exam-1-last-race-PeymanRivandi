/** DAO module for game data: adjacency, validation, events, scores, ranking **/

import db from './db.js';

export default function GameDao() {

    // Builds { stationId: [neighborId, ...] } from line_stations — used for BFS
    this.getAdjacency = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT ls1.station_id AS from_id, ls2.station_id AS to_id
                FROM line_stations ls1
                JOIN line_stations ls2 ON ls1.line_id  = ls2.line_id
                                      AND ls2.position = ls1.position + 1
            `;
            db.all(sql, [], (err, rows) => {
                if (err) { reject(err); return; }
                const adj = {};
                for (const row of rows) {
                    if (!adj[row.from_id]) adj[row.from_id] = [];
                    if (!adj[row.to_id])   adj[row.to_id]   = [];
                    adj[row.from_id].push(row.to_id);
                    adj[row.to_id].push(row.from_id);   // network is bidirectional
                }
                resolve(adj);
            });
        });
    };

    // Returns all stations { id, name }
    this.getAllStations = () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, name FROM stations', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    // Returns data needed to validate a submitted route:
    //   segmentLines  — { "minId-maxId": [lineId, ...] }
    //   interchangeIds — Set of station IDs that are on more than one line
    this.getValidationData = () => {
        return new Promise((resolve, reject) => {
            const segSql = `
                SELECT ls1.station_id AS from_id, ls2.station_id AS to_id, ls1.line_id
                FROM line_stations ls1
                JOIN line_stations ls2 ON ls1.line_id  = ls2.line_id
                                      AND ls2.position = ls1.position + 1
            `;
            db.all(segSql, [], (err, segRows) => {
                if (err) { reject(err); return; }

                const interSql = `
                    SELECT station_id FROM line_stations
                    GROUP BY station_id HAVING COUNT(DISTINCT line_id) > 1
                `;
                db.all(interSql, [], (err, interRows) => {
                    if (err) { reject(err); return; }

                    // Build canonical segment key → list of lines that contain it
                    const segmentLines = {};
                    for (const row of segRows) {
                        const key = `${Math.min(row.from_id, row.to_id)}-${Math.max(row.from_id, row.to_id)}`;
                        if (!segmentLines[key]) segmentLines[key] = [];
                        if (!segmentLines[key].includes(row.line_id))
                            segmentLines[key].push(row.line_id);
                    }

                    const interchangeIds = new Set(interRows.map(r => r.station_id));
                    resolve({ segmentLines, interchangeIds });
                });
            });
        });
    };

    // Returns one random event from the events table
    this.getRandomEvent = () => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM events ORDER BY RANDOM() LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    };

    // Saves a completed game (score is already clamped to >= 0 before calling)
    this.saveGame = (userId, score) => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO games (user_id, score) VALUES (?, ?)',
                [userId, score],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    };

    // Returns the best score per user, sorted descending — used for the ranking page
    this.getRanking = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.username, MAX(g.score) AS best_score
                FROM games g
                JOIN users u ON u.id = g.user_id
                GROUP BY g.user_id
                ORDER BY best_score DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

}

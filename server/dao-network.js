/** DAO module for accessing network data (lines, stations, segments) **/

import db from './db.js';

export default function NetworkDao() {

    // Returns all lines, each with their stations in order — used in the Setup phase
    this.getNetwork = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT l.id    AS line_id,   l.name AS line_name,
                       l.hex_color,
                       s.id    AS station_id, s.name AS station_name,
                       ls.position
                FROM lines l
                JOIN line_stations ls ON l.id = ls.line_id
                JOIN stations s      ON s.id  = ls.station_id
                ORDER BY l.id, ls.position
            `;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Group flat rows into lines with a nested stations array
                    const map = {};
                    for (const row of rows) {
                        if (!map[row.line_id]) {
                            map[row.line_id] = {
                                id:        row.line_id,
                                name:      row.line_name,
                                hex_color: row.hex_color,
                                stations:  [],
                            };
                        }
                        map[row.line_id].stations.push({
                            id:   row.station_id,
                            name: row.station_name,
                        });
                    }
                    resolve(Object.values(map));
                }
            });
        });
    };

    // Returns all adjacent station pairs — used as the segment list in the Planning phase.
    // No line info is included: showing which line connects a pair would reveal the network.
    this.getSegments = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT s1.id AS from_id, s1.name AS from_name,
                       s2.id AS to_id,   s2.name AS to_name
                FROM line_stations ls1
                JOIN line_stations ls2 ON ls1.line_id  = ls2.line_id
                                      AND ls2.position = ls1.position + 1
                JOIN stations s1 ON s1.id = ls1.station_id
                JOIN stations s2 ON s2.id = ls2.station_id
                ORDER BY s1.name, s2.name
            `;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    };

}

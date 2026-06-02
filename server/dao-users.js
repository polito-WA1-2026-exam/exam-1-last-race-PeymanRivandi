/** DAO module for accessing users data **/

import db from './db.js';
import crypto from 'crypto';

export default function UserDao() {

    // Retrieve a user by id — used by passport deserializeUser
    this.getUserById = (id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE id=?';
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve({ error: 'User not found.' });
                } else {
                    resolve({ id: row.id, username: row.username });
                }
            });
        });
    };

    // Retrieve a user by username and verify password — used by LocalStrategy
    this.getUserByCredentials = (username, password) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username=?';
            db.get(sql, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(false);
                } else {
                    const user = { id: row.id, username: row.username };

                    // async scrypt — CPU-intensive, must not block the event loop
                    crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                        if (err) reject(err);
                        if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword))
                            resolve(false);
                        else
                            resolve(user);
                    });
                }
            });
        });
    };

}

import express from 'express';
import { initDb } from './db.js';

const app = express();
const port = 3001;

await initDb();

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

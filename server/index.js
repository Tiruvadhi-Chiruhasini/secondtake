const path = require('path');
const fs = require('fs');
const express = require('express');
const db = require('./db');
const register = require('./routes');

db.open();
const app = express();
app.use(express.json({ limit: '100kb' }));
register(app);

// Serve the built React app when present (single-port demo: `npm run build` then `npm start`).
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SecondTake API on http://localhost:${PORT}`));

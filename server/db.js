// SQLite layer. Uses better-sqlite3; falls back to Node's built-in node:sqlite (Node 22+).
const path = require('path');
const fs = require('fs');
const { hashPassword } = require('./auth');
const { MOVIES, REVIEWS, DEMO_USERS } = require('./seed');

let Database;
try { Database = require('better-sqlite3'); }
catch { Database = require('node:sqlite').DatabaseSync; }

const FILE = process.env.DB_FILE || path.join(__dirname, 'secondtake.db');
let db;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('viewer','director','producer')),
  bio TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS movies(
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, year INTEGER, language TEXT, genre TEXT,
  director TEXT, producer TEXT, budget_cr REAL, opening_cr REAL, lifetime_cr REAL, runtime_min INTEGER,
  release_month INTEGER, competition INTEGER, star_power INTEGER, trailer_sentiment INTEGER,
  audience_score REAL, critic_score INTEGER, wom_drop_pct INTEGER, marketing_cr REAL,
  synopsis TEXT, source TEXT DEFAULT 'Illustrative', created_by INTEGER);
CREATE TABLE IF NOT EXISTS reviews(
  id INTEGER PRIMARY KEY AUTOINCREMENT, movie_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10), body TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(movie_id, user_id));
CREATE TABLE IF NOT EXISTS projects(
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, genre TEXT, language TEXT,
  budget_cr REAL, marketing_cr REAL, release_month INTEGER, competition INTEGER, star_power INTEGER,
  trailer_sentiment INTEGER, audience_fit INTEGER, risk_score INTEGER, risk_level TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`;

function open(file = FILE) {
  if (db) return db;
  db = new Database(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  seedIfEmpty();
  return db;
}

function seedIfEmpty() {
  if (db.prepare('SELECT COUNT(*) AS n FROM movies').get().n > 0) return;
  const ins = db.prepare(`INSERT INTO movies(title,year,language,genre,director,producer,budget_cr,opening_cr,lifetime_cr,
    runtime_min,release_month,competition,star_power,trailer_sentiment,audience_score,critic_score,wom_drop_pct,marketing_cr,synopsis,source)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const m of MOVIES) ins.run(m.title, m.year, m.language, m.genre, m.director, m.producer, m.budget_cr, m.opening_cr,
    m.lifetime_cr, m.runtime_min, m.release_month, m.competition, m.star_power, m.trailer_sentiment, m.audience_score,
    m.critic_score, m.wom_drop_pct, m.marketing_cr, m.synopsis, m.source);
  const u = db.prepare('INSERT INTO users(name,email,password_hash,role,bio) VALUES (?,?,?,?,?)');
  const ids = DEMO_USERS.map(d => Number(u.run(d.name, d.email, hashPassword(d.password), d.role, d.bio).lastInsertRowid));
  const r = db.prepare('INSERT OR IGNORE INTO reviews(movie_id,user_id,rating,body) VALUES (?,?,?,?)');
  const byTitle = Object.fromEntries(db.prepare('SELECT id,title FROM movies').all().map(x => [x.title, x.id]));
  for (const rv of REVIEWS) if (byTitle[rv.title]) r.run(byTitle[rv.title], ids[rv.user], rv.rating, rv.body);
}

function reset() {
  if (db) { db.close(); db = null; }
  for (const s of ['', '-wal', '-shm']) if (fs.existsSync(FILE + s)) fs.unlinkSync(FILE + s);
  return open();
}

module.exports = { open, reset, get db() { return open(); } };

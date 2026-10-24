// Dependency-free auth: scrypt password hashing + HMAC-signed bearer tokens.
const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || 'secondtake-dev-secret-change-me';
const DAY = 86400;

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex'), b = crypto.scryptSync(pw, salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const b64 = s => Buffer.from(s).toString('base64url');
const sign = body => crypto.createHmac('sha256', SECRET).update(body).digest('base64url');

function makeToken(user, days = 7) {
  const body = b64(JSON.stringify({ id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + days * DAY }));
  return `${body}.${sign(body)}`;
}
function readToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const good = sign(body);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
}

// Express middleware factories
const requireAuth = (req, _res, next) => {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const p = readToken(t);
  if (!p) return next(new HttpError(401, 'Please sign in'));
  req.auth = p; next();
};
const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.auth.role) ? next() : next(new HttpError(403, `Requires role: ${roles.join(' or ')}`));

module.exports = { HttpError, hashPassword, verifyPassword, makeToken, readToken, requireAuth, requireRole };

// SecondTake risk engine — a transparent, weighted heuristic (not a trained model).
// Mirrors the PPT workflow: Input (budget, genre, timing, competition, trailer & audience feedback)
// -> Analysis (weighted factors) -> Output (Low / Medium / High). It supports decisions; it does not predict outcomes.
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const interp = (x, pts) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0); }
  }
  return pts[pts.length - 1][1];
};

// Release-window heuristic (festival / holiday windows lower risk; exam and monsoon months raise it).
const MONTH_RISK = [0, 25, 60, 65, 45, 40, 60, 60, 35, 55, 25, 30, 35];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const FACTORS = [
  { key: 'budget',      label: 'Budget pressure',        weight: 0.22, hint: 'Higher budgets need a larger audience just to recover.' },
  { key: 'competition', label: 'Release competition',    weight: 0.13, hint: 'Competing releases split the same audience.' },
  { key: 'timing',      label: 'Release timing',         weight: 0.08, hint: 'Festival and holiday windows favour footfall.' },
  { key: 'fit',         label: 'Audience–movie fit',     weight: 0.22, hint: 'How well the movie matches its intended audience.' },
  { key: 'signal',      label: 'Early audience signal',  weight: 0.10, hint: 'Trailer and early sentiment.' },
  { key: 'marketing',   label: 'Marketing reliance',     weight: 0.12, hint: 'Promotion cannot fix a weak audience fit (shifting the burden).' },
  { key: 'expectation', label: 'Expectation gap',        weight: 0.13, hint: 'Star power raises expectation; fit must meet it.' },
];

function level(score) { return score >= 55 ? 'High' : score >= 35 ? 'Medium' : 'Low'; }

function normalise(i) {
  const n = (v, d) => (v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
  return {
    budget_cr: Math.max(0, n(i.budget_cr, 50)), marketing_cr: Math.max(0, n(i.marketing_cr, 0)),
    release_month: clamp(Math.round(n(i.release_month, 1)), 1, 12), competition: clamp(Math.round(n(i.competition, 3)), 1, 5),
    star_power: clamp(Math.round(n(i.star_power, 5)), 1, 10), trailer_sentiment: clamp(n(i.trailer_sentiment, 50)),
    audience_fit: clamp(n(i.audience_fit, 50)),
  };
}

function assess(input, opts = {}) {
  const x = normalise(input);
  const share = x.budget_cr > 0 ? x.marketing_cr / x.budget_cr : 0;
  const raw = {
    budget: interp(x.budget_cr, [[10, 5], [50, 25], [150, 50], [300, 75], [500, 95]]),
    competition: ((x.competition - 1) / 4) * 100,
    timing: MONTH_RISK[x.release_month],
    fit: 100 - x.audience_fit,
    signal: 100 - x.trailer_sentiment,
    marketing: clamp((share / 0.2) * 100) * (0.4 + 0.6 * ((100 - x.audience_fit) / 100)),
    expectation: clamp((x.star_power * 10 - x.audience_fit) * 1.25),
  };
  const factors = FACTORS.map(f => ({ ...f, risk: Math.round(raw[f.key]), contribution: +(raw[f.key] * f.weight).toFixed(1) }));
  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0));
  const out = { score, level: level(score), factors, inputs: x };
  out.drivers = [...factors].sort((a, b) => b.contribution - a.contribution).slice(0, 3).map(f => f.label);
  out.options = suggest(x, raw);
  if (!opts.skipMonths) {
    out.months = MONTHS.map((m, idx) => {
      const s = Math.round(factors.reduce((t, f) => t + (f.key === 'timing' ? MONTH_RISK[idx + 1] : raw[f.key]) * f.weight, 0));
      return { month: m, n: idx + 1, score: s, level: level(s) };
    });
  }
  return out;
}

// Options map to the PPT brainstorm ideas — they inform human decisions, they are not instructions.
function suggest(x, raw) {
  const o = [];
  if (raw.competition >= 75) o.push({ idea: 'Competition-aware release planning', why: 'Several releases target the same audience in this window — compare other dates on the timing chart.' });
  if (raw.fit >= 50) o.push({ idea: 'Pre-release audience testing', why: 'Audience–movie fit is weak. Test with the intended audience before locking marketing spend.' });
  if (raw.marketing >= 45) o.push({ idea: 'Marketing response tracker', why: 'Promotion is carrying a lot of weight. Measure what is actually driving interest, not just awareness.' });
  if (raw.signal >= 50) o.push({ idea: 'Early word-of-mouth monitoring', why: 'Early sentiment is soft. Plan to read first-show reactions and respond within days.' });
  if (raw.budget >= 70) o.push({ idea: 'Regional release optimisation', why: 'Recovery pressure is high. Look at which regions and platforms can share the risk.' });
  if (raw.expectation >= 50) o.push({ idea: 'Audience–movie fit scoring', why: 'Star power is setting expectations the current fit signal does not match.' });
  if (!o.length) o.push({ idea: 'Keep monitoring', why: 'No factor is flagged. Keep tracking audience signals through release.' });
  return o;
}

// Derive assessment inputs from a stored movie row.
function assessMovie(m) {
  return assess({ budget_cr: m.budget_cr, marketing_cr: m.marketing_cr, release_month: m.release_month, competition: m.competition,
    star_power: m.star_power, trailer_sentiment: m.trailer_sentiment, audience_fit: (m.audience_score || 5) * 10 }, { skipMonths: true });
}

const recovery = m => (m.budget_cr > 0 ? m.lifetime_cr / m.budget_cr : 0);
const outcome = m => { const r = recovery(m); return r >= 1.5 ? 'Hit' : r >= 1 ? 'Average' : 'Flop'; };

module.exports = { assess, assessMovie, recovery, outcome, MONTHS, FACTORS, level };

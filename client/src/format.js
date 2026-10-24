export const cr = v => (v == null ? '–' : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`);
export const x2 = v => (v == null ? '–' : `${Number(v).toFixed(2)}×`);
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const ROLE_LABEL = { viewer: 'Movie Lover', director: 'Director', producer: 'Producer' };
export const ROLE_HOME = { viewer: '/app/viewer', director: '/app/director', producer: '/app/producer' };
export const dateOf = s => (s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

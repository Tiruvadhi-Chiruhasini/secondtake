# SecondTake — A smarter look before the final decision

React + Vite + Tailwind + Recharts frontend · Node + Express + SQLite backend.

## Run (needs Node 18+)
```bash
npm run setup                 # installs server + client
npm run dev:server            # terminal 1 → http://localhost:4000 (creates + seeds secondtake.db)
npm run dev:client            # terminal 2 → http://localhost:5173
```
Single-port demo: `npm run build && npm start` → http://localhost:4000

Demo logins (password `demo123`): `viewer@secondtake.demo`, `director@secondtake.demo`, `producer@secondtake.demo`
(or sign up; the role dropdown is kept from the original login page).

## Design reuse (from movie-rajyamouli)
- `client/tailwind.config.js` — colours: gold `#f0c040`, `#000/#111/#222`, `#f5f4f3`, `#aaa` (style.css, login.html); lavender/plum/tan/khaki sampled from the Power BI demo video. `brick` (#c25b4e) is the only addition (High risk / Flop).
- `client/src/index.css` — ported rules: `.hero`, `.btn` (split-wipe), login card/glow/fade-in, inputs, `.card`, section bands. Fonts unchanged: Cambria / Times New Roman / Arial.
- Hero Unsplash image URL reused (needs internet; falls back to black).
- Dashboard patterns from the video: radio "Select By Genre" slicer, KPI cards, italic tan titles, lavender/tan charts.

## Role access (enforced on the server)
viewer → viewer analytics, reviews · director → + director analytics, save projects, add movies · producer → + producer analytics, save projects, add movies.

## Data — read before presenting
Rows tagged **From PPT** use the presentation's figures. Rows tagged **Illustrative** are approximate; signal scores (trailer, competition, star power, marketing) are made up for the prototype. Verify names/figures before citing. The risk score is a transparent weighted heuristic (`server/risk.js`), not a trained model; the Insights back-test says so.

## Tests
`npm test` → 42 backend checks (auth, roles, CRUD, analytics) on in-memory SQLite.

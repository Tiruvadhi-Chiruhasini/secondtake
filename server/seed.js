// Prototype seed data. Rows with source 'PPT' use figures from the SecondTake presentation (Flop Movies, Team 03).
// Rows with source 'Illustrative' use approximate, rounded figures and illustrative signal scores —
// verify against a trusted tracker before presenting them as fact. Currency: INR crore.
const COLS = ['title','year','language','genre','director','producer','budget_cr','opening_cr','lifetime_cr','runtime_min',
  'release_month','competition','star_power','trailer_sentiment','audience_score','critic_score','wom_drop_pct','marketing_cr','source','synopsis'];
const rows = [
 ['Game Changer',2025,'Telugu','Action','Shankar','Sri Venkateswara Creations',400,63.3,131,165,1,4,8,55,4.8,38,62,60,'PPT','Political action drama. PPT cites ₹131 cr box office on a ~₹400 cr budget (slide 5 lists ₹185–195 cr worldwide). Star power did not guarantee an audience.'],
 ['Adipurush',2023,'Hindi','Mythology','Om Raut','T-Series',500,103.1,393,179,6,3,9,30,2.8,20,70,80,'PPT','Mythological action drama with a strong opening (~₹103 cr) that collapsed once word of mouth turned negative.'],
 ['Dacoit',2026,'Telugu','Action','Shaneil Deo','Annapurna Studios',68,12.72,54.28,150,3,3,7,62,6.1,52,64,8,'PPT','Action-romance thriller. Worldwide gross ~₹54 cr against a reported ₹62–75 cr budget; 64% second-day drop.'],
 ['Khaleja',2010,'Telugu','Fantasy','Trivikram Srinivas','Sai Korrapati',35,4.18,18.08,170,10,3,9,70,7.9,55,48,4,'PPT','Fantasy action comedy. Commercial disappointment at release (figures are distributor share), later a cult favourite — 60,000+ re-release tickets in 24 hours.'],
 ['Saaho',2019,'Telugu','Action','Sujeeth','UV Creations',350,60,125,170,8,3,9,72,4.9,30,81,50,'PPT','High-budget action film. Second-week ticket sales fell 81.1%. PPT cites ₹125 cr haul against ₹350 cr budget.'],
 ['Liger',2022,'Telugu','Sports','Puri Jagannadh','Dharma Productions & Puri Connects',125,33,80,140,8,3,7,48,3.0,25,66,25,'PPT','Pan-India sports drama that earned roughly ₹80 cr (PPT) despite wide release.'],
 ['Orange',2010,'Telugu','Romance','Bhaskar','Anjana Productions',25,6,18,160,11,2,8,60,7.4,45,55,2.5,'PPT','Poor response in its original run; ₹3.2 cr from a re-release 13 years later (PPT).'],
 ['1: Nenokkadine',2014,'Telugu','Thriller','Sukumar','14 Reels Entertainment',65,14,40,170,1,3,9,66,9.2,52,55,8,'PPT','Labelled a flop in 2009–14 theatrical response; holds a 9.2 IMDb rating in 2026 (PPT). Early release ↔ late success.'],
 ['Radhe Shyam',2022,'Telugu','Romance','Radha Krishna Kumar','UV Creations & T-Series',300,45,151,138,3,3,9,58,5.0,33,72,40,'Illustrative','Pan-India period romance with major star power and heavy promotion.'],
 ['RRR',2022,'Telugu','Action','S. S. Rajamouli','DVV Entertainment',550,223,1250,187,3,3,9,90,7.8,82,22,40,'Illustrative','Period action epic; strong trailer response, sustained word of mouth.'],
 ['Baahubali 2: The Conclusion',2017,'Telugu','Action','S. S. Rajamouli','Arka Media Works',250,120,1700,167,4,2,9,92,8.2,80,18,30,'Illustrative','Epic fantasy-action sequel carried by audience anticipation and strong experience.'],
 ['Pushpa 2: The Rule',2024,'Telugu','Action','Sukumar','Mythri Movie Makers',500,294,1700,200,12,2,9,88,6.4,60,45,60,'Illustrative','Sequel riding on franchise expectation and a huge opening.'],
 ['Kalki 2898 AD',2024,'Telugu','Sci-Fi','Nag Ashwin','Vyjayanthi Movies',600,180,1100,181,6,2,9,85,7.0,68,35,70,'Illustrative','High-budget sci-fi mythology with ensemble star power.'],
 ['HanuMan',2024,'Telugu','Fantasy','Prasanth Varma','Primeshow Entertainment',40,8,350,158,1,4,5,80,7.9,78,8,5,'Illustrative','Small-budget superhero fantasy that grew through word of mouth despite a crowded festival window.'],
 ['Magadheera',2009,'Telugu','Fantasy','S. S. Rajamouli','Geetha Arts',40,9,150,166,7,2,8,78,7.7,74,10,3,'Illustrative','Reincarnation fantasy-action; modest budget, outsized return.'],
 ['Sita Ramam',2022,'Telugu','Romance','Hanu Raghavapudi','Vyjayanthi Movies',30,5,90,163,8,3,6,76,8.5,85,6,4,'Illustrative','Period romance with strong audience-fit and positive word of mouth.'],
 ['Arjun Reddy',2017,'Telugu','Drama','Sandeep Reddy Vanga','Bhadrakali Pictures',5,4,51,182,8,3,4,70,8.0,60,12,0.8,'Illustrative','Low-budget intense drama that found its audience quickly.'],
 ['Salaar: Part 1',2023,'Telugu','Action','Prashanth Neel','Hombale Films',270,178,700,175,12,5,9,82,6.5,55,50,30,'Illustrative','Large-scale action film that opened big in a heavy year-end clash.'],
 ['Ala Vaikunthapurramuloo',2020,'Telugu','Drama','Trivikram Srinivas','Geetha Arts',100,40,280,165,1,4,8,85,7.3,60,15,10,'Illustrative','Family drama that thrived in the Sankranti window.'],
 ['Eega',2012,'Telugu','Fantasy','S. S. Rajamouli','Varahi Chalana Chitram',30,7,125,134,7,2,5,82,7.7,78,8,3,'Illustrative','Revenge fantasy with a fly protagonist; concept-led, low star dependence.'],
 ['Brahmastra: Part One',2022,'Hindi','Fantasy','Ayan Mukerji','Dharma Productions',410,75,430,167,9,2,8,66,5.6,40,55,60,'Illustrative','Big-budget fantasy trilogy opener; roughly broke even.'],
 ['Laal Singh Chaddha',2022,'Hindi','Drama','Advait Chandan','Aamir Khan Productions',180,12,130,159,8,4,8,40,5.5,45,63,20,'Illustrative','Remake that faced pre-release backlash and a crowded release weekend.'],
 ['Samrat Prithviraj',2022,'Hindi','Historical','Chandraprakash Dwivedi','Yash Raj Films',175,10,90,135,6,3,7,45,4.9,30,68,20,'Illustrative','Historical epic with weak audience response.'],
 ['Kantara',2022,'Kannada','Thriller','Rishab Shetty','Hombale Films',16,2.5,400,148,9,3,5,70,8.2,80,5,3,'Illustrative','Folk-rooted thriller; word of mouth outran its modest launch.'],
 ['KGF: Chapter 2',2022,'Kannada','Action','Prashanth Neel','Hombale Films',100,160,1200,168,4,3,8,92,8.3,66,25,15,'Illustrative','Sequel with massive anticipation and sustained response.'],
 ['Jawan',2023,'Hindi','Action','Atlee','Red Chillies Entertainment',300,130,1150,169,9,3,10,88,7.0,62,38,40,'Illustrative','Mass action entertainer led by a top star.'],
 ['Animal',2023,'Hindi','Drama','Sandeep Reddy Vanga','T-Series & Bhadrakali Pictures',100,63,915,201,12,4,9,85,6.3,50,30,20,'Illustrative','Polarising crime drama that still drew heavy repeat footfall.'],
];
const MOVIES = rows.map(r => Object.fromEntries(COLS.map((c, i) => [c, r[i]])));

const DEMO_USERS = [
  { name: 'Asha Viewer', email: 'viewer@secondtake.demo', password: 'demo123', role: 'viewer', bio: 'Watches everything, reviews honestly.' },
  { name: 'Dev Director', email: 'director@secondtake.demo', password: 'demo123', role: 'director', bio: 'Planning the next feature.' },
  { name: 'Priya Producer', email: 'producer@secondtake.demo', password: 'demo123', role: 'producer', bio: 'Backs projects with insight.' },
];
const REVIEWS = [
  { title: 'Khaleja', user: 0, rating: 9, body: 'Ahead of its time. The comedy lands far better today.' },
  { title: 'Adipurush', user: 0, rating: 3, body: 'Strong promotion, weak experience. The opening could not hold.' },
  { title: 'Sita Ramam', user: 0, rating: 9, body: 'Quiet, patient, and it found its audience through word of mouth.' },
  { title: 'Game Changer', user: 0, rating: 5, body: 'Star power alone was not enough here.' },
  { title: '1: Nenokkadine', user: 0, rating: 9, body: 'Deserved a second look after release.' },
  { title: 'RRR', user: 1, rating: 9, body: 'A masterclass in pacing and audience engagement.' },
  { title: 'HanuMan', user: 1, rating: 8, body: 'Proof that concept and execution can beat budget.' },
  { title: 'Saaho', user: 2, rating: 4, body: 'Huge opening, steep fall. Textbook front-loading.' },
  { title: 'Kantara', user: 2, rating: 9, body: 'Low-cost, high-return. The kind of risk profile investors should study.' },
];
module.exports = { MOVIES, DEMO_USERS, REVIEWS };

/** SecondTake design tokens — every value below is taken from the uploaded movie-rajyamouli frontend
 *  (style.css, login.html) or sampled from its Power BI dashboard demo video. `brick` is the only addition (semantic "high risk"). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#f0c040',      // style.css: buttons, headings, .live
        ink: '#000',          // body background
        coal: '#111',         // .paths / .quote / login card
        panel: '#222',        // .card, inputs
        paper: '#f5f4f3',     // .Rj span
        muted: '#aaa',        // input placeholder
        // from the dashboard video
        tan: '#c0b080', khaki: '#908060', cream: '#e0d0b0', lav: '#a090c0', plum: '#a060a0',
        brick: '#c25b4e',
      },
      fontFamily: {
        sans: ['Arial', 'sans-serif'],
        serif: ['Cambria', 'serif'],
        times: ["'Times New Roman'", 'Times', 'serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(240,192,64,0.6)',   // login-container
        'glow-sm': '0 0 10px #f0c040',            // input focus
      },
    },
  },
  plugins: [],
};

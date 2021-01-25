module.exports = {
  purge: {
    mode: 'all',
    preserveHtmlElements: false,
    content: [
      './src/views/**/*.ejs',
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        green: '#009A7D',
        red: '#FF546A',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};

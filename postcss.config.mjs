import autoprefixer from "autoprefixer";

const config = {
  plugins: ['@tailwindcss/postcss', autoprefixer()],
};

export default config;

// import tailwindcss from '@tailwindcss/postcss';
// import autoprefixer from 'autoprefixer';

// export default {
//   plugins: [tailwindcss(), autoprefixer()],
// };
// Vitest requires ESM syntax for PostCSS config but for some reason this breaks the Next.js app build
// switching between the two as a temporary workaround


// USE THIS VERSION FOR NEXT.JS APP BUILD
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};


// USE THIS VERSION FOR VITEST RUNNER
// import tailwindcss from '@tailwindcss/postcss';
// import autoprefixer from 'autoprefixer';

// export default {
//   plugins: [tailwindcss(), autoprefixer()],
// };
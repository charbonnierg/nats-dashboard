import { injectManifest } from 'workbox-build';

// Inject the precache manifest into the service worker file.
const { count, size, warnings } = await injectManifest({
  globDirectory: 'dist',
  // Default: ["**/*.{js,css,html}"].
  globPatterns: [
    // Cache all the assets generated by astro (js, css, svg).
    'app/*',
    // Precache only the home page, other pages will be cached on access.
    'index.html',
  ],
  swDest: 'dist/sw.js',
  swSrc: 'dist/sw.js',
});

if (warnings.length > 0) {
  console.warn(
    'Warnings encountered while injecting the manifest:',
    warnings.join('\n')
  );
}

if (count > 0) {
  console.log(
    `Injected a manifest which will precache ${count} files, totaling ${size} bytes.`
  );
} else {
  console.log('No files to precache.');
}
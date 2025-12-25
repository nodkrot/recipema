import { publish } from 'gh-pages';
import { execSync } from 'child_process';
import { copyFileSync } from 'fs';

console.log('🚀 Starting deployment process...\n');

// Step 1: Build the project
console.log('📦 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Copy additional files for SPA
console.log('📋 Preparing deployment files...');
try {
  // SPA GitHub Pages support: https://github.com/rafrex/spa-github-pages
  copyFileSync('./app/404.html', './dist/404.html');
  console.log('  ✓ Copied 404.html for SPA routing');
  console.log('');
} catch (error) {
  console.error('❌ File preparation failed:', error.message);
  process.exit(1);
}

// Step 3: Publish to GitHub Pages
const publishOptions = {
  branch: 'gh-pages',
  dotfiles: false,
  add: false, // Replace all contents in gh-pages branch
  cname: 'recipema.appletreelabs.com', // Custom domain
  message: `Deploy: ${new Date().toISOString()}`
};

console.log('🌐 Publishing to GitHub Pages...');
console.log(`  Branch: ${publishOptions.branch}`);
console.log(`  Custom domain: ${publishOptions.cname}`);
console.log(`  Message: ${publishOptions.message}\n`);

publish('./dist', publishOptions, (err) => {
  if (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Deployment to GitHub Pages successful!');
    console.log('🎉 Site is live at: https://recipema.appletreelabs.com\n');
  }
});


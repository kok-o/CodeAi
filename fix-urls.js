import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace utils/api.js BASE_URL
  newContent = newContent.replace(
    /import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000\/api'/g,
    "import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'"
  );

  // Replace other API instances that end with /api
  newContent = newContent.replace(
    /'http:\/\/localhost:5000\/api'/g,
    "import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'"
  );

  // Replace host-only VITE_API_URL references
  newContent = newContent.replace(
    /import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'/g,
    "import.meta.env.PROD ? '' : 'http://localhost:5000'"
  );

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log('Updated', file);
  }
});

console.log(`Updated ${changedFiles} files.`);

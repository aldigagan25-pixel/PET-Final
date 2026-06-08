const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchFiles(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('fmtKg') || content.includes('fmtKgId')) {
        console.log(`Found in: ${filePath}`);
      }
    }
  }
}

searchFiles(path.join(__dirname, 'src'));

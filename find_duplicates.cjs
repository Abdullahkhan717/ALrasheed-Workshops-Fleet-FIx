
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'translations.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

function findDuplicates(lang) {
  let inSection = false;
  const duplicates = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(`${lang}: {`)) {
      inSection = true;
      seen.clear();
      continue;
    }
    if (inSection && (line.trim() === '},' || line.trim() === '}')) {
      inSection = false;
      continue;
    }
    
    if (inSection) {
      const match = line.match(/^\s*([a-zA-Z0-9_]+):/);
      if (match) {
        const key = match[1];
        if (seen.has(key)) {
          duplicates.push({key, line: i + 1});
        }
        seen.add(key);
      }
    }
  }
  return duplicates;
}

console.log('English Duplicates:', JSON.stringify(findDuplicates('en'), null, 2));
console.log('Arabic Duplicates:', JSON.stringify(findDuplicates('ar'), null, 2));


import { translations } from './translations';
import * as fs from 'fs';

const content = fs.readFileSync('./translations.ts', 'utf8');
const lines = content.split('\n');

function findDuplicates(lang: string) {
  const keys: string[] = [];
  const regex = /^\s*([a-zA-Z0-9_]+):/m;
  
  // This is a bit naive because it doesn't account for nested objects perfectly, 
  // but translations.ts structure is simple: en: { ... }, ar: { ... }
  
  let inSection = false;
  const duplicates: {key: string, line: number}[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(`${lang}: {`)) {
      inSection = true;
      seen.clear();
      continue;
    }
    if (inSection && line.includes('},')) {
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

console.log('English Duplicates:', findDuplicates('en'));
console.log('Arabic Duplicates:', findDuplicates('ar'));

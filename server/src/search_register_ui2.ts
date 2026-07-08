import fs from 'fs';

const content = fs.readFileSync('src/pages/Register.tsx', 'utf8');
const lines = content.split('\n');

let count = 0;
lines.forEach((line, idx) => {
  if (idx + 1 >= 1200 && idx + 1 <= 1700) {
    if (line.includes('section') || line.includes('Section') || line.includes('className') || line.includes('Class')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});

import fs from 'fs';

const files = [
  'src/app/page.tsx',
  'src/app/events/page.tsx',
  'src/app/admin/events/page.tsx',
  'src/app/events/[id]/page.tsx'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\\n/g, '\n');
    fs.writeFileSync(file, content);
    console.log("Fixed", file);
  } catch (err) {
    console.log("Error fixing", file, err.message);
  }
}

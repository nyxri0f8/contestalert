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
    content = content.replace(/\\);\\\\n\\s*const eventsWithImages/g, ');\n      const eventsWithImages');
    content = content.replace(/\\{\\\\n\\s*const data/g, '{\n        const data');
    content = content.replace(/\\.single\\(\\);\\\\n\\s*const \\[eventWithImage\\]/g, '.single();\n        const [eventWithImage]');
    // also fallback literal replacement just for the exact string
    content = content.replace('");\\n      const eventsWithImages', '");\n      const eventsWithImages');
    content = content.replace(') {\\n        const data', ') {\n        const data');
    content = content.replace('();\\n        const [eventWithImage]', '();\n        const [eventWithImage]');

    fs.writeFileSync(file, content);
    console.log("Fixed", file);
  } catch (err) {
    console.log("Error fixing", file, err.message);
  }
}

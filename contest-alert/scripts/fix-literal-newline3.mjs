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
    
    // Replace literal "\\n" (2 characters: backslash + n) with an actual newline "\n"
    content = content.split('");\\n      const').join('");\\n      const'.replace('\\\\n', '\\n'));
    content = content.split('");\\n      const eventsWithImages').join('");\\n      const eventsWithImages'.replace('\\\\n', '\\n'));
    // Actually, simply replacing the exact 2-character string '\\n' with a real newline '\\n' but only where we injected it
    content = content.replace('");\\n      const eventsWithImages', '");\n      const eventsWithImages');
    content = content.replace(') {\\n        const data', ') {\n        const data');
    content = content.replace('.single();\\n        const [eventWithImage]', '.single();\n        const [eventWithImage]');

    fs.writeFileSync(file, content);
    console.log("Fixed", file);
  } catch (err) {
    console.log("Error fixing", file, err.message);
  }
}

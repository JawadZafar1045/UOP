const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
  if (line.includes('CLOUDINARY_API_SECRET')) {
    console.log(`Line: [${line}]`);
    console.log(`Hex:  ${Buffer.from(line).toString('hex')}`);
  }
});

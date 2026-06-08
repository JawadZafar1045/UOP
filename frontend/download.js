const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'avatars');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const seeds = ['Felix', 'Aneka', 'Nala', 'Avery', 'Liam', 'Sophia', 'Oliver', 'Isabella', 'Jack'];

seeds.forEach((seed, index) => {
  const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f1f5f9,f8fafc,e2e8f0`;
  const dest = path.join(dir, `${index + 1}.svg`);
  
  https.get(url, (res) => {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${dest}`);
    });
  });
});

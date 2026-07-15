
import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vapidKeys = webpush.generateVAPIDKeys();

fs.writeFileSync(
  path.join(__dirname, 'keys.json'), 
  JSON.stringify(vapidKeys, null, 2)
);

console.log('Keys saved to keys.json');

import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const publicVapidKey = 'BE72Pi7UFfcnxE6-mKR_H5v-l1A9pljjh-7wd8hNml0q7TMuuKoVAQYPct5zi7B4G01lM7ZUyNa3OwgxWfxBx4c';
const privateVapidKey = 'XNgu2l2RFw17qwS_-vBfwRV-yP0k25xjj0Bpwl3Hg58';

// Identify the calling application server (usually a mailto: URL)
webpush.setVapidDetails(
  'mailto:birekalpesh@gmail.com',
  publicVapidKey,
  privateVapidKey
);

export default webpush;

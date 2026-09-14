const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Create the exact SVG matching the user's uploaded avatar
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background / Soft Glow (Optional) -->
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#262c3a" />
      <stop offset="100%" stop-color="#141824" />
    </linearGradient>

    <!-- Face / Skin Gradient -->
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="60%" stop-color="#fdba74" />
      <stop offset="100%" stop-color="#fba15d" />
    </linearGradient>

    <!-- Headset Band & Earpads -->
    <linearGradient id="headsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <!-- Mic Foam Gradient -->
    <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <!-- Shirt Gradient -->
    <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <!-- Collar Gradient -->
    <linearGradient id="collarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>

    <!-- Boom Arm Gradient -->
    <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Headset Arch Behind Head -->
  <path d="M 145 200 C 145 100, 367 100, 367 200" fill="none" stroke="url(#headsetGrad)" stroke-width="26" stroke-linecap="round" />

  <!-- Body / Blue Shirt -->
  <path d="M 85 490 C 85 365, 150 290, 256 290 C 362 290, 427 365, 427 490 Z" fill="url(#shirtGrad)" />

  <!-- Center Placket / Stitch -->
  <rect x="250" y="375" width="12" height="115" rx="6" fill="#1e40af" />

  <!-- White Name Badge on Right Chest (Viewer's Left) -->
  <rect x="145" y="405" width="54" height="22" rx="11" fill="#ffffff" filter="url(#shadow)" />

  <!-- Neck -->
  <path d="M 215 260 L 215 375 C 215 398, 297 398, 297 375 L 297 260 Z" fill="url(#skinGrad)" />

  <!-- Collar Wings -->
  <!-- Left Wing -->
  <path d="M 165 372 C 160 305, 256 305, 256 372 C 235 372, 195 378, 165 372 Z" fill="url(#collarGrad)" />
  <!-- Right Wing -->
  <path d="M 347 372 C 352 305, 256 305, 256 372 C 277 372, 317 378, 347 372 Z" fill="url(#collarGrad)" />

  <!-- Head / Face (Faceless) -->
  <path d="M 160 170 C 160 85, 352 85, 352 170 C 352 240, 322 310, 256 310 C 190 310, 160 240, 160 170 Z" fill="url(#skinGrad)" />

  <!-- Hair -->
  <path d="M 160 155 
           C 160 60, 205 0, 315 0 
           C 390 0, 385 105, 385 155 
           C 375 140, 360 130, 350 120 
           C 350 95, 305 95, 275 95 
           C 220 95, 175 125, 160 155 Z" 
        fill="url(#hairGrad)" />
  <!-- Additional Hair Tuft / Front Bangs -->
  <path d="M 160 155 
           C 165 110, 200 65, 275 95 
           C 255 105, 235 118, 220 135 
           C 200 120, 180 130, 160 155 Z" 
        fill="url(#hairGrad)" />
  <path d="M 300 0 
           C 345 5, 385 50, 385 130 
           C 370 95, 340 95, 310 95 
           C 290 95, 250 85, 300 0 Z" 
        fill="url(#hairGrad)" />

  <!-- Headset Ear Cushion Left -->
  <rect x="115" y="128" width="45" height="85" rx="22.5" fill="url(#headsetGrad)" filter="url(#shadow)" />
  
  <!-- Headset Ear Cushion Right -->
  <rect x="352" y="128" width="45" height="85" rx="22.5" fill="url(#headsetGrad)" filter="url(#shadow)" />

  <!-- Microphone Boom Arm (Curves from Right Ear to Center/Mouth) -->
  <path d="M 374 195 L 374 235 C 374 255, 350 255, 300 255 L 265 255" 
        fill="none" stroke="url(#armGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Microphone Foam Capsule -->
  <rect x="245" y="224" width="64" height="42" rx="21" fill="url(#micGrad)" filter="url(#shadow)" />
</svg>`;

async function renderAssets() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Save SVG
  fs.writeFileSync('client/public/images/chat_support_icon.svg', svg);
  fs.writeFileSync('public/images/chat_support_icon.svg', svg);
  
  // Render high-res PNG (512x512)
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  await page.setContent('<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;">' + svg + '</body></html>');
  
  const pngBuffer = await page.screenshot({ type: 'png', omitBackground: true });
  fs.writeFileSync('client/public/images/chat_support_icon.png', pngBuffer);
  fs.writeFileSync('public/images/chat_support_icon.png', pngBuffer);
  fs.writeFileSync('attached_assets/chat_support_icon.png', pngBuffer);

  // Render high-res JPG with white background
  await page.setContent('<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;">' + svg + '</body></html>');
  const jpgBuffer = await page.screenshot({ type: 'jpeg', quality: 98 });
  fs.writeFileSync('client/public/images/chat_support_icon.jpg', jpgBuffer);
  fs.writeFileSync('public/images/chat_support_icon.jpg', jpgBuffer);
  fs.writeFileSync('attached_assets/chat_support_icon.jpg', jpgBuffer);

  console.log('All image assets written successfully!');
  await browser.close();
}

renderAssets().catch(err => {
  console.error(err);
  process.exit(1);
});

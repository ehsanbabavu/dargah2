const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Skin gradient -->
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCD7B7"/>
      <stop offset="100%" stop-color="#F9B790"/>
    </linearGradient>

    <!-- Blue Shirt gradient -->
    <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2D7FF8"/>
      <stop offset="100%" stop-color="#1662E2"/>
    </linearGradient>

    <!-- Collar gradient -->
    <linearGradient id="collarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#69ABFC"/>
      <stop offset="100%" stop-color="#5196F8"/>
    </linearGradient>

    <!-- Headphone Blue gradient -->
    <linearGradient id="headphoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3D8FFC"/>
      <stop offset="100%" stop-color="#1B67E3"/>
    </linearGradient>
  </defs>

  <!-- Headband behind hair -->
  <path d="M 138 180 C 138 85, 200 42, 256 42 C 312 42, 374 85, 374 180" 
        fill="none" 
        stroke="url(#headphoneGrad)" 
        stroke-width="38" 
        stroke-linecap="round" />

  <!-- Back Hair -->
  <path d="M 136 185 C 128 105, 160 40, 225 18 C 248 10, 280 -2, 325 6 C 368 15, 396 65, 376 185 Z" 
        fill="#1F242C" />

  <!-- Body / Shirt -->
  <path d="M 52 445 
           C 52 355, 138 292, 198 288 
           L 256 376 
           L 314 288 
           C 374 292, 460 355, 460 445 
           C 460 488, 442 512, 396 512 
           L 116 512 
           C 70 512, 52 488, 52 445 Z" 
        fill="url(#shirtGrad)" />

  <!-- Center vertical seam on shirt -->
  <line x1="256" y1="376" x2="256" y2="512" stroke="#1253C8" stroke-width="4" />

  <!-- White badge on left chest -->
  <rect x="138" y="408" width="54" height="22" rx="11" fill="#FFFFFF" />

  <!-- Neck -->
  <path d="M 202 245 L 202 348 L 256 376 L 310 348 L 310 245 Z" fill="url(#skinGrad)" />

  <!-- Neck Shadow under chin -->
  <path d="M 202 250 C 218 292, 294 292, 310 250 C 300 298, 212 298, 202 250 Z" fill="#E89F77" />

  <!-- Head / Face -->
  <path d="M 160 145 
           C 158 222, 195 288, 256 288 
           C 317 288, 354 222, 352 145 
           C 352 82, 317 52, 256 52 
           C 195 52, 160 82, 160 145 Z" 
        fill="url(#skinGrad)" />

  <!-- Hair (Front & Styling) -->
  <path d="M 158 135 
           C 152 75, 190 32, 235 18 
           C 255 12, 275 26, 295 8 
           C 320 -10, 352 -2, 374 22 
           C 390 40, 394 76, 384 122 
           C 370 72, 342 55, 310 62 
           C 285 68, 260 52, 235 58 
           C 198 68, 172 92, 164 138 
           Z" 
        fill="#1F242C" />
  
  <!-- Front fringe line framing forehead -->
  <path d="M 158 135 
           C 164 92, 198 68, 235 58 
           C 260 52, 285 68, 310 62 
           C 342 55, 370 72, 384 122 
           C 376 135, 360 138, 345 126 
           C 315 104, 280 94, 235 108 
           C 195 120, 170 140, 158 135 Z" 
        fill="#1F242C" />

  <!-- Collars (Polo style) -->
  <!-- Left Collar Flap -->
  <path d="M 198 288 L 256 376 L 208 380 L 158 358 Z" fill="url(#collarGrad)" />
  <!-- Right Collar Flap -->
  <path d="M 314 288 L 256 376 L 304 380 L 354 358 Z" fill="url(#collarGrad)" />

  <!-- Left Earcup -->
  <rect x="116" y="126" width="44" height="88" rx="22" fill="url(#headphoneGrad)" />

  <!-- Right Earcup -->
  <rect x="352" y="126" width="44" height="88" rx="22" fill="url(#headphoneGrad)" />

  <!-- Boom Arm (microphone extension) -->
  <path d="M 374 205 
           L 374 242 
           C 374 256, 364 264, 350 264 
           L 276 264" 
        fill="none" 
        stroke="#9CA3AF" 
        stroke-width="16" 
        stroke-linecap="round" 
        stroke-linejoin="round" />

  <!-- Microphone foam capsule -->
  <rect x="245" y="246" width="64" height="36" rx="18" fill="url(#headphoneGrad)" />
</svg>`;

fs.writeFileSync(path.join(__dirname, '../public/images/chat_support_icon.svg'), svgContent);
fs.writeFileSync(path.join(__dirname, '../client/public/images/chat_support_icon.svg'), svgContent);

async function render() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;">${svgContent}</body></html>`);
  
  const pngBuffer = await page.screenshot({ omitBackground: true, type: 'png' });
  fs.writeFileSync(path.join(__dirname, '../public/images/chat_support_icon.png'), pngBuffer);
  fs.writeFileSync(path.join(__dirname, '../client/public/images/chat_support_icon.png'), pngBuffer);
  fs.writeFileSync(path.join(__dirname, '../attached_assets/chat_support_icon.png'), pngBuffer);
  
  const jpgBuffer = await page.screenshot({ omitBackground: false, type: 'jpeg', quality: 98 });
  fs.writeFileSync(path.join(__dirname, '../public/images/chat_support_icon.jpg'), jpgBuffer);
  fs.writeFileSync(path.join(__dirname, '../client/public/images/chat_support_icon.jpg'), jpgBuffer);
  fs.writeFileSync(path.join(__dirname, '../attached_assets/chat_support_icon.jpg'), jpgBuffer);

  await browser.close();
  console.log('Successfully rendered chat support icon!');
}

render().catch(console.error);

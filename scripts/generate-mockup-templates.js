/**
 * Script to generate placeholder mockup template images
 * Run with: node scripts/generate-mockup-templates.js
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG template generator
function generateDeviceSVG(name, width, height, screenArea) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Device body -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#1a1a1a" rx="20"/>
  
  <!-- Screen area -->
  <rect x="${screenArea.x}" y="${screenArea.y}" width="${screenArea.width}" height="${screenArea.height}" fill="#ffffff" rx="5"/>
  
  <!-- Label -->
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">${name}</text>
</svg>`;
}

function generatePrintSVG(name, width, height, designArea) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f5f5f5"/>
  
  <!-- Paper -->
  <rect x="${designArea.x - 10}" y="${designArea.y - 10}" width="${designArea.width + 20}" height="${designArea.height + 20}" fill="#ffffff" stroke="#ddd" stroke-width="2"/>
  
  <!-- Design area -->
  <rect x="${designArea.x}" y="${designArea.y}" width="${designArea.width}" height="${designArea.height}" fill="#fafafa" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
  
  <!-- Label -->
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">${name}</text>
</svg>`;
}

function generateApparelSVG(name, width, height, designArea) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="${width}" height="${height}" fill="#e8e8e8"/>
  
  <!-- Apparel shape (simplified) -->
  <path d="M ${width/2 - 150} 100 L ${width/2 - 100} 50 L ${width/2 + 100} 50 L ${width/2 + 150} 100 L ${width/2 + 150} ${height - 50} L ${width/2 - 150} ${height - 50} Z" fill="#2a2a2a"/>
  
  <!-- Design area -->
  <rect x="${designArea.x}" y="${designArea.y}" width="${designArea.width}" height="${designArea.height}" fill="#3a3a3a" stroke="#555" stroke-width="2" stroke-dasharray="5,5"/>
  
  <!-- Label -->
  <text x="${width/2}" y="${height - 20}" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">${name}</text>
</svg>`;
}

// Template definitions
const templates = [
  // Devices
  { name: 'iphone-14-pro', type: 'device', width: 400, height: 850, screenArea: { x: 50, y: 100, width: 300, height: 650 } },
  { name: 'macbook-pro', type: 'device', width: 800, height: 600, screenArea: { x: 100, y: 80, width: 600, height: 400 } },
  { name: 'ipad-air', type: 'device', width: 560, height: 800, screenArea: { x: 80, y: 120, width: 400, height: 550 } },
  
  // Print
  { name: 'business-card', type: 'print', width: 450, height: 300, designArea: { x: 50, y: 50, width: 350, height: 200 } },
  { name: 'poster-a4', type: 'print', width: 500, height: 720, designArea: { x: 100, y: 150, width: 300, height: 420 } },
  { name: 'flyer', type: 'print', width: 480, height: 680, designArea: { x: 80, y: 100, width: 320, height: 450 } },
  
  // Apparel
  { name: 't-shirt-front', type: 'apparel', width: 550, height: 700, designArea: { x: 150, y: 200, width: 250, height: 250 } },
  { name: 'hoodie-front', type: 'apparel', width: 550, height: 750, designArea: { x: 140, y: 220, width: 270, height: 270 } },
  { name: 'tote-bag', type: 'apparel', width: 540, height: 680, designArea: { x: 120, y: 180, width: 300, height: 300 } },
];

// Generate SVG files
const outputDir = path.join(__dirname, '..', 'public', 'mockup-templates');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

templates.forEach(template => {
  let svg;
  
  if (template.type === 'device') {
    svg = generateDeviceSVG(template.name, template.width, template.height, template.screenArea);
  } else if (template.type === 'print') {
    svg = generatePrintSVG(template.name, template.width, template.height, template.designArea);
  } else if (template.type === 'apparel') {
    svg = generateApparelSVG(template.name, template.width, template.height, template.designArea);
  }
  
  const filePath = path.join(outputDir, `${template.name}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated: ${template.name}.svg`);
});

// Also create PNG versions using a simple conversion note
const readmePath = path.join(outputDir, 'README.md');
const readmeContent = `# Mockup Templates

This directory contains placeholder mockup templates for the Mockup Generator tool.

## Templates

### Devices
- iphone-14-pro.svg - iPhone 14 Pro mockup
- macbook-pro.svg - MacBook Pro mockup
- ipad-air.svg - iPad Air mockup

### Print
- business-card.svg - Business card mockup
- poster-a4.svg - A4 poster mockup
- flyer.svg - Flyer mockup

### Apparel
- t-shirt-front.svg - T-shirt front mockup
- hoodie-front.svg - Hoodie front mockup
- tote-bag.svg - Tote bag mockup

## Note

These are placeholder SVG templates. For production use, replace with high-quality PNG mockup images.

To convert SVG to PNG, you can use tools like:
- ImageMagick: \`convert template.svg template.png\`
- Online converters
- Design tools like Figma or Photoshop
`;

fs.writeFileSync(readmePath, readmeContent);
console.log('\nGenerated README.md');
console.log('\nAll mockup templates generated successfully!');

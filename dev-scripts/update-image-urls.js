const fs = require('fs');
const path = require('path');

// Load the fragrances data
const fragrancesPath = path.join(__dirname, 'data', 'fragrancesV2.json');
const fragrancesData = JSON.parse(fs.readFileSync(fragrancesPath, 'utf-8'));

// Load the image mapping
const mappingPath = path.join(__dirname, 'public', 'fragrances', 'image-mapping.json');
const imageMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Load failed downloads
const failedPath = path.join(__dirname, 'public', 'fragrances', 'failed-downloads.json');
let failedDownloads = [];
if (fs.existsSync(failedPath)) {
  failedDownloads = JSON.parse(fs.readFileSync(failedPath, 'utf-8'));
}

// Update fragrances data with local image paths
let updatedCount = 0;
let skippedCount = 0;

for (let i = 0; i < fragrancesData.length; i++) {
  if (imageMapping[i]) {
    fragrancesData[i]['Image URL'] = imageMapping[i];
    updatedCount++;
  } else {
    skippedCount++;
    console.log(`⚠️  No local image for: ${fragrancesData[i].Name}`);
  }
}

// Save updated fragrances data
fs.writeFileSync(fragrancesPath, JSON.stringify(fragrancesData, null, 2));

console.log(`\n✅ Updated fragrancesV2.json`);
console.log(`   Updated: ${updatedCount} entries`);
console.log(`   Skipped: ${skippedCount} entries (no local image)`);
console.log(`\n📝 Changes made:`);
console.log(`   - Image URLs now point to /fragrances/images/{filename}`);
console.log(`   - No more external CDN requests`);
console.log(`   - Zero image optimization costs for these images`);

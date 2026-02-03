const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const fragrancesData = require('../data/fragrancesV2.json');

const publicDir = path.join(__dirname, 'public', 'fragrances');
const imagesDir = path.join(publicDir, 'images');

// Create directories if they don't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Helper to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filePath);

    protocol
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.destroy();
          downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.destroy();
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete incomplete file
        reject(err);
      });
  });
}

// Generate filename from fragrance name and index
function generateFileName(name, index) {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${index}-${sanitized}.jpg`;
}

// Main download function
async function downloadAllImages() {
  console.log(`📦 Starting download of ${fragrancesData.length} images...\n`);

  let downloaded = 0;
  let failed = 0;
  const failedUrls = [];

  // Create a mapping file to reference local images
  const imageMapping = {};

  for (let i = 0; i < fragrancesData.length; i++) {
    const fragrance = fragrancesData[i];
    const imageUrl = fragrance['Image URL'];

    if (!imageUrl) {
      console.log(`⏭️  Skipping ${fragrance.Name} (no image URL)`);
      continue;
    }

    const fileName = generateFileName(fragrance.Name, i);
    const filePath = path.join(imagesDir, fileName);
    const localPath = `/fragrances/images/${fileName}`;

    try {
      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${i + 1}/${fragrancesData.length} Already exists: ${fragrance.Name}`);
        imageMapping[i] = localPath;
        downloaded++;
        continue;
      }

      await downloadFile(imageUrl, filePath);
      console.log(`✅ ${i + 1}/${fragrancesData.length} Downloaded: ${fragrance.Name}`);
      imageMapping[i] = localPath;
      downloaded++;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ ${i + 1}/${fragrancesData.length} Failed: ${fragrance.Name}`);
      console.error(`   Error: ${error.message}\n`);
      failed++;
      failedUrls.push({ index: i, name: fragrance.Name, url: imageUrl, error: error.message });
    }
  }

  // Save image mapping to JSON
  const mappingPath = path.join(publicDir, 'image-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
  console.log(`\n📋 Image mapping saved to: ${mappingPath}`);

  // Save failed URLs for retry
  if (failedUrls.length > 0) {
    const failedPath = path.join(publicDir, 'failed-downloads.json');
    fs.writeFileSync(failedPath, JSON.stringify(failedUrls, null, 2));
    console.log(`⚠️  Failed URLs saved to: ${failedPath}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Downloaded: ${downloaded}/${fragrancesData.length}`);
  console.log(`   Failed: ${failed}/${fragrancesData.length}`);
  console.log(`\n💾 Images saved to: ${imagesDir}`);
}

downloadAllImages().catch(console.error);

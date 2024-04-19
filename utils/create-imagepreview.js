const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
process.chdir(__dirname);

const metadataFolder = '../gallery/metadata'; // Replace with your actual metadata folder path

async function collectPaths(dir) {
  const files = fs.readdirSync(dir);
  let paths = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      paths = paths.concat(await collectPaths(filePath));
    } else if (file === 'preview.html') {
      paths.push(filePath);
    }
  }

  return paths;
}

async function takeScreenshot(filePath) {
  console.log("Processing: ", filePath)
  const packageName = path.basename(path.dirname(filePath));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log("Taking screenshot for", packageName)

  try {
    await page.goto(`https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/preview.html`, { waitUntil: 'networkidle0' });

    if (response.status() === 404) {
      throw new Error('Page not found (404)');
    }
  
    console.log(`Loaded: https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/preview.html`);

  } catch (error) {
    let absolutePath = path.resolve(filePath);

    console.log(`Failed to navigate to page for ${packageName}: ${error.message}`);
    console.log(`Attempting to load local file: ${absolutePath}`);

    await page.goto("file://"+absolutePath);

  }

  await page.waitForTimeout(7000);

  await page.screenshot({ path: path.join(path.dirname(filePath), 'screenshot.png') });

  await browser.close();
  console.log("Done: ", packageName)
}

async function processPaths(paths) {
  // Process paths in batches of 10
  for (let i = 0; i < paths.length; i += 10) {
    const batch = paths.slice(i, i + 10);
    await Promise.all(batch.map(takeScreenshot));
  }
}

collectPaths(metadataFolder)
  .then(processPaths)
  .catch(console.error);

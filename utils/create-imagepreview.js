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
  const packageName = path.basename(path.dirname(filePath));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log("Taking screenshot for", packageName)
  // Go to the URL of the preview.html file
  await page.goto(`https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/preview.html`);

  await page.waitForTimeout(6000);

  // Take a screenshot and save it in the same folder as preview.html
  await page.screenshot({ path: path.join(path.dirname(filePath), 'screenshot.png') });

  await browser.close();
  console.log("Done: ", packageName)
}

async function processPaths(paths) {
  // Process paths in batches of 20
  for (let i = 0; i < paths.length; i += 20) {
    const batch = paths.slice(i, i + 20);
    await Promise.all(batch.map(takeScreenshot));
  }
}

collectPaths(metadataFolder)
  .then(processPaths)
  .catch(console.error);

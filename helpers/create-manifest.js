const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const crypto = require('crypto');
const https = require('https');

process.chdir(__dirname);

const galleryDir = '../gallery/packages';
const manifestFile = path.join("../gallery/", 'gallery.manifest');

const manifest = { "packages": [], "common": {} };
let successfulUrls = [];

function getSHA1(filePath) {
  const hashSum = crypto.createHash('sha1');

  fs.readdirSync(filePath).forEach(file => {
    const fileFullPath = path.join(filePath, file);
    const stats = fs.statSync(fileFullPath);

    if (stats.isFile()) {
      const fileBuffer = fs.readFileSync(fileFullPath);
      hashSum.update(crypto.createHash('sha1').update(fileBuffer).digest('hex'));
    } else if (stats.isDirectory()) {
      hashSum.update(getSHA1(fileFullPath));
    }
  });

  return hashSum.digest('hex');
}

async function readDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      readDirectory(filePath);
    } else if (file === 'package.yaml') {

      const packageData = YAML.parse((fs.readFileSync(filePath, 'utf8')));
      const packageDir = path.dirname(filePath);
      const packageName = path.basename(packageDir);
      manifest.packages.push({
        id: packageName,
        version: packageData.version,
        name: packageData.metadata.name,
        description: packageData.metadata.description,
        author: packageData.metadata.author,
        source: packageData.metadata.source,
        hash: getSHA1(packageDir),
        parameters: packageData.parameters,
      });

      try {
        if (packageData.template) {
          const commonMatches = packageData.template.matchAll(/{{\s*common:\s*([^\s}]+)\s*}}/g);

          for (const match of commonMatches) {
            const url = match[1];
            console.log(`Found a common url: ${url}`);

            const fileName = path.basename(url);
            // put the path sha1 after common
            let sha1 = crypto.createHash('sha1').update(url).digest('hex');
            const filePath = path.join("../gallery/common/", sha1 + "_" + fileName);

            try {

              if (!fs.existsSync(filePath)) {
                if (successfulUrls.includes(url)) {
                  console.log(`Already fetched: ${url}`);
                  continue;
                }

                const options = {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                  }
                };

                console.log(`Fetching: ${url}`);
                await new Promise((resolve, reject) => {
                  https.get(url.trim(), options, (response) => {
                    if (response.statusCode !== 200) {
                      reject(new Error(`Failed to fetch ${url}: status code ${response.statusCode}`));
                      return;
                    }

                    const fileStream = fs.createWriteStream(filePath);
                    response.pipe(fileStream);

                    fileStream.on('finish', () => {
                      fileStream.close(() => {
                        console.log(`Fetched and saved: ${filePath}`);
                        resolve();
                      });
                    });
                  }).on('error', (err) => {
                    reject(err);
                  });
                });

                successfulUrls.push(url);
              } else {
                console.log(`Already exists: ${filePath}`);
              }

              manifest.common[url] = { hash: sha1, filename: fileName };

            } catch (error) {
              console.error(`Failed to fetch ${url}:`, error);
            }
          }
        }
      } catch {
        console.error(`Something broke while processing file get`);

      }

    }
  }
}

readDirectory(galleryDir);

manifest.packages.sort((a, b) => {
  const aIdNumber = parseInt(a.id.match(/\d+/g));
  const bIdNumber = parseInt(b.id.match(/\d+/g));
  return aIdNumber - bIdNumber;
});

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`Generated manifest file: ${manifestFile}`);












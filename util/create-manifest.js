const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const crypto = require('crypto');

process.chdir(__dirname);

const galleryDir = '../gallery/packages';
const manifestFile = path.join("../gallery/", 'gallery.manifest');

const manifest = [];

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

function readDirectory(dir) {
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
      manifest.push({
        id: packageName,
        version: packageData.version,
        name: packageData.metadata.name,
        description: packageData.metadata.description,
        author: packageData.metadata.author,
        source: packageData.metadata.source,
        hash: getSHA1(packageDir),
        parameters: packageData.parameters,
      });
    }
  }
}

readDirectory(galleryDir);

manifest.sort((a, b) => {
  const aIdNumber = parseInt(a.id.match(/\d+/g));
  const bIdNumber = parseInt(b.id.match(/\d+/g));
  return aIdNumber - bIdNumber;
});

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`Generated manifest file: ${manifestFile}`);
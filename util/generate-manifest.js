const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

process.chdir(__dirname);

const galleryDir = '../gallery/packages';
const manifestFile = path.join("../gallery/", 'gallery.manifest');

const manifest = [];

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
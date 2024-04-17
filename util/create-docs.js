const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
process.chdir(__dirname);

const galleryDir = '../gallery/packages';
const documentationPath = '../docs/DOCUMENTATION.md';

const authors = {};
const packages = [];

const ignoreDirs = ['0.test'];

function readDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (ignoreDirs.includes(file)) {
      continue;
    }
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      readDirectory(filePath);
    } else if (file === 'package.yaml') {
      const packageData = YAML.parse(fs.readFileSync(filePath, 'utf8'));
      const author = packageData.metadata.author;
      authors[author] = (authors[author] || 0) + 1;
      // Get the directory name containing the package.yaml file
      const packageName = path.basename(path.dirname(filePath));
      packages.push(`      # Author: ${packageData.metadata.author}\n      # ${packageData.metadata.description}\n      - id: ${packageName} \n`);
    }
  }
}

readDirectory(galleryDir);

const sortedAuthors = Object.entries(authors)
  .sort((a, b) => b[1] - a[1]);

const html = sortedAuthors
  .map(([author, count]) => ` - ${author} (${count})`)
  .join('\n');

const readmePath = path.join(__dirname, '../README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Replace the section below #### Artists with the new html using regex pattern matching
let regex = /(#### Artists featured)([\s\S]*?)(### Donations and Tips)/;
readmeContent = readmeContent.replace(regex, `$1\n\n${html}\n$3`);

// Write the updated content back to the README.md file
fs.writeFileSync(readmePath, readmeContent, 'utf8');
// Check if the DOCS.MD file exists
if (!fs.existsSync(documentationPath)) {
  // If it doesn't exist, create it with the initial content
  fs.writeFileSync(documentationPath, '### Documentation\n\nAll current packages\n\n```yaml\n\n```', 'utf8');
}

// Write the package names to the DOCS.MD file
let documentationContent = fs.readFileSync(documentationPath, 'utf8');
regex = /(### Documentation\n\nAll current packages\n\n```yaml\n)([\s\S]*?)(\n```)/;
documentationContent = documentationContent.replace(regex, `$1${packages.join('\n')}$3`);

console.log(documentationContent)

fs.writeFileSync(documentationPath, documentationContent, 'utf8');
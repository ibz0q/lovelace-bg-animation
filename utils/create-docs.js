const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
process.chdir(__dirname);

const galleryDir = '../gallery/packages';
const documentationPath = '../docs/EXTENDED.md';

const authors = {};
const packages = [];

const ignoreDirs = ['0.test'];

let extendedContent = `
  
### Documentation

This file is generated through an Github Action automation, if any of the image previews do not load. There is an issue with the action.  

## Available backgrounds

`;

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
      const packageName = path.basename(path.dirname(filePath));

      extendedContent += `

###  ${packageName} 
${packageData.metadata.name} - ${packageData.metadata.description} by ${packageData.metadata.author}

![Image Preview](https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/screenshot.png)

Live Preview: [preview.html](https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/preview.html)

Place this inside your config: 
      
\`\`\`yaml
- id: ${packageName}
\`\`\`


`
    }
  }
}

readDirectory(galleryDir);

// Readme.md
const sortedAuthors = Object.entries(authors)
  .sort((a, b) => b[1] - a[1]);

const html = sortedAuthors
  .map(([author, count]) => ` - ${author} (${count})`)
  .join('\n');

const readmePath = path.join(__dirname, '../README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Replace the section below #### Artists with the new html using regex pattern matching
let regex = /(#### Artists featured)([\s\S]*?)(#### Donations and Tips)/;
readmeContent = readmeContent.replace(regex, `$1\n\n${html}\n$3`);

// Write the updated content back to the README.md file
fs.writeFileSync(readmePath, readmeContent, 'utf8');


// Check if the EXTENDED.MD file exists
if (!fs.existsSync(documentationPath)) {
  // If it doesn't exist, create it with the initial content
  fs.writeFileSync(documentationPath, content, 'utf8');
}

fs.writeFileSync(documentationPath, extendedContent, 'utf8');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { version } = require('../package.json');

process.chdir(__dirname);

const galleryDir = '../gallery/packages';
const documentationPath = '../docs/EXTENDED.md';
const authors = {};
const ignoreDirs = ['0.test'];
let count = 1;
let availableBgs = "";

function supportsOfflineMode(obj) {
  let hasUrl = false;

  function searchObject(obj) {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && key !== 'metadata') {
        searchObject(obj[key]);
      } else if (typeof obj[key] === 'string') {
        if (obj[key].includes('http://') || obj[key].includes('https://')) {
          // return using regex search for link and script tags with src and href attribute
          let match = obj[key].match(/<link.*?href=["'](http:\/\/|https:\/\/).*?["'].*?>|<script.*?src=["'](http:\/\/|https:\/\/).*?["'].*?><\/script>/g);
          if (match) {
            console.log(match[0])
            hasUrl = match[0];
          }

        }
      }
    }
  }

  searchObject(obj);
  return hasUrl;
}

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
      count++;

      const packageData = YAML.parse(fs.readFileSync(filePath, 'utf8'));
      const author = packageData.metadata.author;
      authors[author] = (authors[author] || 0) + 1;
      const packageName = path.basename(path.dirname(filePath));
      let offlineMode = supportsOfflineMode(packageData);
      let offlineModeExpand;
      if (supportsOfflineMode(packageData) == false) {
        offlineModeExpand = "**Yes**";
      } else {

        offlineModeExpand = `No
<details>
    <summary>(external dependencies detected, need inlining)</summary>
    <br />

Found these dependencies in (${filePath}) that need to be inlined for offline mode. Please help inline them and submit a PR.

\`\`\`HTML
${offlineMode}
\`\`\`

---

</details>


<br />
`
      }

      availableBgs += `

###  > ${packageName} (${packageData.metadata.name} - ${packageData.metadata.description})

\`- id: ${packageName}\`

![Image Preview](https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/screenshot.png)
[Live Preview](https://ibz0q.github.io/lovelace-bg-animation/gallery/metadata/${packageName}/preview.html) - *Author: ${packageData.metadata.author}* - Offline support? ${offlineModeExpand}`
    }
  }
}

readDirectory(galleryDir);

let extendedContent = `
  
# Extended Documentation

This file is generated through an Github Action, if any of the image previews do not load. There is an issue with the action.  

## All backgrounds (${count} total)

`;


// Readme.md
const sortedAuthors = Object.entries(authors)
  .sort((a, b) => b[1] - a[1]);

const html = sortedAuthors
  .map(([author, count]) => ` - ${author} (${count})`)
  .join('\n');

const readmePath = path.join(__dirname, '../README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Replace the section below #### Artists with the new html using regex pattern matching
let regex = /(Tributes \(Artists featured\))([\s\S]*?)(### Support)/;
readmeContent = readmeContent.replace(regex, `$1\n\n${html}\n$3`);


// Replace the version number with the one from package.json
readmeContent = readmeContent.replace(/Current Release:\s*v[\d\.]+/g, `Current Release: v${version}`);

// Write the updated content back to the README.md file
fs.writeFileSync(readmePath, readmeContent, 'utf8');


console.log("README.md updated successfully");

// Check if the EXTENDED.MD file exists
if (!fs.existsSync(documentationPath)) {
  // If it doesn't exist, create it with the initial content
  fs.writeFileSync(documentationPath, content, 'utf8');
}

fs.writeFileSync(documentationPath, extendedContent + availableBgs, 'utf8');
// console.log(extendedContent + availableBgs);
console.log("Documentation updated successfully");
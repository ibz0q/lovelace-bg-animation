// A function that takes a file path, reads the contents of the file and then checks all of git history
// for the most similar file it saw commited to git, checks its similarity in percentage
// it then returns the date the file with the most similarity was originally added to the git
// to make things more efficient, we should check files only with the same extension

const simpleGit = require('simple-git');
const git = simpleGit();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkCommitsToTemp() {
    try {
      await fs.mkdir('./temp', { recursive: true });
      const commits = await git.log();
      const total = commits.all.length;
      
      for (let i = 0; i < commits.all.length; i++) {
        const commit = commits.all[i];
        const commitDir = path.join('./temp', `git_${commit.hash}`);
        const targetPath = path.join(commitDir, 'gallery');
        
        // Skip if directory already exists
        try {
          await fs.access(targetPath);
          console.log(`${i+1}/${total} Skipping existing commit ${commit.hash}`);
          continue;
        } catch (err) {
          // Directory doesn't exist, proceed with extraction
        }
        
        await fs.mkdir(commitDir, { recursive: true });
        
        try {
          // Extract gallery directory
          await execAsync(`git --work-tree="${commitDir}" checkout ${commit.hash} -- gallery`);
          
          // Remove metadata and common folders
          const metadataPath = path.join(targetPath, 'metadata');
          const commonPath = path.join(targetPath, 'common');
          
          await fs.rm(metadataPath, { recursive: true, force: true });
          await fs.rm(commonPath, { recursive: true, force: true });
          
          console.log(`${i+1}/${total} Extracted commit ${commit.hash}`);
        } catch (err) {
          console.log(`${i+1}/${total} Failed to extract commit ${commit.hash} - ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }



}
checkCommitsToTemp();


// const fs = require('fs').promises;
// const path = require('path');

// async function processYAMLFile(filePath) {
//   try {
//         console.log('Checking:', filePath);

//         await analyzeFile(filePath).then(result => {
//             console.log('Most Similar File Date:', result.mostSimilarFile);
//             console.log('Similarity:', result.similarity);
//             console.log('Original Date:', result.originalDate);
//           }).catch(error => {
//             console.error('Error:', error);
//           });
          
          
//     } catch (err) {
//         console.error(`Failed to process ${filePath}:`, err);
//     }
// }

// async function processDirectory(directory) {
//     try {
//       const files = await fs.readdir(directory);
  
//       for (const file of files) {
//         console.log(file);
//         const filePath = path.join(directory, file);
//         const stat = await fs.stat(filePath);
  
//         if (stat.isDirectory()) {
//           await processDirectory(filePath); 
//         } else if (file === 'package.yaml') {
//           await processYAMLFile(filePath); 
//         }
//       }
//     } catch (err) {
//       console.error('Unable to scan directory:', err);
//     }
//   }
  
// processDirectory('../gallery/packages')









// const fs = require('fs');
// const path = require('path');
// const YAML = require('yaml');
// const { execSync } = require('child_process');
// const stringSimilarity = require('string-similarity');

// const directory = '../gallery/packages';



// function readFileContent(filePath) {
//     return fs.readFileSync(filePath, 'utf8');
// }


// async function processYAMLFile(filePath) {

//   try {
//         const fileContent = fs.readFileSync(filePath, 'utf8');

//         // Get the list of all files in the Git history
//         const files = execSync('git ls-tree -r --name-only HEAD', { encoding: 'utf8' }).trim().split('\n');

//         let mostSimilarFile = null;
//         let highestSimilarity = 0;

//         files.forEach(file => {
//             const fileContent = readFileContent(file);
//             // const similarity = stringSimilarity.compareTwoStrings(targetContent, fileContent);
// console.log(file);
//             return;
//             if (similarity > highestSimilarity) {
//                 highestSimilarity = similarity;
//                 mostSimilarFile = { file, similarity };
//             }
//         });

//         return mostSimilarFile;

//     //     let parsedYAML = YAML.parse(fileContent);


//     //     if(parsedYAML.metadata.format == false)
//     //     {
//     //         console.log(`Skipping ${filePath}`);
//     //         return;
//     //     }
        
//     //     if (parsedYAML.template) {
//     //         let templateContent = parsedYAML.template;

//     //         parsedYAML.template = prettyContent;

//     //         const updatedYAML = YAML.stringify(parsedYAML);

//     //         fs.writeFileSync(filePath, updatedYAML, 'utf8');

//     //         console.log(`Processed and saved: ${filePath}`);
//     //     } else {
//     //         console.log(`No template found in: ${filePath}`);
//     //     }
//     } catch (err) {
//         console.error(`Failed to process ${filePath}:`, err);
//     }
// }

// function processDirectory(directory) {
//     fs.readdir(directory, (err, files) => {
//         if (err) {
//             return console.error('Unable to scan directory:', err);
//         }

//         files.forEach(file => {
//             const filePath = path.join(directory, file);

//             if (fs.statSync(filePath).isDirectory()) {
//                 processDirectory(filePath); // Recursive call for subdirectories
//             } else if (file === 'package.yaml') {
//                 processYAMLFile(filePath);
//             }
//         });
//     });
// }

// processDirectory(directory);
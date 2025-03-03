const { execSync } = require('child_process');
const fs = require('fs');
const stringSimilarity = require('string-similarity');

// Tag package.yaml with added date (Check git history for similar files),
// add tag if code looks like it supports interactivity (mouse events, keyboard etc.) 
// add tags for offline support, add tags for common patterns (like commonPath, common:)

/**
 * Read the content of a file.
 * @param {string} filePath - The path to the file.
 * @returns {string} - The content of the file.
 */
function readFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Find the file in the Git history with the highest content similarity.
 * @param {string} targetContent - The content of the target file.
 * @returns {Object} - An object containing the file path and similarity score of the most similar file.
 */
function findMostSimilarFile(targetContent) {
    try {
        // Get the list of all files in the Git history
        const files = execSync('git ls-tree -r --name-only HEAD', { encoding: 'utf8' }).trim().split('\n');

        let mostSimilarFile = null;
        let highestSimilarity = 0;

        files.forEach(file => {
            const fileContent = readFileContent(file);
            const similarity = stringSimilarity.compareTwoStrings(targetContent, fileContent);
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                mostSimilarFile = { file, similarity };
            }
        });

        return mostSimilarFile;
    } catch (error) {
        console.error('Failed to find the most similar file by content similarity:', error);
        return null;
    }
}

// Example usage
const filePath = 'path/to/your/file.ext';
const targetContent = readFileContent(filePath);
const mostSimilarFile = findMostSimilarFile(targetContent);

if (mostSimilarFile) {
    console.log(`The most similar file is: ${mostSimilarFile.file} (similarity: ${mostSimilarFile.similarity})`);
} else {
    console.log('No similar files found.');
}
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const prettier = require('prettier');

// Directory where the YAML files are located
const directory = '../gallery/packages';

// Async function to read a file, parse YAML, pretty-format template, and save it back
async function processYAMLFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let parsedYAML = YAML.parse(fileContent);

        if (parsedYAML.template) {
            let templateContent = parsedYAML.template;

            // Prettify the mixed HTML, CSS, and JS content using Prettier
            const prettyContent = await prettier.format(templateContent, { parser: 'html' });

            // Replace the template content with formatted version
            parsedYAML.template = prettyContent;

            // Convert the updated YAML object back to string
            const updatedYAML = YAML.stringify(parsedYAML);

            // Write the prettified content back to the YAML file
            fs.writeFileSync(filePath, updatedYAML, 'utf8');

            console.log(`Processed and saved: ${filePath}`);
        } else {
            console.log(`No template found in: ${filePath}`);
        }
    } catch (err) {
        console.error(`Failed to process ${filePath}:`, err);
    }
}

function processDirectory(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            return console.error('Unable to scan directory:', err);
        }

        // Loop through files and directories
        files.forEach(file => {
            const filePath = path.join(directory, file);

            // Check if it's a directory, if so, call processDirectory recursively
            if (fs.statSync(filePath).isDirectory()) {
                processDirectory(filePath); // Recursive call for subdirectories
            } else if (file === 'package.yaml') {
                // Ensure async handling for the file processing
                processYAMLFile(filePath);
            }
        });
    });
}

// Call the function to start processing
processDirectory(directory);
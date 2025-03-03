const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const prettier = require('prettier');

const directory = '../gallery/packages';

async function processYAMLFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let parsedYAML = YAML.parse(fileContent);

        if(parsedYAML.metadata.format == false)
        {
            console.log(`Skipping ${filePath}`);
            return;
        }
        
        if (parsedYAML.template) {
            let templateContent = parsedYAML.template;

            const prettyContent = await prettier.format(templateContent, {
                parser: 'html',
                htmlWhitespaceSensitivity: 'ignore'
            });

            parsedYAML.template = prettyContent;

            const updatedYAML = YAML.stringify(parsedYAML);

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

        files.forEach(file => {
            const filePath = path.join(directory, file);

            if (fs.statSync(filePath).isDirectory()) {
                processDirectory(filePath); // Recursive call for subdirectories
            } else if (file === 'package.yaml') {
                processYAMLFile(filePath);
            }
        });
    });
}

processDirectory(directory);
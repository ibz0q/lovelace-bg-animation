const sass = require('sass');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const crypto = require('crypto');

process.chdir(__dirname);

async function processPackageManifest(packageManifestObject) {
    try {

        let environment = {}
        environment["assetPath"] = `../gallery/packages/${packageManifestObject.id}/`;

        if (packageManifestObject.data.remote_includes) {
            for (const [index, include] of packageManifestObject.data.remote_includes.entries()) {
                packageManifestObject.data.remote_includes[index]["__processed"] = {};
                packageManifestObject.data.remote_includes[index]["__processed"] = await fetch(url, { cache: "no-store" });

                if (!response.ok) {
                    console.error(`Failed to fetch resource: ` + url);
                }
            }
        }

        if (packageManifestObject.data.compile) {

            for (const [index, value] of packageManifestObject.data.compile.entries()) {

                if (value.hasOwnProperty("scss")) {
                    packageManifestObject.data.compile[index]["__processed"] = sass.compileString(packageManifestObject.data.compile[index].scss).css;
                }

            }

        }

        if (packageManifestObject.data.template) {

            packageManifestObject.data.template__processed = packageManifestObject.data.template
            const regex = /\{\{(compile|parameter|parameters|param|metadata|meta|environment|env|remote_includes):(.*?)\}\}/g;
            packageManifestObject.data.template__processed = packageManifestObject.data.template__processed.replace(regex, function (match, type, key) {
                key = key.trim();
                console.log(key)
                switch (type) {
                    case 'compile':
                        return packageManifestObject.data.compile.find(item => item.id === key)?.__processed || '';
                    case 'parameters':
                    case 'parameter':
                    case 'param':
                        return packageManifestObject.data.parameters.find(item => item.id == key)?.default || match;
                    case 'metadata':
                    case 'meta':
                        return packageManifestObject.data.metadata?.[key] || match;
                    case 'environment':
                    case 'env':
                        return environment[key] || match;
                    case 'remote_includes':
                        if (Array.isArray(packageManifestObject.data.remote_includes)) {
                            const include = packageManifestObject.data.remote_includes.find(item => item.id === key);
                            return include?.__processed || match;
                        }
                        return match;
                    default:
                        return match;
                }
            });

        } else {
            console.error("Template does not exist in package, it is required.");
        }

        return packageManifestObject;

    } catch (error) {
        console.error('Failed to process the package manifest: ' + packageManifestObject, error);
        return null;
    }
}

const galleryDir = '../gallery/';
const packagesDir = '../gallery/packages';
const metadataFolder = path.join("../gallery/metadata");
let templateProcessed;
const metadataManifest = [];

async function readDirectory(dir) {    
    fs.rmSync(metadataFolder, { recursive: true, force: true });
    fs.mkdirSync(metadataFolder, { recursive: true });
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            readDirectory(filePath);
        } else if (file === 'package.yaml') {
            const packageData = YAML.parse((fs.readFileSync(filePath, 'utf8')));

            console.log(sha1Hash)
            const packageDir = path.dirname(filePath);
            const packageName = path.basename(packageDir);

            console.log(`Generating.. ${packageName}`);
            templateProcessed = await processPackageManifest({ "data": packageData, "packageIndex": packageName});

            // Create a new folder for the package
            const packageFolder = path.join(metadataFolder, packageName);
            fs.mkdirSync(packageFolder, { recursive: true });

            // Write the metadata file inside the package folder
            const metadataFilePath = path.join(packageFolder, 'preview.html');
            
            // Create a string of HTML comments with the metadata
            let metadataComments = '';
            if (packageData.metadata) {
                for (const [key, value] of Object.entries(packageData.metadata)) {
                    metadataComments += `<!-- ${key}: ${value} -->\n`;
                }
            }

            fs.writeFileSync(metadataFilePath, `<!DOCTYPE html>\n${metadataComments}`+templateProcessed.data.template__processed, 'utf8');
            console.log(`Generated: ${packageName}`);
        }
    }
}

/// Snippet from package.yaml
// version: v1
// metadata:
//     name: Colored Swipe Transition
//     description: Whole page colored swipes
//     author: Andreas Wilcox
//     source: https://codepen.io/SvDvorak/pen/bxoxde


readDirectory(packagesDir);


const sass = require('sass');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const crypto = require('crypto');

process.chdir(__dirname);

const galleryDir = '../gallery/';
const galleryManifest = '../gallery/gallery.manifest';
const packagesDir = '../gallery/packages';
const metadataFolder = path.join("../gallery/metadata");
const metadataManifest = [];

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

async function processPackageManifest(packageManifestObject) {
    try {

        let environment = {}
        environment["assetPath"] = `../gallery/packages/${packageManifestObject.id}/`;

        if (packageManifestObject.data.remote_includes) {
            for (const [index, include] of packageManifestObject.data.remote_includes.entries()) {
                packageManifestObject.data.remote_includes[index]["__processed"] = {};
                packageManifestObject.data.remote_includes[index]["__processed"] = await fetch(include.url, { cache: "no-store" });
            }
        }

        if (packageManifestObject.data.compile) {
            for (const [index, value] of packageManifestObject.data.compile.entries()) {
                if (value.hasOwnProperty("scss")) {
                    packageManifestObject.data.compile[index]["__processed"] = sass.compileString(packageManifestObject.data.compile[index].scss).css;
                }

            }

        }

        if (typeof window !== 'undefined') {
            if (packageManifestObject.data?.helpers?.insert_baseurl == true) {
                let insert_baseurl = '<base href="' + environment["basePath"] + '" target="_blank">';
                if (packageManifestObject.data.template.includes('<head>')) {
                    packageManifestObject.data.template = packageManifestObject.data.template.replace(/(?<=<head>)/, `\n${insert_baseurl}`);
                } else if (packageManifestObject.data.template.includes('<html>')) {
                    packageManifestObject.data.template = packageManifestObject.data.template.replace(/(?<=<html>)/, `\n${insert_baseurl}`);
                }
            }
        }

        if (packageManifestObject.data.template) {

            packageManifestObject.data.template__processed = packageManifestObject.data.template
            const regex = /\{\{(compile|parameter|parameters|param|metadata|meta|environment|env|remote_includes):(.*?)\}\}/g;
            packageManifestObject.data.template__processed = packageManifestObject.data.template__processed.replace(regex, function (match, type, key) {
                key = key.trim();
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

async function readDirectory(dir) {
    if (process.env.GITHUB_ACTIONS !== 'true') {
        fs.rmSync(metadataFolder, { recursive: true, force: true });
        console.log("Script is being run inside a GitHub Action and will not delete the metadata folder.")
    }

    fs.mkdirSync(metadataFolder, { recursive: true });

    const files = fs.readdirSync(dir);
    const manifestData = YAML.parse((fs.readFileSync(galleryManifest, 'utf8')));

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            readDirectory(filePath);
        } else if (file === 'package.yaml') {
            const packageData = YAML.parse((fs.readFileSync(filePath, 'utf8')));
            const packageDir = path.dirname(filePath);
            const packageName = path.basename(packageDir);
            const packageFolder = path.join(metadataFolder, packageName);
            const metadataFilePath = path.join(packageFolder, 'preview.html');

            folderHash = getSHA1(packageDir);
            const manifestEntry = Object.values(manifestData).find(entry => entry.id === packageName);

            if ((manifestEntry && manifestEntry.hash === folderHash)) {
                console.log(`Hash is the same for ${packageName}, skipping.`);
                if (process.env.GITHUB_ACTIONS === 'true') {
                    console.log("Script is being run inside a GitHub Action, skipping...");

                }
            }

            console.log(`Generating.. ${packageName}`);
            templateProcessed = await processPackageManifest({ "data": packageData, "packageIndex": packageName });

            fs.mkdirSync(packageFolder, { recursive: true });

            let metadataComments = '';
            if (packageData.metadata) {
                for (const [key, value] of Object.entries(packageData.metadata)) {
                    metadataComments += `<!-- ${key}: ${value} -->\n`;
                }
            }
            templateProcessed.data.template__processed = templateProcessed.data.template__processed.replace(/<!DOCTYPE html>\n?/, '');
            templateProcessed.data.template__processed = templateProcessed.data.template__processed.replace(/CodePen -\s?|CodePen/g, '');
            fs.writeFileSync(metadataFilePath, `<!DOCTYPE html>\n\n${metadataComments}\n` + templateProcessed.data.template__processed, 'utf8');
            console.log(`Generated: ${packageName}`);
        }
    }
}


readDirectory(packagesDir);


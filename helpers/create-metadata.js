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
let galleryRootManifest = [];

function getFileSHA1(filePath) {
    const hashSum = crypto.createHash('sha1');

    fs.readdirSync(filePath).forEach(file => {
        const fileFullPath = path.join(filePath, file);
        const stats = fs.statSync(fileFullPath);

        if (stats.isFile()) {
            const fileBuffer = fs.readFileSync(fileFullPath);
            hashSum.update(crypto.createHash('sha1').update(fileBuffer).digest('hex'));
        } else if (stats.isDirectory()) {
            hashSum.update(getFileSHA1(fileFullPath));
        }
    });

    return hashSum.digest('hex');
}

async function processPackageManifest(packageManifestObject) {
    try {

        let environment = {};
        environment["rootPath"] = "/gallery/"
        environment["basePath"] = environment["rootPath"]
        environment["assetPath"] = `../gallery/packages/${packageManifestObject.id}/`
        environment["commonPath"] = `../../../gallery/common/`

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

            const regex = /\{\{\s*(compile|parameter|parameters|param|metadata|meta|environment|env|common):\s*(.*?)\}\}/g;
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
                    case 'common':
                        try {
                            if (galleryRootManifest?.common && galleryRootManifest?.common[key]) {
                                return environment["commonPath"] + galleryRootManifest?.common[key].hash + "_" + galleryRootManifest?.common[key].filename
                            } else {
                                return match;
                            }
                        } catch (error) {
                            console.error(`Failed to process common: ${key}`, error);
                            return match;
                        }
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
        return false;
    }
}

async function readDirectory(dir) {
    // fs.rmSync(metadataFolder, { recursive: true, force: true });
    fs.mkdirSync(metadataFolder, { recursive: true });
    const files = fs.readdirSync(dir);
    galleryRootManifest = JSON.parse((fs.readFileSync(galleryManifest, 'utf8')));

    try {

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {

                readDirectory(filePath);

            } else if (file === 'package.yaml') {

                console.log(`\n===\n`)

                const packageData = YAML.parse((fs.readFileSync(filePath, 'utf8')));
                const packageDir = path.dirname(filePath);
                const packageName = path.basename(packageDir);
                const packageFolder = path.join(metadataFolder, packageName);
                const metadataFilePath = path.join(packageFolder, 'preview.html');
                console.log(`Starting: ${packageName} \n`);

                folderHash = getFileSHA1(packageDir);
                console.log(`Folder hash is ${folderHash}`)

                const manifestEntry = Object.values(galleryRootManifest.packages).find(entry => entry.id === packageName);

                console.log(`Manifest hash is ${manifestEntry.hash}`)
                console.log(`Metadata status is ${fs.existsSync(metadataFilePath)} : ${metadataFilePath}`)

                if (fs.existsSync(metadataFilePath) == true && (manifestEntry.hash === folderHash)) {
                    console.log(`Hash is the same for ${packageName}, skipped.`);
                    continue;
                }

                if (fs.existsSync(metadataFilePath)) {
                    console.log(`Folder exist for ${packageName}, skipping.`);
                    continue;
                }

                console.log(`Generating.. ${packageName}`);
                templateProcessed = await processPackageManifest({ "data": packageData, "packageIndex": packageName });

                fs.mkdirSync(packageFolder, { recursive: true });
                fs.cpSync(packageDir, packageFolder, {
                    recursive: true,
                    preserveTimestamps: true,
                    filter: (src) => {
                        const excludePatterns = ['package.yaml'];
                        return !excludePatterns.some(pattern => {
                            return typeof pattern === 'string' ? src.endsWith(pattern) : pattern.test(src);
                        });
                    }
                });

                let metadataComments = '';
                if (packageData.metadata) {
                    for (const [key, value] of Object.entries(packageData.metadata)) {
                        metadataComments += `<!-- ${key}: ${value} -->\n`;
                    }
                }

                templateProcessed.data.template__processed = templateProcessed.data.template__processed.replace(/<!DOCTYPE html>\n?/, '');
                templateProcessed.data.template__processed = templateProcessed.data.template__processed.replace(/CodePen -\s?|CodePen/g, '');
                let htmldata = `<!DOCTYPE html>` + templateProcessed.data.template__processed + `\n\n${metadataComments}\n`
                fs.writeFileSync(metadataFilePath, htmldata.replace(/\n/g, '\r\n'), 'utf8');

                console.log(`Generated: ${packageName} \n`);
                console.log(`=== \n`);

            }

        }

    } catch (err) {
        console.error("Something broke");
        console.error(err);
    }
}


readDirectory(packagesDir);


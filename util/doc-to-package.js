const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
process.chdir(__dirname);

const inputDir = './import';
const outputDir = './output';

fs.readdirSync(inputDir).forEach(package => {
    console.log(package)
    const packageDir = path.join(inputDir, package, 'dist');
    const outputPackageDir = path.join(outputDir, package);
    fs.mkdirSync(outputPackageDir, { recursive: true });

    let indexHtml = fs.readFileSync(path.join(packageDir, 'index.html'), 'utf-8');

    let scriptJs = '';
    const scriptJsPath = path.join(packageDir, 'script.js');
    if (fs.existsSync(scriptJsPath)) {
        scriptJs = fs.readFileSync(scriptJsPath, 'utf-8');
    }

    const styleCss = fs.readFileSync(path.join(packageDir, 'style.css'), 'utf-8');
    const readmeMd = fs.readFileSync(path.join(inputDir, package, 'README.md'), 'utf-8');

    // Extract metadata from README.md
    const name = readmeMd.match(/# (.*?)\n/)[1];
    const description = readmeMd.match(/\n(.*?)\n/)[1];
    const source = readmeMd.match(/\[(.*?)\]\((.*?)\)/)[2];

    // Insert CSS into HTML
    indexHtml = indexHtml.replace('<link rel="stylesheet" href="./style.css">', `<style>${styleCss}</style>`);

    // Insert JS into HTML
    const scriptTagPos = indexHtml.lastIndexOf('</script>');
    indexHtml = `${indexHtml.slice(0, scriptTagPos)}</script><script>${scriptJs}</script>${indexHtml.slice(scriptTagPos + 9)}`;
    indexHtml = indexHtml.replace(/<!--[\s\S]*?-->/g, '');
    
    const yamlTemplate = {
        version: 'v1',
        metadata: {
            name: name,
            description: description,
            author: 'Unknown',
            source: source
        },
        parameters: [
            {
                id: 'color',
                default: '#000000'
            }
        ],
        helpers: {
            insert_baseurl: true
        },
        template: indexHtml
    };

    fs.writeFileSync(path.join(outputPackageDir, 'package.yaml'), YAML.stringify(yamlTemplate), 'utf-8');
});










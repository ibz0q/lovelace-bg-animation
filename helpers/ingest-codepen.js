// Takes exported CodePen projects and converts them to a package.yaml file
// Not perfect and some small manual adjustments may be needed. Lines 35-52 were generated with ChatGPT.

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const cheerio = require('cheerio');
const prettier = require('prettier');

process.chdir(__dirname);

const inputDir = './import';
const outputDir = './output';
let i = 73;

(async () => {
    const packages = fs.readdirSync(inputDir);
    for (const package of packages) {

        console.log("Started: " + package)

        const packageDir = path.join(inputDir, package, 'dist');
        const outputPackageDir = path.join(outputDir, `${i}.` + package);
        fs.mkdirSync(outputPackageDir, { recursive: true });
        i++;

        let indexHtml = fs.readFileSync(path.join(packageDir, 'index.html'), 'utf-8');

        const $ = cheerio.load(indexHtml);

        $('body').contents().each(function () {
            if (this.type === 'comment') {
                $(this).remove();
            }
        });

        $('link[href], script[src]').each((index, element) => {
            const tagName = element.tagName.toLowerCase();
            const filePath = $(element).attr('href') || $(element).attr('src');

            if (filePath && filePath.startsWith('./')) {
                const absoluteFilePath = path.join(packageDir, filePath);
                if (fs.existsSync(absoluteFilePath)) {
                    const fileContent = fs.readFileSync(absoluteFilePath, 'utf-8');
                    if (tagName === 'link') {
                        $(element).replaceWith(`<style>${fileContent}</style>`);
                    } else if (tagName === 'script') {
                        $(element).replaceWith(`<script>${fileContent}</script>`);
                    }
                }
            }
        });

        indexHtml = $.html();

        indexHtml = await prettier.format(indexHtml, {
            parser: 'html',
            htmlWhitespaceSensitivity: 'ignore'
        });

        const readmeMd = fs.readFileSync(path.join(inputDir, package, 'README.md'), 'utf-8');

        const name = readmeMd.match(/# (.*?)\n/)[1];
        const description = readmeMd.match(/\n(.*?)\n/)[1];
        const source = readmeMd.match(/\[(.*?)\]\((.*?)\)/)[2];
        const codepenId = source.split('/').pop();

        console.log(indexHtml)

        let data = await fetch("https://codepen.io/graphql", {
            "headers": {
                
    "accept": "*/*",
    "accept-language": "en-GB,en;q=0.6",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Brave\";v=\"134\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "Referer": "https://codepen.io/shauchenka/pen/OJzxgoJ",
    "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "[{\"operationName\":\"ItemTitleQuery\",\"variables\":{\"id\":\"" + codepenId + "\",\"itemType\":\"Pen\"},\"query\":\"query ItemTitleQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    itemType\\n    title\\n    owner {\\n      id\\n      title\\n      sessionUser {\\n        id\\n        followsOwner\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  sessionUser {\\n    id\\n    currentContext {\\n      id\\n      title\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"},{\"operationName\":\"ShareDropdownQuery\",\"variables\":{\"id\":\"" + codepenId + "\",\"itemType\":\"Pen\"},\"query\":\"query ShareDropdownQuery($id: ID!, $itemType: ItemEnum!, $token: ID) {\\n  item(id: $id, itemType: $itemType, token: $token) {\\n    id\\n    ... on Pen {\\n      cpid\\n      __typename\\n    }\\n    token\\n    title\\n    private\\n    description {\\n      source {\\n        body\\n        __typename\\n      }\\n      __typename\\n    }\\n    url\\n    sessionUser {\\n      id\\n      ownsItem\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]", "method": "POST"
        }).then(data => {
            return data.text()
        })
            .catch(error => console.error('Error:', error));

        let responseObj = JSON.parse(data);

        const title = responseObj[0].data.item.title;
        const descriptionPen = responseObj[1].data.item.description.source.body;
        const author = responseObj[0].data.item.owner.title;

        console.log(title)
        console.log(author)

        const yamlTemplate = {
            version: 'v1',
            metadata: {
                name: name,
                description: descriptionPen,
                author: author,
                source: source
            },
            helpers: {
                insert_baseurl: true
            },
            template: indexHtml
        };

        fs.writeFileSync(path.join(outputPackageDir, 'package.yaml'), YAML.stringify(yamlTemplate), 'utf-8');
        console.log("Wrote package.yaml")

    }

})();

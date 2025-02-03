
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

process.chdir(__dirname);

const inputDir = './import';
const outputDir = './output';
let i = 56;

(async () => {
    const packages = fs.readdirSync(inputDir);
    for (const package of packages) {

        console.log("Started: " + package)

        const packageDir = path.join(inputDir, package, 'dist');
        const outputPackageDir = path.join(outputDir, `${i}.`+package);
        fs.mkdirSync(outputPackageDir, { recursive: true });
        i++;

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
        const codepenId = source.split('/').pop();

        indexHtml = indexHtml.replace('<link rel="stylesheet" href="./style.css">', `<style>${styleCss}</style>`);

        const scriptTagPos = indexHtml.lastIndexOf('</script>');
        indexHtml = `${indexHtml.slice(0, scriptTagPos)}</script><script>${scriptJs}</script>${indexHtml.slice(scriptTagPos + 9)}`;
        indexHtml = indexHtml.replace(/<!--[\s\S]*?-->/g, '');
        const regex = /<(link|script)\s*.*?(href|src)=['"](.*?)['"].*?>/gs;

        let promises = [];
        let externalReplaced = false
        let match;
        let matches = [];
        while ((match = regex.exec(indexHtml)) !== null) {
            matches.push(match);
        }
        for (let match of matches) {
            let tag = match[1];
            let url = match[3];

            if (url.startsWith('//')) {
                url = 'https:' + url;
            }

            if (url.startsWith('http://') || url.startsWith('https://')) {
                console.log(`Found ${tag} tag with URL: ${url}`);
                console.log(match[0]);

                await fetch(url)
                    .then(response => response.text())
                    .then(content => {
                        let escapedMatch = match[0].replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
                        if (tag === 'link') {
                            console.log("Found an external CSS file")
                            indexHtml = indexHtml.replace(new RegExp(escapedMatch, 'g'), `<style>\n${content}\n</style>`);
                        } else {
                            // Replace <script> tag with inline script
                            console.log("Found an external JS file")
                            indexHtml = indexHtml.replace(new RegExp(escapedMatch, 'g'), `<script>\n${content}\n</script>`);
                        }
                    });
            }
        }

        // console.log(indexHtml)
        let data = await fetch("https://codepen.io/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB,en;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Brave\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-csrf-token": "+5Cbz3mb2abNliO9EpNaa9repNyFVtwsglJ6kjI4KEOCAYJaqtsTDbIjNc7cQIeaop3KwN4XAXHsoRMs36swDg==",
                "x-requested-with": "XMLHttpRequest",
                "cookie": "__editor_layout=top; cf_clearance=MiwV9IImMMgJPAhWlV9oDu6.Ji8JYf6bkZxO46C9bsg-1712950021-1.0.1.1-9bNSzwm_0GsLJvMtIaF7CG5hWTBlDJkLExt9Ycgp71i0DqelfkMZ4d2An3INckK4NthCdiyT7hbElwAYYzEbQQ; codepen_signup_referrer=https://search.brave.com/; codepen_signup_referrer_date=2024-04-12T20:29:53.782Z; __cf_bm=ZeFpAv6bLibU9gZghk5fuJfmCbozhdx0bH.fELUjNp0-1713096712-1.0.1.1-wHT4iMDSULwihdlKHnXc1iigtwzq3ciieO20gU9AIVVingpa25E0URA7EOuEpsc3GVk24daNChd2m5nouY48nQ; cp_session=tHtmQNbD%2F4qFhvaf--9QCETZtpDrYmxtEqc64uoamUQndA972YEAuNbWEbRoBIr2AOO4l%2BtNxAQOxrOBnPrjob4wvxjZ4%2BxHzIsC416uMvc%2BNaNzb2lbhZRqK1wY%2F%2BRa28GPwBpcn72q1Gp%2BXy8JteYGxd0FaLRoo%2Bv5QwX%2B1p38TW7vPiEYd39uV0Wz36sXqXtJJZHLJdNX8O11y5MqoL6d%2BFeCfRiQ%3D%3D--TxFAekshwjzhLsvbNHVuhw%3D%3D",
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
        console.log("Wrote package.yaml")
 
    }

})();

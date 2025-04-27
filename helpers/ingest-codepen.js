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
    "x-csrf-token": "cDpEoOvZVPU-vMX50ItuMWeznRVbGn8quBwvYa76raHtCjgm_k_pMiG4vCrc8R5TTOgNNExNlwpCYWAZGDBO9A",
    "x-requested-with": "XMLHttpRequest",
    "cookie": "__cf_bm=ta08GeV3ua8iW_wqsOwLtR.QJGp6zNRi5qhYzyGWooY-1741564236-1.0.1.1-kuZsIBO02TczbqiYotzwDRV2XNw1ef8PGoHXhtx33dzpmyTDLDu_9USo09D26ooFWcTZ5A5mu6VXq6gWaa4P8oJL6MDV1d2fMvYSrHf.xYo; __cfruid=971a45309d4c54eb7e482dde999345c63e88918b-1741564236; __editor_layout=top; cf_clearance=Alr4RjPosRfJ2LH.6jvaXjyiHvOqfVcAtRNWbG7GhLo-1741564237-1.2.1.1-_tJB73LPl2qUsxlj7qmo3DpwySNxDXMLuQBTdKCaaUob1zUdfvBx4IDOxkid_JE2JcaBz0uTqN8AV0wn6Wiv_o.B.nTa2YSiXxMmIzvEui.u0VVm9TQ_M7p4jzAMN9UzCEuFJ4YU1Ii6IgFjD7TW.Od_eiRyo7PMw5Joj8VErrUOJ_DsJUN5S6nBBPgrs6KVRffKMrpoAjqN2fVlYd93w88MJBMvUGwCe7LrNO0wAvOyIWkGgQWBtu1cwD9g0qVPN6N9Lb1dY2qeRPgMto2Xzd2T2fbn08n35hu_QJdreEVT47uDQVXJeyZd5BA_27_06ABqA0eozNDP4OC20d6RkGOOIjK2mRcxPVnTLaVU9Yul7rd5d2vZwBB17FeWOFzFV0m92HFS4MNC_DkYVptSaDUrOQPI1DG9SmLka8UvHwU; cp_session=gf2HKCTebSUe%2Bapx--WYsn9ADF%2BCtWgAQgbNu%2BEdHDFeAeTf0tnRTezcsCOKpGdZBjgsjBicIf9lPHWrZB7tF2lHIO4XCKWcpxlQIEoKFwJwXlPn0MxRy%2FjdqhpW9U3BLBeCdNL8uWUCkcx8EIn6PwAPcgDUvcuzQlkiYeDLxHLIUV7zoM9dmph03BJ2%2B0YQbZUrmjxsEULhmVyjSa07GKF9Opti78--9cgvOvdtaayaVfERPzLTQA%3D%3D",
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

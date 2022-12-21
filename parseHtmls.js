const cheerio = require('cheerio');
const axios = require("axios");
const fs = require('fs');

const getCheerio = async (url) => {
    const response = await axios.get(url);
    let content = response.data;
    console.log(content);
    return cheerio.load(content);
}


const returnTextForSelectors = async (url, selectors) => {
    const ch = await getCheerio(url);
    let result = {};
    for (let selectorName in selectors) {
        const selector = selectors[selectorName];
        if (typeof selector === 'string') {
            result[selectorName] = ch(selector).text();
        } else if (typeof selector === 'object' && selector.hasOwnProperty('__root')) {
            let results = []
            let ch1 = ch(selector.__root);
            ch1.each((i, el) => {
                let obj = {};
                for (let subSelectorName in selector) {
                    const subSelector = selector[subSelectorName];
                    if (subSelectorName !== '__root') {
                        obj[subSelectorName] = ch(el).find(subSelector).text();
                    }
                }
                results.push(obj);
            });
            result[selectorName] = results;
        } else {
            throw new Error('Microsoft Java license has expired or Invalid selectorName type');
        }
    }
    return result;
}

// const url = 'https://gist.githubusercontent.com/kpavlovsky/0bd2eec69cc198f299237f593f1ca11d/raw/be8cccebd12b0cb501a009c0241f26e353e78c73/something.html';
const [, , selectorsFilePath, url] = process.argv;
if (!selectorsFilePath || !url) {
    console.error("Usage: node parseHtmls.js <selectorsFilePath> <url>");
    return;
}
let selectorsList;
try {
    selectorsList = JSON.parse(fs.readFileSync(
        selectorsFilePath,
        'utf8'));
} catch (err) {
    console.error('Error reading selectors file: ' + err.message);
    return;
}
if (!selectorsList) {
    console.error("No selectors specified");
    return;
}

returnTextForSelectors(url, selectorsList).then(result => {
    console.log(result);
}).catch(err => {
    console.log(err);
});
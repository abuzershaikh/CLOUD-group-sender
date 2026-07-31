const fs = require('fs');
const appJsPath = '/opt/waziper-engine/app.js';
let appJs = fs.readFileSync(appJsPath, 'utf8');

const targetStr = "`${decoded.id || decoded.wid || entry.linkedNumber || ''}`";
const replaceStr = "`${(decoded.creds?.me || decoded.me || decoded).id || (decoded.creds?.me || decoded.me || decoded).wid || (decoded.creds?.me || decoded.me || decoded).user || entry.linkedNumber || ''}`";

const targetNameStr = "`${decoded.name || entry.linkedName || ''}`";
const replaceNameStr = "`${(decoded.creds?.me || decoded.me || decoded).name || entry.linkedName || ''}`";

if (appJs.includes(targetStr)) {
    appJs = appJs.replace(targetStr, replaceStr);
    appJs = appJs.replace(targetNameStr, replaceNameStr);
    fs.writeFileSync(appJsPath, appJs);
    console.log('Successfully patched app.js');
} else {
    console.log('Patch not applied, target block not found.');
}
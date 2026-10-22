// Run before every deploy: node stamp.js
// Sets VERSION in sw.js to a hash of every shell file, so any change to them makes installed apps update.
const fs = require('fs'), crypto = require('crypto');
let sw = fs.readFileSync('sw.js', 'utf8');
const shell = JSON.parse(sw.match(/const SHELL = (\[.*?\]);/)[1].replace(/'/g, '"')).filter(f => f !== './');
const h = crypto.createHash('sha1');
for (const f of shell) h.update(f).update(fs.readFileSync(f));
const v = 'cadence-' + h.digest('hex').slice(0, 8);
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${v}';`);
fs.writeFileSync('sw.js', sw);
console.log(v);
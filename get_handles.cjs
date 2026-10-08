const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilesStockPage.tsx', 'utf8');

const sIdx = code.indexOf('const handleSingleSell = async');
const mIdx = code.indexOf('const handleMultiSell = async');
const scanIdx = code.indexOf('const handleScan =');

console.log(code.substring(sIdx, mIdx));
console.log('--- MULTI ---');
console.log(code.substring(mIdx, scanIdx));

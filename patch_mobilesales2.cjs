const fs = require('fs');
const file = 'src/pages/MobileSalesPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { formatDateSafe } from '../utils/dateUtils';",
  "import { parseDateSafe, formatDateSafe } from '../utils/dateUtils';"
);

const toReplace = `    let saleDate = new Date();
    if (s.date && typeof s.date.toDate === 'function') {
      saleDate = s.date.toDate();
    } else if (s.createdAt && typeof s.createdAt.toDate === 'function') {
      saleDate = s.createdAt.toDate();
    } else if (s.date) {
      saleDate = new Date(s.date);
    }`;

code = code.replace(toReplace, `    let saleDate = parseDateSafe(s.date || s.createdAt) || new Date();`);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/pages/BillsHistoryPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { formatDateSafe } from '../utils/dateUtils';",
  "import { parseDateSafe, formatDateSafe } from '../utils/dateUtils';"
);

const toReplace = `    let billDate = new Date();
    if (b.date && typeof b.date.toDate === 'function') {
      billDate = b.date.toDate();
    } else if (b.createdAt && typeof b.createdAt.toDate === 'function') {
      billDate = b.createdAt.toDate();
    } else if (b.date) {
      billDate = new Date(b.date);
    }`;

code = code.replace(toReplace, `    let billDate = parseDateSafe(b.date || b.createdAt) || new Date();`);

fs.writeFileSync(file, code);

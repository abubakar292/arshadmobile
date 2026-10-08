const fs = require('fs');
const file = 'src/pages/PurchaseMobilePage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { format } from 'date-fns';",
  "import { format } from 'date-fns';\nimport { parseDateSafe, formatDateSafe } from '../utils/dateUtils';"
);

code = code.replace(
  "purchaseDate: mobile.purchaseDate ? format(mobile.purchaseDate.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),",
  "purchaseDate: formatDateSafe(mobile.purchaseDate || new Date(), 'yyyy-MM-dd'),"
);

code = code.replace(
  "{m.purchaseDate ? format(m.purchaseDate.toDate(), 'dd MMM yyyy') : '-'}",
  "{formatDateSafe(m.purchaseDate, 'dd MMM yyyy')}"
);

fs.writeFileSync(file, code);

const fs = require('fs');
const file = 'src/pages/CustomerLedgerPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { format } from 'date-fns';",
  "import { format } from 'date-fns';\nimport { parseDateSafe } from '../utils/dateUtils';"
);

code = code.replace(
  "date: data.date?.toDate?.() || new Date(data.date)",
  "date: parseDateSafe(data.date) || new Date()"
);

code = code.replace(
  "createdAt: data.createdAt?.toDate?.() || new Date()",
  "createdAt: parseDateSafe(data.createdAt) || new Date()"
);

fs.writeFileSync(file, code);

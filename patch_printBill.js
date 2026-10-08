const fs = require('fs');
const file = 'src/utils/printBill.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { format } from 'date-fns';",
  "import { format } from 'date-fns';\nimport { formatDateSafe } from './dateUtils';"
);

code = code.replace(
  "${billData.date ? format(billData.date?.toDate?.() || new Date(billData.date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}",
  "${formatDateSafe(billData.date || new Date(), 'dd/MM/yyyy')}"
);

code = code.replace(
  "${billData.date ? format(billData.date?.toDate?.() || new Date(billData.date), 'hh:mm a') : format(new Date(), 'hh:mm a')}",
  "${formatDateSafe(billData.date || new Date(), 'hh:mm a')}"
);

fs.writeFileSync(file, code);

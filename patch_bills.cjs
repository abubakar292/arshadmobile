const fs = require('fs');
const file = 'src/pages/BillsHistoryPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay, isWithinInterval } from 'date-fns';",
  "import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay, isWithinInterval } from 'date-fns';\nimport { formatDateSafe } from '../utils/dateUtils';"
);

code = code.replace(
  /{b\.date && typeof b\.date\.toDate === 'function' \? format\(b\.date\.toDate\(\), 'dd MMM yyyy, hh:mm a'\) \n                       : b\.createdAt && typeof b\.createdAt\.toDate === 'function' \? format\(b\.createdAt\.toDate\(\), 'dd MMM yyyy, hh:mm a'\) \n                       : b\.date \? format\(new Date\(b\.date\), 'dd MMM yyyy, hh:mm a'\) : '-'}/g,
  "{formatDateSafe(b.date || b.createdAt, 'dd MMM yyyy, hh:mm a')}"
);

fs.writeFileSync(file, code);

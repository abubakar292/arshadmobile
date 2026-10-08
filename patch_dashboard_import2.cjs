const fs = require('fs');
const file = 'src/pages/DashboardPage.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { parseDateSafe }")) {
  code = code.replace(
    "import { format, subDays, startOfDay, endOfDay, isSameDay } from 'date-fns';",
    "import { format, subDays, startOfDay, endOfDay, isSameDay } from 'date-fns';\nimport { parseDateSafe } from '../utils/dateUtils';"
  );
  fs.writeFileSync(file, code);
}

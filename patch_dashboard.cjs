const fs = require('fs');
const file = 'src/pages/DashboardPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { format, subDays } from 'date-fns';",
  "import { format, subDays } from 'date-fns';\nimport { parseDateSafe } from '../utils/dateUtils';"
);

code = code.replace(
  /data\.createdAt\?\.toDate\?\.\(\) \|\| new Date\(\)/g,
  "parseDateSafe(data.createdAt) || new Date()"
);
code = code.replace(
  /d\.createdAt\?\.toDate\?\.\(\) \|\| new Date\(\)/g,
  "parseDateSafe(d.createdAt) || new Date()"
);

fs.writeFileSync(file, code);

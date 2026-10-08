const fs = require('fs');
let code = fs.readFileSync('src/pages/MobileSalesPage.tsx', 'utf8');

const badgeReplacement = `const PaymentBadge = ({ method }: { method: string }) => {
  const config: Record<string, any> = {
    'Cash': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '💵 Cash' },
    'Bank Transfer': { bg: 'bg-blue-100', text: 'text-blue-700', label: '🏦 Bank' },
    'Udhar': { bg: 'bg-amber-100', text: 'text-amber-700', label: '📋 Udhar' },
  };
  const current = config[method] || { bg: 'bg-gray-100', text: 'text-gray-600', label: method };

  return (
    <span className={\`px-2.5 py-1 rounded-full text-xs font-medium \${current.bg} \${current.text}\`}>
      {current.label}
    </span>
  );
};`;

code = code.replace(/const PaymentBadge = \(\{ method \}: \{ method: string \}\) => \{[\s\S]*?return \([\s\S]*?<\/span>\);\n\};/m, badgeReplacement);

fs.writeFileSync('src/pages/MobileSalesPage.tsx', code);

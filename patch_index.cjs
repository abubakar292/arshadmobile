const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const headEnd = code.indexOf('</head>');

const newHead = `<head>
  <meta charset="UTF-8" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  
  <!-- App Meta -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#1B4332" />
  <meta name="description" content="Zamzam Mobile Center — Shop Management" />
  
  <title>Zamzam Mobile Center</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
`;

code = code.replace(/<head>[\s\S]*?<\/head>/m, newHead + '</head>');
fs.writeFileSync('index.html', code);

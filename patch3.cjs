const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-briefings/show.tsx', 'utf8');

// Rename 'Kick Off Meeting' to 'Notulen'
content = content.replace(/Kick Off Meeting/g, 'Notulen');

// Also remove the Permasalahan & Solusi tab from navigation
content = content.replace(
    /<button \n\s*onClick=\{\(\) => setActiveTab\('issues'\)\}[\s\S]*?Permasalahan & Solusi\n\s*<\/button>/,
    ''
);

// We should set the default active tab to 'temuan' if we are dropping the issues completely or just 'temuan' initially.
content = content.replace(/useState\('header'\)/, "useState('temuan')");

fs.writeFileSync('resources/js/pages/daily-briefings/show.tsx', content);
console.log('Patched UI Daily Briefing');

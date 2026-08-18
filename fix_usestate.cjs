const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

// The line is: const [activeTab, setActiveTab] = useState<'hadir' | 'kickoff' | 'issues'>|useState<'hadir' | 'kickoff' | 'issues'>('hadir');
// Or maybe powershell replaced it to something else? Let's just find "useState<'hadir'" up to "('hadir');"
content = content.replace(/useState<'hadir'[^>]+>[^;]+;/g, "useState<'hadir' | 'kickoff' | 'issues'>('hadir');");

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Fixed useState syntax error');

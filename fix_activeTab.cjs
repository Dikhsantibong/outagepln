const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

content = content.replace(
    "const [activeTab, setActiveTab] = useState<'hadir' | 'kickoff' | 'issues'>('hadir');",
    "const [activeTab, setActiveTab] = useState<'hadir' | 'kickoff' | 'issues' | 'dokumentasi'>('hadir');"
);

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Fixed activeTab state type');

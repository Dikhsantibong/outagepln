const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

// Remove finding form methods
content = content.replace(/const findingForm = useForm[\s\S]*?\/\/ --- Kick Off Meeting/g, '// --- Kick Off Meeting');

// Remove activeTab === 'temuan' block
content = content.replace(/\{activeTab === 'temuan' && \([\s\S]*?\{activeTab === 'issues' && \(/g, "{activeTab === 'issues' && (");

// Remove activeTab === 'temuan' block if it was followed by kickoff (fallback)
content = content.replace(/\{activeTab === 'temuan' && \([\s\S]*?\{activeTab === 'kickoff' && \(/g, "{activeTab === 'kickoff' && (");

// Remove Dialog Tambah / Edit Temuan
content = content.replace(/\{\/\* Dialog Tambah \/ Edit Temuan \*\/\}[\s\S]*?(?=\{\/\* Dialog Kick Off Foto)/, '');

// Remove findings props
content = content.replace(/findings \?= \[\],\n/g, '');
content = content.replace(/findings\?: any\[\];\n/g, '');

// Also remove emptyFinding
content = content.replace(/const emptyFinding = \{[\s\S]*?\};\n/g, '');

// And remove any mention of 'temuan' in activeTab definitions
content = content.replace(/'hadir' \| 'temuan' \| 'kickoff'/g, "'hadir' | 'kickoff'");

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Cleaned daily-meetings');

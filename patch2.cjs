const fs = require('fs');

const src = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');
const destFile = 'resources/js/pages/daily-briefings/show.tsx';
let dest = fs.readFileSync(destFile, 'utf8');

const temuanTabPattern = /\{activeTab === 'temuan' && \([\s\S]*?(?=\{activeTab === 'kickoff')/;
const temuanTabMatch = src.match(temuanTabPattern);

const kickoffTabPattern = /\{activeTab === 'kickoff' && \([\s\S]*?(?=\}\n\s*<\/div>\n\s*<\/div>)/;
const kickoffTabMatch = src.match(kickoffTabPattern);

const findingDialogPattern = /\{\/\* Dialog Tambah \/ Edit Temuan \*\/\}\s*<Dialog open=\{findingDialogOpen\}[\s\S]*?(?=\s*<\/Dialog>\s*<\/>\s*\);\s*\}\s*DailyMeetingShow)/;
const findingDialogMatch = src.match(findingDialogPattern);

if (!temuanTabMatch || !kickoffTabMatch || !findingDialogMatch) {
    console.error("Could not find blocks in source.");
    process.exit(1);
}

const injectionJSX = `
                    ${temuanTabMatch[0]}
                    ${kickoffTabMatch[0]}
`;

dest = dest.replace(
    /<\/div>\n\s*<\/div>\n\s*<Dialog open=\{issueModal\}/,
    `</div>\n                    ${injectionJSX}\n                </div>\n\n            <Dialog open={issueModal}`
);

const injectionDialog = `
            ${findingDialogMatch[0]}</Dialog>
`;

dest = dest.replace(
    /<\/Dialog>\n\s*<\/>/,
    `</Dialog>\n${injectionDialog}\n        </>`
);

dest = dest.replace(/meeting\./g, 'briefing.');
dest = dest.replace(/daily-meetings/g, 'daily-briefings');

fs.writeFileSync(destFile, dest);
console.log("Patched successfully!");

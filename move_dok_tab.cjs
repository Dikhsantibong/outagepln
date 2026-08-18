const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

// Update tabs array
const oldTabs = `        ...(isKickoffMeeting
            ? [{ key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }]
            : [{ key: 'issues' as const, label: 'Notulen', icon: ClipboardList, count: issues.length }]),`;
const newTabs = `        ...(isKickoffMeeting
            ? [{ key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }]
            : [
                { key: 'issues' as const, label: 'Notulen', icon: ClipboardList, count: issues.length },
                { key: 'dokumentasi' as const, label: 'Dokumentasi', icon: Images }
              ]),`;
content = content.replace(oldTabs, newTabs);

const idx1 = content.indexOf('{/* DOKUMENTASI UNTUK NOTULEN BIASA */}');
if (idx1 > -1) {
    const idx2 = content.indexOf('{activeTab === \'kickoff\' && (', idx1);
    if (idx2 > -1) {
        // Find the ')}' before kickoff
        let endIdx = content.lastIndexOf(')}', idx2);
        
        let beforeContent = content.substring(0, idx1);
        let docCard = content.substring(idx1, endIdx);
        let afterContent = content.substring(endIdx);
        
        // Remove the outer div closure if it belongs to issues
        // Actually, docCard contains the Card and the closing </div> of issues tab.
        // Let's just do it simpler:
        // docCard ends with:
        // </Card>
        // </div>
        const replaceRegex = /(<\/Card>\s*)(<\/div>\s*)$/;
        let match = docCard.match(replaceRegex);
        if (match) {
            docCard = docCard.replace(replaceRegex, '$1');
            docCard = docCard.replace('className="mt-4"', '');
            
            content = beforeContent + match[2] + ")}\n\n{activeTab === 'dokumentasi' && (\n<div className=\"space-y-4\">\n" + docCard + "</div>\n" + afterContent;
            
            fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
            console.log('Successfully moved Dokumentasi tab');
        } else {
            console.log('Could not find end of doc card');
        }
    }
}

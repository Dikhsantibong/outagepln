const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

const oldTabs = `    const tabs = [
        { key: 'hadir' as const, label: 'Daftar Hadir', icon: Users, count: attendees.length },
        ...(isKickoffMeeting
            ? [{ key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }]
            : [{ key: 'issues' as const, label: 'Notulen', icon: ClipboardList, count: issues.length }]),
    ];`;
const newTabs = `    const tabs = [
        { key: 'hadir' as const, label: 'Daftar Hadir', icon: Users, count: attendees.length },
        ...(isKickoffMeeting
            ? [{ key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }]
            : [
                { key: 'issues' as const, label: 'Notulen', icon: ClipboardList, count: issues.length },
                { key: 'dokumentasi' as const, label: 'Dokumentasi', icon: Images }
              ]),
    ];`;

if (content.includes(oldTabs)) {
    content = content.replace(oldTabs, newTabs);
    fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
    console.log('Fixed tabs array');
} else {
    console.log('Could not find oldTabs');
}

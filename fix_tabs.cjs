const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

// 1. Add issues to props
content = content.replace(
    'attendees: initialAttendees,',
    'attendees: initialAttendees,\n    issues: initialIssues = [],'
);

content = content.replace(
    'attendees: Attendee[];',
    'attendees: Attendee[];\n    issues?: any[];'
);

// 2. Add useState for issues
content = content.replace(
    'const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);',
    'const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);\n    const [issues, setIssues] = useState<any[]>(initialIssues);'
);

// 3. Fix tabs array
const oldTabs = `    const tabs = [
        { key: 'hadir' as const, label: 'Daftar Hadir', icon: Users, count: attendees.length },
        { key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake },
        ...(!isKickoffMeeting
            ? [{ key: 'temuan' as const, label: 'Notulen Temuan', icon: ClipboardList, count: findings.length }]
            : []),
    ];`;

const newTabs = `    const tabs = [
        { key: 'hadir' as const, label: 'Daftar Hadir', icon: Users, count: attendees.length },
        ...(isKickoffMeeting
            ? [{ key: 'kickoff' as const, label: 'Notulen Kick Off Meeting', icon: Handshake }]
            : [{ key: 'issues' as const, label: 'Notulen', icon: ClipboardList, count: issues.length }]),
    ];`;

content = content.replace(oldTabs, newTabs);

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Fixed props and tabs');

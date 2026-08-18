const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

const oldButtonsRegex = /<Button\s+variant=\"outline\"\s+size=\"sm\"\s+className=\"gap-2 h-9\"\s+onClick=\{\(\) => window\.open\(\`\/daily-meetings\/\$\{meeting\.id\}\/qr\`,\s*'_blank'\)\}[\s\S]*?<\/Button>\s*<Button\s+variant=\"outline\"\s+size=\"sm\"\s+className=\"gap-2 h-9\"\s+onClick=\{\(\) => \{[\s\S]*?<\/Button>/;

const buttonsMatch = content.match(oldButtonsRegex);
if (!buttonsMatch) {
    console.log('Could not find buttons');
    process.exit(1);
}

const buttonsHtml = buttonsMatch[0];
content = content.replace(oldButtonsRegex, '');

const tabHeaderRegex = /(<CardHeader className=\"flex flex-row items-center justify-between space-y-0 pb-4\">[\s\S]*?)({\['active', 'berlangsung'\]\.includes\(meeting\.status\) && \([\s\S]*?Auto-refresh 5s\s*<\/div>\s*\)}\s*)(<\/CardHeader>)/;

const match2 = content.match(tabHeaderRegex);
if (!match2) {
    console.log('Could not find tab header');
    process.exit(1);
}

const newButtonsHtml = `
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                    ${match2[2]}
                                    {!isTamu && (
                                        <>
                                            <Input 
                                                readOnly 
                                                value={\`\${window.location.origin}/attend/\${meeting.token}\`} 
                                                className="w-[250px] bg-muted hidden xl:flex" 
                                            />
                                            <Button variant="outline" size="sm" onClick={() => {
                                                const url = window.location.origin + '/attend/' + meeting.token;
                                                navigator.clipboard.writeText(url);
                                                alert('Link absensi berhasil disalin:\\n' + url);
                                            }}>
                                                <Copy className="h-4 w-4 mr-2" /> Copy Link
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => window.open(\`/daily-meetings/\${meeting.id}/qr\`, '_blank')}>
                                        <QrCode className="h-4 w-4 mr-2" /> Tampilan QR
                                    </Button>
                                </div>`;

content = content.replace(tabHeaderRegex, `$1${newButtonsHtml}\n                            $3`);
content = content.replace('className="flex flex-row items-center justify-between space-y-0 pb-4"', 'className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-4"');

// Need to import Copy if it's not imported
if (!content.includes('Copy,')) {
    content = content.replace(/import {([^}]+)} from 'lucide-react';/, 'import { $1, Copy } from \'lucide-react\';');
}

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Successfully moved buttons');

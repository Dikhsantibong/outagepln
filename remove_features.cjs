const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-briefings/show.tsx', 'utf8');

// 1. Remove Copy Link Button
const copyLinkBlock = `                                    {!isTamu && (
                                        <>
                                            <Input 
                                                readOnly 
                                                value={\`\${window.location.origin}/daily-briefings/attend/\${briefing.token}\`} 
                                                className="w-[250px] bg-muted hidden xl:flex" 
                                            />
                                            <Button variant="outline" onClick={() => {
                                                navigator.clipboard.writeText(\`\${window.location.origin}/daily-briefings/attend/\${briefing.token}\`);
                                                alert('Link disalin!');
                                            }}>
                                                <Copy className="h-4 w-4 mr-2" /> Copy Link
                                            </Button>
                                        </>
                                    )}`;
content = content.replace(copyLinkBlock, '');

// 2. Remove Dokumentasi Tab Button
const tabButton = `                        <button 
                            onClick={() => setActiveTab('dokumentasi')} 
                            className={\`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all \${activeTab === 'dokumentasi' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted-foreground/10'}\`}
                        >
                            <Plus className="h-4 w-4" /> Dokumentasi
                        </button>`;
content = content.replace(tabButton, '');

// 3. Remove Dokumentasi Tab Content
const tabContentRegex = /{activeTab === 'dokumentasi' && \([\s\S]*?<\/Card>\s*<\/div>\s*\)}/m;
content = content.replace(tabContentRegex, '');

// 4. Remove Dokumentasi Rapat in Kickoff
const kickoffDocRegex = /{\/\* Dokumentasi rapat - form terpisah agar upload tidak mengganggu form utama \*\/}[\s\S]*?(?=<\/CardContent>\s*<\/Card>)/m;
content = content.replace(kickoffDocRegex, '');

fs.writeFileSync('resources/js/pages/daily-briefings/show.tsx', content);
console.log('Removed features from daily-briefings/show.tsx');

const fs = require('fs');

let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

const replacement = `
                                  <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
                                          <a href={route('daily-meetings.issues.export-pdf', dailyMeeting.id)} target="_blank">
                                              <Printer className="h-3.5 w-3.5" /> Export PDF
                                          </a>
                                      </Button>
                                      <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
                                          <a href={route('daily-meetings.issues.export-excel', dailyMeeting.id)} target="_blank">
                                              <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
                                          </a>
                                      </Button>
                                      {!isTamu && (
                                          <Button onClick={() => openIssueForm()} size="sm" className="h-8 gap-1">
                                              <Plus className="h-3.5 w-3.5" /> Tambah
                                          </Button>
                                      )}
                                  </div>
`;

content = content.replace(
`                                  {!isTamu && (
                                      <Button onClick={() => openIssueForm()} size="sm" className="h-8 gap-1">
                                          <Plus className="h-3.5 w-3.5" /> Tambah
                                      </Button>
                                  )}`,
    replacement
);

fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
console.log('Added export buttons');

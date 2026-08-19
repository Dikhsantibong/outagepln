const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/index.tsx', 'utf8');

// Replace headers
const oldHeaders = `                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P1
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P2
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P3
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        R2
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        R3
                                    </TableHead>`;

const newHeaders = `                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        R2
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        R3
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P1
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P2
                                    </TableHead>
                                    <TableHead className="w-[120px] text-[10px] font-bold tracking-widest uppercase">
                                        P3
                                    </TableHead>`;

// Replace cells
const oldCells = `                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P1',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P2',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P3',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT R2',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT R3',
                                                    )}
                                                </TableCell>`;

const newCells = `                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT R2',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT R3',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P1',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P2',
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-1 align-top">
                                                    {renderMeetingCell(
                                                        plan,
                                                        'RAPAT P3',
                                                    )}
                                                </TableCell>`;

if (content.includes(oldHeaders) && content.includes(oldCells)) {
    content = content.replace(oldHeaders, newHeaders);
    content = content.replace(oldCells, newCells);
    fs.writeFileSync('resources/js/pages/daily-meetings/index.tsx', content);
    console.log('Successfully reordered columns');
} else {
    console.log('Failed to find exact matching blocks');
}

import sys

with open('resources/js/components/outage-detail.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'function TooltipDeviasi(' in line:
        start_idx = i
    if 'export function OutageDailyTable' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx]
    
    replacement = \"\"\"
/**
 * Ringkasan Leading & Lagging berupa 2 bar sederhana (berapa hari leading, berapa hari lagging)
 * beserta selisih persentase saat ini.
 */
export function OutageDeviasiChart({
    rows,
    height = 240,
}: {
    rows: DailyProgress[];
    height?: number;
}) {
    const sebaran = useMemo(() => hitungSebaranStatus(rows), [rows]);

    const lastTerisi = useMemo(
        () => [...rows].reverse().find((r) => r.plan_progress !== null && r.actual_progress !== null),
        [rows],
    );
    const plan = Number(lastTerisi?.plan_progress ?? 0);
    const actual = Number(lastTerisi?.actual_progress ?? 0);
    const deviasi = hitungDeviasi(plan, actual);

    const summaryData = useMemo(() => [
        { name: 'Leading', value: sebaran.leadingHari, fill: WARNA_STATUS.Leading },
        { name: 'Lagging', value: sebaran.laggingHari, fill: WARNA_STATUS.Lagging }
    ], [sebaran]);

    if (sebaran.hariTerisi === 0) {
        return (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground italic">
                Belum ada hari yang rencana dan realisasinya terisi.
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center" style={{ height }}>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={summaryData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={60} />
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [\\ Hari\, 'Jumlah']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {summaryData.map((entry, index) => (
                            <Cell key={\cell-\\} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            
            <div className="flex items-center justify-center mt-2">
                <span
                    className={\inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold uppercase \\}
                >
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: WARNA_STATUS[deviasi.status === 'Tepat' ? 'On Progres' : deviasi.status] }}
                    />
                    Selisih: {deviasi.status !== 'Tepat' ? formatSelisih(deviasi.selisih) : '0%'}
                </span>
            </div>
        </div>
    );
}

\"\"\"
    new_lines.append(replacement)
    new_lines.extend(lines[end_idx:])
    
    with open('resources/js/components/outage-detail.tsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print('Replacement successful.')
else:
    print('Error: Could not find start_idx or end_idx', start_idx, end_idx)

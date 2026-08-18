const fs = require('fs');
let content = fs.readFileSync('resources/js/pages/daily-meetings/show.tsx', 'utf8');

const targetStr = `                        </div>
                    )}

                    {activeTab === 'kickoff' && (`;

const dokumentasiBlock = `                        </div>
                    )}

                    {activeTab === 'dokumentasi' && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dokumentasi</CardTitle>
                                    <CardDescription>Foto-foto pelaksanaan atau permasalahan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!isTamu && (
                                        <form onSubmit={submitPhoto} className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                                <Label htmlFor="foto">Upload Foto</Label>
                                                <Input
                                                    id="foto"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => photoForm.setData('foto', e.target.files?.[0] || null)}
                                                />
                                            </div>
                                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                                <Label htmlFor="caption">Caption (Opsional)</Label>
                                                <Input
                                                    id="caption"
                                                    value={photoForm.data.caption}
                                                    onChange={(e) => photoForm.setData('caption', e.target.value)}
                                                    placeholder="Keterangan foto..."
                                                />
                                            </div>
                                            <Button type="submit" disabled={photoForm.processing || !photoForm.data.foto}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Tambah Foto
                                            </Button>
                                        </form>
                                    )}

                                    {kickoffPhotos.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {kickoffPhotos.map((p) => (
                                                <div key={p.id} className="group relative rounded-lg border overflow-hidden bg-card">
                                                    <img src={p.foto} alt={p.caption || 'Dokumentasi'} className="h-40 w-full object-cover" />
                                                    <div className="p-2 text-xs text-muted-foreground">{p.caption || '-'}</div>
                                                    {!isTamu && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                            onClick={() => deletePhoto(p)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/50">
                                            <Images className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                                            <p className="text-sm text-muted-foreground">Belum ada dokumentasi</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'kickoff' && (`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, dokumentasiBlock);
    fs.writeFileSync('resources/js/pages/daily-meetings/show.tsx', content);
    console.log('Successfully added Dokumentasi block');
} else {
    console.log('Could not find targetStr to insert Dokumentasi block');
}

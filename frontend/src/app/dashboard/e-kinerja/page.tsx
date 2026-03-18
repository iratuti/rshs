'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, FileCheck, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  type TemplateItem, type ShortcodeData,
  DEFAULT_EKINERJA_TEMPLATES, replaceShortcodes,
} from '@/lib/report-templates';

interface TindakanItem {
  nama_pasien: string;
  no_rm: string;
  jenis_pasien: string;
  [key: string]: unknown;
}

interface Logbook {
  tanggal_dinas: string;
  shift: string;
  jam_datang: string;
  jam_pulang: string;
  daftar_tindakan: TindakanItem[];
}

interface SubPoint {
  point: number;
  subIndex: number;
  totalSubs: number;
  category: string;
  text: string;
}

const SHIFT_TIMES: Record<string, { time1: string; time2: string; time3: string; label: string }> = {
  PAGI: { time1: '07:00', time2: '07:15', time3: '07:30', label: 'pagi' },
  SIANG: { time1: '14:00', time2: '14:15', time3: '14:30', label: 'siang' },
  MALAM: { time1: '21:00', time2: '21:15', time3: '21:30', label: 'malam' },
};

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

export default function EKinerjaPage() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState('per-nilai');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [logbookData, setLogbookData] = useState<Logbook | null>(null);
  const [generatedSubPoints, setGeneratedSubPoints] = useState<SubPoint[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPoint, setSelectedPoint] = useState('6');
  const [monthlyData, setMonthlyData] = useState<{ tanggal: string; deskripsi: string; jumlahKegiatan: number }[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_EKINERJA_TEMPLATES);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch user templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/report-templates');
        if (res.ok) {
          const data = await res.json();
          if (data.ekinerja_templates?.length) {
            setTemplates(data.ekinerja_templates);
          }
        }
      } catch { /* use defaults */ }
    };
    fetchTemplates();
  }, []);

  const formatPatientName = (t: TindakanItem) => `${t.nama_pasien} (${t.no_rm})`;

  const buildShortcodeData = useCallback((logbook: Logbook): ShortcodeData => {
    const allPatients = logbook.daftar_tindakan.map(formatPatientName);
    const pasienBaru = logbook.daftar_tindakan.filter(t => t.jenis_pasien === 'PASIEN_BARU').map(formatPatientName);
    const pasienPulang = logbook.daftar_tindakan.filter(t => t.jenis_pasien === 'PASIEN_PULANG').map(formatPatientName);
    const pasienLama = logbook.daftar_tindakan.filter(t => t.jenis_pasien !== 'PASIEN_BARU').map(formatPatientName);
    const shiftTimes = SHIFT_TIMES[logbook.shift] || SHIFT_TIMES.PAGI;

    return {
      namesAllPasien: allPatients.join(', '),
      namesPasienBaru: pasienBaru.join(', '),
      namesPasienPulang: pasienPulang.join(', '),
      namesPasienLama: pasienLama.join(', '),
      countAllPasien: allPatients.length,
      countPasienBaru: pasienBaru.length,
      countPasienPulang: pasienPulang.length,
      namaRuangan: user?.ruangan_rs || 'Ruang Melati',
      shift: shiftTimes.label,
      jamDatang: logbook.jam_datang,
      jamPulang: logbook.jam_pulang,
      shiftTime1: shiftTimes.time1,
      shiftTime2: shiftTimes.time2,
      shiftTime3: shiftTimes.time3,
      tindakanDetail: '',
    };
  }, [user]);

  const generateEKinerja = useCallback((logbook: Logbook): SubPoint[] => {
    if (!logbook?.daftar_tindakan?.length) return [];

    const data = buildShortcodeData(logbook);
    const subPoints: SubPoint[] = [];

    for (const tmpl of templates) {
      // Skip PASIEN_BARU templates if no new patients
      if (tmpl.category === 'PASIEN_BARU' && !data.namesPasienBaru) continue;
      // Skip PASIEN_PULANG templates if no discharged patients
      if (tmpl.category === 'PASIEN_PULANG' && !data.namesPasienPulang) continue;

      const text = replaceShortcodes(tmpl.template, data);
      const lines = text.split('\n').filter(l => l.trim());
      lines.forEach((line, idx) => {
        subPoints.push({
          point: tmpl.point,
          subIndex: idx + 1,
          totalSubs: lines.length,
          category: tmpl.category.replace('_', ' '),
          text: line.trim(),
        });
      });
    }

    subPoints.sort((a, b) => a.point !== b.point ? a.point - b.point : a.subIndex - b.subIndex);
    return subPoints;
  }, [templates, buildShortcodeData]);

  const fetchLogbookByDate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logbooks?month=${parseInt(selectedDate.split('-')[1])}&year=${parseInt(selectedDate.split('-')[0])}`);
      if (response.ok) {
        const logbooks: Logbook[] = await response.json();
        const logbook = logbooks.find(l => l.tanggal_dinas === selectedDate);
        if (logbook) {
          setLogbookData(logbook);
          const subPoints = generateEKinerja(logbook);
          setGeneratedSubPoints(subPoints);
          toast.success(`e-Kinerja berhasil di-generate (${subPoints.length} sub-poin)`);
        } else {
          setLogbookData(null);
          setGeneratedSubPoints([]);
          toast.info('Tidak ada data logbook untuk tanggal ini');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyLogbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logbooks?month=${selectedMonth}&year=${selectedYear}`);
      if (response.ok) {
        const logbooks: Logbook[] = await response.json();
        const pointNum = parseInt(selectedPoint);
        const processed = logbooks.map(logbook => {
          if (!logbook.daftar_tindakan?.length) return null;
          const data = buildShortcodeData(logbook);

          // Find templates matching the selected point
          const matchingTemplates = templates.filter(t => t.point === pointNum);
          if (!matchingTemplates.length) return null;

          const texts: string[] = [];
          for (const tmpl of matchingTemplates) {
            if (tmpl.category === 'PASIEN_BARU' && !data.namesPasienBaru) continue;
            if (tmpl.category === 'PASIEN_PULANG' && !data.namesPasienPulang) continue;
            texts.push(replaceShortcodes(tmpl.template, data));
          }

          if (!texts.length) return null;
          return {
            tanggal: logbook.tanggal_dinas,
            deskripsi: texts.join('\n'),
            jumlahKegiatan: logbook.daftar_tindakan.length,
          };
        }).filter((d): d is { tanggal: string; deskripsi: string; jumlahKegiatan: number } => d !== null);

        setMonthlyData(processed);
        if (processed.length === 0) toast.info('Tidak ada data untuk periode ini');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin`);
  };

  const copyAllSubPoints = () => {
    const fullText = generatedSubPoints.map(p => p.text).join('\n\n');
    copyToClipboard(fullText, 'Semua sub-poin');
  };

  const getSummary = () => {
    if (!logbookData) return null;
    const baru = logbookData.daftar_tindakan?.filter(t => t.jenis_pasien === 'PASIEN_BARU').length || 0;
    const pulang = logbookData.daftar_tindakan?.filter(t => t.jenis_pasien === 'PASIEN_PULANG').length || 0;
    const total = logbookData.daftar_tindakan?.length || 0;
    return { total, baru, pulang };
  };

  const summary = getSummary();
  const groupedByPoint = generatedSubPoints.reduce((acc, sp) => {
    if (!acc[sp.point]) acc[sp.point] = { category: sp.category, items: [] };
    acc[sp.point].items.push(sp);
    return acc;
  }, {} as Record<number, { category: string; items: SubPoint[] }>);

  // Unique point numbers from templates for the per-tanggal selector
  const uniquePoints = [...new Set(templates.map(t => t.point))].sort((a, b) => a - b);

  const getCategoryColor = (category: string) => {
    if (category.includes('BARU')) return 'text-emerald-600 bg-emerald-50';
    if (category.includes('PULANG')) return 'text-orange-600 bg-orange-50';
    if (category.includes('ABSENSI')) return 'text-purple-600 bg-purple-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">e-Kinerja</h1>
          <p className="text-slate-500 text-sm mt-0.5">Generate laporan e-Kinerja dari data logbook</p>
        </div>
        <Link href="/dashboard/settings" data-testid="link-kinerja-settings">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Settings className="w-3.5 h-3.5" />Atur Template
          </Button>
        </Link>
      </div>

      <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 md:h-12 bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="per-nilai" data-testid="tab-per-nilai" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Tampilan</span> Per Nilai
          </TabsTrigger>
          <TabsTrigger value="per-tanggal" data-testid="tab-per-tanggal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Tampilan</span> Per Tanggal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="per-nilai" className="mt-4 space-y-3 md:space-y-4">
          <Card className="border-0 shadow-card bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="date-picker" className="text-sm">Pilih Tanggal</Label>
                  <Input id="date-picker" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} data-testid="date-picker-kinerja" className="h-10 md:h-12" />
                </div>
                <Button onClick={fetchLogbookByDate} disabled={loading} data-testid="btn-generate-kinerja" className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700 px-6 md:px-8">
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {summary && (
            <Card className="border-0 shadow-card bg-gradient-to-br from-teal-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-slate-900 text-sm md:text-base">
                        {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs md:text-sm text-slate-600">
                        Shift {logbookData?.shift} | {summary.total} pasien
                        {summary.baru > 0 && ` (${summary.baru} baru)`}
                        {summary.pulang > 0 && ` (${summary.pulang} pulang)`}
                      </p>
                    </div>
                  </div>
                  {generatedSubPoints.length > 0 && (
                    <Button variant="outline" size="sm" onClick={copyAllSubPoints} data-testid="btn-copy-all-kinerja" className="rounded-full text-xs md:text-sm">
                      <Copy className="w-3.5 h-3.5 mr-1.5" />Salin Semua ({generatedSubPoints.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {generatedSubPoints.length > 0 ? (
            <Card className="border-0 shadow-card bg-white">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-base md:text-lg font-heading flex items-center gap-2">
                  <FileCheck className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />Hasil e-Kinerja ({generatedSubPoints.length} Sub-Poin)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] md:h-[600px]">
                  <div className="p-4 space-y-3">
                    {Object.entries(groupedByPoint).map(([pointNum, group]) => (
                      <div key={pointNum} className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-white py-2 z-10">
                          <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold ${getCategoryColor(group.category)}`}>{pointNum}</span>
                          <span className="text-xs text-slate-500 uppercase tracking-wide">{group.category}</span>
                        </div>
                        {group.items.map((subPoint, idx) => (
                          <div key={`${pointNum}-${idx}`} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{subPoint.text}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(subPoint.text, `Point ${pointNum}.${subPoint.subIndex}`)} data-testid={`btn-copy-${pointNum}-${idx}`} className="shrink-0 h-8 px-2 opacity-60 hover:opacity-100 transition-opacity">
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-card bg-slate-50">
              <CardContent className="p-8 md:p-12 text-center text-slate-400">
                <FileCheck className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm md:text-base">Pilih tanggal dan klik "Generate" untuk membuat laporan</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="per-tanggal" className="mt-4 space-y-3 md:space-y-4">
          <Card className="border-0 shadow-card bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Bulan</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger data-testid="select-month-kinerja" className="h-10 md:h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Tahun</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger data-testid="select-year-kinerja" className="h-10 md:h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Point</Label>
                  <Select value={selectedPoint} onValueChange={setSelectedPoint}>
                    <SelectTrigger data-testid="select-point-kinerja" className="h-10 md:h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {uniquePoints.map((p) => (
                        <SelectItem key={p} value={p.toString()}>Point {p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={fetchMonthlyLogbooks} disabled={loading} data-testid="btn-generate-tanggal-kinerja" className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700">
                  {loading ? <RefreshCw className="w-4 h-4 md:mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 md:mr-2" />}<span className="hidden md:inline">Generate</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card bg-white overflow-hidden">
            <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
              <CardTitle className="text-sm md:text-lg font-heading">
                Point {selectedPoint}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">{MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
            </CardHeader>
            <CardContent className="p-0">
              {monthlyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-28 md:w-36 text-xs md:text-sm">Tanggal</TableHead>
                        <TableHead className="text-xs md:text-sm">Deskripsi</TableHead>
                        <TableHead className="w-20 md:w-32 text-center text-xs md:text-sm">Jumlah</TableHead>
                        <TableHead className="w-12 md:w-20 text-xs md:text-sm">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-xs md:text-sm align-top">
                            {new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm text-slate-700">
                            <pre className="whitespace-pre-wrap font-sans">{row.deskripsi}</pre>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-teal-600 text-xs md:text-sm align-top">{row.jumlahKegiatan}</TableCell>
                          <TableCell className="align-top">
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(row.deskripsi)} data-testid={`btn-copy-row-${idx}`} className="h-7 w-7 md:h-8 md:w-8">
                              <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 md:p-12 text-center text-slate-400">
                  <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                  <p className="text-sm md:text-base">Pilih filter dan klik "Generate"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

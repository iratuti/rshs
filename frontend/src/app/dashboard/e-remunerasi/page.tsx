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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, ClipboardList, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  type TemplateItem, type ShortcodeData,
  DEFAULT_EREMUNERASI_TEMPLATES, replaceShortcodes,
} from '@/lib/report-templates';

interface TindakanItem {
  nama_pasien: string;
  no_rm: string;
  [key: string]: unknown;
}

interface Logbook {
  tanggal_dinas: string;
  shift: string;
  daftar_tindakan: TindakanItem[];
}

const TINDAKAN_ACTION_MAP: Record<string, string> = {
  oksigenasi: 'Memberikan tindakan Oksigenasi kepada pasien',
  perawatan_luka_sederhana: 'Melakukan perawatan luka sederhana kepada pasien',
  pre_pasca_op: 'Melakukan persiapan/perawatan pre/pasca OP kepada pasien',
  kompres_terbuka: 'Melakukan kompres terbuka kepada pasien',
  memasang_infus_baru: 'Memasang infus baru kepada pasien',
  memberikan_cairan_infus: 'Memberikan cairan infus kepada pasien',
  memasang_ngt: 'Memasang NGT kepada pasien',
  transfusi_darah: 'Melakukan transfusi darah kepada pasien',
  nebu: 'Memberikan terapi nebulizer kepada pasien',
  memasang_dc_kateter: 'Memasang DC/Kateter kepada pasien',
  koreksi_caglukonas: 'Melakukan koreksi CAGlukonas kepada pasien',
  koreksi_kcl: 'Melakukan koreksi KCL kepada pasien',
  uji_lab: 'Melakukan pengambilan sampel uji lab kepada pasien',
};

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

export default function ERemunerasiPage() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState('per-nilai');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [logbookData, setLogbookData] = useState<Logbook | null>(null);
  const [generatedPoints, setGeneratedPoints] = useState<{ point: number; title: string; generatedText: string; jumlahKegiatan: number; isMultiLine?: boolean }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPoint, setSelectedPoint] = useState('1');
  const [monthlyData, setMonthlyData] = useState<{ tanggal: string; deskripsi: string; jumlahKegiatan: number }[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_EREMUNERASI_TEMPLATES);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch user templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/report-templates');
        if (res.ok) {
          const data = await res.json();
          if (data.eremunerasi_templates?.length) {
            setTemplates(data.eremunerasi_templates);
          }
        }
      } catch { /* use defaults */ }
    };
    fetchTemplates();
  }, []);

  const formatPatientName = (t: TindakanItem) => `Tn/Ny. ${t.nama_pasien} (${t.no_rm})`;

  const generatePoint4Text = useCallback((daftarTindakan: TindakanItem[]) => {
    const actionGroups: Record<string, string[]> = {};
    daftarTindakan.forEach(tindakan => {
      const patientName = formatPatientName(tindakan);
      Object.keys(TINDAKAN_ACTION_MAP).forEach(actionKey => {
        if (tindakan[actionKey] === true) {
          if (!actionGroups[actionKey]) actionGroups[actionKey] = [];
          actionGroups[actionKey].push(patientName);
        }
      });
    });

    const actionLines: string[] = [];
    let lineNumber = 1;
    Object.keys(TINDAKAN_ACTION_MAP).forEach(actionKey => {
      if (actionGroups[actionKey] && actionGroups[actionKey].length > 0) {
        const patients = actionGroups[actionKey].join(', ');
        actionLines.push(`${lineNumber}. ${TINDAKAN_ACTION_MAP[actionKey]} ${patients}`);
        lineNumber++;
      }
    });

    if (actionLines.length === 0) {
      const allPatients = daftarTindakan.map(formatPatientName).join(', ');
      return `Melakukan tindakan keperawatan dasar kepada pasien ${allPatients}`;
    }
    return actionLines.join('\n');
  }, []);

  const buildShortcodeData = useCallback((logbook: Logbook): ShortcodeData => {
    const allPatients = logbook.daftar_tindakan.map(formatPatientName);
    const pasienBaru = logbook.daftar_tindakan.filter(t => t.jenis_pasien === 'PASIEN_BARU').map(formatPatientName);
    const pasienPulang = logbook.daftar_tindakan.filter(t => t.jenis_pasien === 'PASIEN_PULANG').map(formatPatientName);

    return {
      namesAllPasien: allPatients.join(', '),
      namesPasienBaru: pasienBaru.join(', '),
      namesPasienPulang: pasienPulang.join(', '),
      countAllPasien: allPatients.length,
      countPasienBaru: pasienBaru.length,
      countPasienPulang: pasienPulang.length,
      namaRuangan: user?.ruangan_rs || 'Ruang Melati',
      shift: logbook.shift?.toLowerCase() || '',
      jamDatang: '',
      jamPulang: '',
      shiftTime1: '',
      shiftTime2: '',
      shiftTime3: '',
      tindakanDetail: generatePoint4Text(logbook.daftar_tindakan),
    };
  }, [user, generatePoint4Text]);

  const generatePointsFromLogbook = useCallback((logbook: Logbook) => {
    if (!logbook?.daftar_tindakan?.length) return [];
    const data = buildShortcodeData(logbook);
    const patientCount = logbook.daftar_tindakan.length;

    return templates.map(tmpl => {
      const text = replaceShortcodes(tmpl.template, data);
      return {
        point: tmpl.point,
        title: tmpl.category,
        generatedText: text,
        jumlahKegiatan: patientCount,
        isMultiLine: text.includes('\n'),
      };
    });
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
          const points = generatePointsFromLogbook(logbook);
          setGeneratedPoints(points);
          toast.success(`e-Remunerasi berhasil di-generate (${points.length} poin)`);
        } else {
          setLogbookData(null);
          setGeneratedPoints([]);
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

          const matchingTemplate = templates.find(t => t.point === pointNum);
          if (!matchingTemplate) return null;

          const deskripsi = replaceShortcodes(matchingTemplate.template, data);
          return {
            tanggal: logbook.tanggal_dinas,
            deskripsi,
            jumlahKegiatan: logbook.daftar_tindakan.length,
          };
        }).filter((d): d is { tanggal: string; deskripsi: string; jumlahKegiatan: number } => d !== null);

        setMonthlyData(processed);
        if (processed.length === 0) toast.info('Tidak ada data');
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

  const copyAllPoints = () => {
    const fullText = generatedPoints.map(p => `Point ${p.point}: ${p.title}\n${p.generatedText}`).join('\n\n');
    copyToClipboard(fullText, 'Semua poin');
  };

  const uniquePoints = [...new Set(templates.map(t => t.point))].sort((a, b) => a - b);

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">e-Remunerasi</h1>
          <p className="text-slate-500 text-sm mt-0.5">Generate laporan e-Remunerasi dari data logbook</p>
        </div>
        <Link href="/dashboard/settings" data-testid="link-remun-settings">
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
                  <Input id="date-picker" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} data-testid="date-picker-nilai" className="h-10 md:h-12" />
                </div>
                <Button onClick={fetchLogbookByDate} disabled={loading} data-testid="btn-generate-nilai" className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700 px-6 md:px-8">
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {logbookData && (
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
                      <p className="text-xs md:text-sm text-slate-600">Shift {logbookData?.shift} | {logbookData?.daftar_tindakan?.length || 0} pasien</p>
                    </div>
                  </div>
                  {generatedPoints.length > 0 && (
                    <Button variant="outline" size="sm" onClick={copyAllPoints} data-testid="btn-copy-all-remun" className="rounded-full text-xs md:text-sm">
                      <Copy className="w-3.5 h-3.5 mr-1.5" />Salin Semua ({generatedPoints.length} Poin)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {generatedPoints.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {generatedPoints.map((point, idx) => (
                <Card key={idx} className="border-0 shadow-card bg-white">
                  <CardHeader className="pb-2 p-3 md:p-4 md:pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold bg-teal-100 text-teal-700">{point.point}</span>
                        <CardTitle className="text-xs md:text-sm font-heading leading-tight uppercase">{point.title}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(point.generatedText, `Point ${point.point}`)} data-testid={`btn-copy-point-${point.point}`} className="rounded-full text-xs h-8 shrink-0">
                        <Copy className="w-3.5 h-3.5 mr-1" />Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0 md:pt-0">
                    <Textarea value={point.generatedText} readOnly className={`text-xs md:text-sm bg-slate-50 resize-none ${point.isMultiLine ? 'min-h-[120px]' : 'min-h-[70px]'}`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-card bg-slate-50">
              <CardContent className="p-8 md:p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">Pilih tanggal dan klik "Generate"</p>
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
                    <SelectTrigger data-testid="select-month" className="h-10 md:h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Tahun</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger data-testid="select-year" className="h-10 md:h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Point</Label>
                  <Select value={selectedPoint} onValueChange={setSelectedPoint}>
                    <SelectTrigger data-testid="select-point" className="h-10 md:h-12 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {uniquePoints.map((p) => (
                        <SelectItem key={p} value={p.toString()}>Point {p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={fetchMonthlyLogbooks} disabled={loading} data-testid="btn-generate-tanggal" className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700">
                  {loading ? <RefreshCw className="w-4 h-4 md:mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 md:mr-2" />}<span className="hidden md:inline">Generate</span>
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

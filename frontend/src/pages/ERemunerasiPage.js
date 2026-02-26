import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, ClipboardList, FileText } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// e-Remunerasi Point Definitions
const EREMUNERASI_POINTS = [
  {
    point: 1,
    title: 'MELAKUKAN ASESMEN AWAL DAN LANJUTAN SERTA MEMBERIKAN EDUKASI',
    prefix: 'Melakukan asesmen awal dan lanjutan serta memberikan edukasi kepada pasien '
  },
  {
    point: 2,
    title: 'MELAKUKAN OBSERVASI DAN MONITORING PASIEN',
    prefix: 'Melakukan observasi dan monitoring kepada pasien '
  },
  {
    point: 3,
    title: 'MEMBERIKAN TINDAKAN KEPERAWATAN',
    prefix: 'Memberikan tindakan keperawatan kepada pasien '
  },
  {
    point: 4,
    title: 'MELAKUKAN DOKUMENTASI ASUHAN KEPERAWATAN',
    prefix: 'Melakukan dokumentasi asuhan keperawatan pasien '
  },
  {
    point: 5,
    title: 'MELAKUKAN KOLABORASI DENGAN TIM KESEHATAN LAIN',
    prefix: 'Melakukan kolaborasi dengan tim kesehatan lain untuk pasien '
  }
];

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const ERemunerasiPage = () => {
  const [activeMode, setActiveMode] = useState('per-nilai');
  const [loading, setLoading] = useState(false);
  
  // Mode 1: Per Nilai (By Date)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [logbookData, setLogbookData] = useState(null);
  const [generatedPoints, setGeneratedPoints] = useState([]);
  
  // Mode 2: Per Tanggal (By Point & Month)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPoint, setSelectedPoint] = useState('1');
  const [monthlyData, setMonthlyData] = useState([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Format patient name
  const formatPatientName = (tindakan) => {
    return `Tn/Ny. ${tindakan.nama_pasien} (${tindakan.no_rm})`;
  };

  // Generate e-Remunerasi points from logbook
  const generatePointsFromLogbook = useCallback((logbook) => {
    if (!logbook?.daftar_tindakan?.length) return [];

    const patientNames = logbook.daftar_tindakan.map(formatPatientName).join(', ');
    const patientCount = logbook.daftar_tindakan.length;

    return EREMUNERASI_POINTS.map(point => ({
      ...point,
      generatedText: point.prefix + patientNames,
      jumlahKegiatan: patientCount
    }));
  }, []);

  // Fetch logbook by date
  const fetchLogbookByDate = async (date) => {
    setLoading(true);
    try {
      // First try to get today's logbook
      const response = await fetch(`${API_URL}/api/logbooks?month=${parseInt(date.split('-')[1])}&year=${parseInt(date.split('-')[0])}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const logbooks = await response.json();
        const logbook = logbooks.find(l => l.tanggal_dinas === date);
        
        if (logbook) {
          setLogbookData(logbook);
          const points = generatePointsFromLogbook(logbook);
          setGeneratedPoints(points);
          toast.success(`Data berhasil di-generate untuk tanggal ${date}`);
        } else {
          setLogbookData(null);
          setGeneratedPoints([]);
          toast.info('Tidak ada data logbook untuk tanggal ini');
        }
      }
    } catch (error) {
      console.error('Error fetching logbook:', error);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly logbooks for Mode 2
  const fetchMonthlyLogbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/logbooks?month=${selectedMonth}&year=${selectedYear}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const logbooks = await response.json();
        const pointIndex = parseInt(selectedPoint) - 1;
        const pointDef = EREMUNERASI_POINTS[pointIndex];
        
        const processedData = logbooks.map(logbook => {
          const patientNames = logbook.daftar_tindakan?.map(formatPatientName).join(', ') || '';
          const patientCount = logbook.daftar_tindakan?.length || 0;
          
          return {
            tanggal: logbook.tanggal_dinas,
            deskripsi: patientCount > 0 ? pointDef.prefix + patientNames : '-',
            jumlahKegiatan: patientCount
          };
        }).filter(d => d.jumlahKegiatan > 0);
        
        setMonthlyData(processedData);
        
        if (processedData.length === 0) {
          toast.info('Tidak ada data untuk periode ini');
        }
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin`);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">e-Remunerasi</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-0.5">Generate laporan e-Remunerasi dari data logbook</p>
      </div>

      {/* Mode Toggle */}
      <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 md:h-12 bg-slate-100 rounded-xl p-1">
          <TabsTrigger 
            value="per-nilai" 
            data-testid="tab-per-nilai"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
          >
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Tampilan</span> Per Nilai
          </TabsTrigger>
          <TabsTrigger 
            value="per-tanggal"
            data-testid="tab-per-tanggal"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm"
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Tampilan</span> Per Tanggal
          </TabsTrigger>
        </TabsList>
        
        {/* Mode 1: Tampilan Per Nilai (By Date) */}
        <TabsContent value="per-nilai" className="mt-4 space-y-3 md:space-y-4">
          <Card className="border-0 shadow-card bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="date-picker" className="text-sm">Pilih Tanggal</Label>
                  <Input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    data-testid="date-picker-nilai"
                    className="h-10 md:h-12"
                  />
                </div>
                <Button
                  onClick={() => fetchLogbookByDate(selectedDate)}
                  disabled={loading}
                  data-testid="btn-generate-nilai"
                  className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700 px-6 md:px-8"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ClipboardList className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Points */}
          {generatedPoints.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {generatedPoints.map((point, idx) => (
                <Card key={idx} className="border-0 shadow-card bg-white">
                  <CardHeader className="pb-2 p-3 md:p-4 md:pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-sm md:text-base font-heading">
                        Point {point.point}: {point.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm text-slate-500">
                          Kegiatan: <strong className="text-teal-600">{point.jumlahKegiatan}</strong>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(point.generatedText, `Point ${point.point}`)}
                          data-testid={`btn-copy-point-${point.point}`}
                          className="rounded-full text-xs h-8"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0 md:pt-0">
                    <Textarea
                      value={point.generatedText}
                      readOnly
                      className="min-h-[70px] md:min-h-[80px] text-xs md:text-sm bg-slate-50 resize-none"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-card bg-slate-50">
              <CardContent className="p-8 md:p-12 text-center text-slate-400">
                <ClipboardList className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">Pilih tanggal dan klik "Generate" untuk membuat laporan</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Mode 2: Tampilan Per Tanggal (By Point & Month) */}
        <TabsContent value="per-tanggal" className="mt-4 space-y-3 md:space-y-4">
          <Card className="border-0 shadow-card bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Bulan</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger data-testid="select-month" className="h-10 md:h-12 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Tahun</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger data-testid="select-year" className="h-10 md:h-12 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs md:text-sm">Point</Label>
                  <Select value={selectedPoint} onValueChange={setSelectedPoint}>
                    <SelectTrigger data-testid="select-point" className="h-10 md:h-12 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EREMUNERASI_POINTS.map((point) => (
                        <SelectItem key={point.point} value={point.point.toString()}>
                          Point {point.point}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={fetchMonthlyLogbooks}
                  disabled={loading}
                  data-testid="btn-generate-tanggal"
                  className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 md:mr-2 animate-spin" />
                  ) : (
                    <ClipboardList className="w-4 h-4 md:mr-2" />
                  )}
                  <span className="hidden md:inline">Generate</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Data Table */}
          <Card className="border-0 shadow-card bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading">
                Data Point {selectedPoint} - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {monthlyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-36">Tanggal</TableHead>
                        <TableHead>Deskripsi Kegiatan</TableHead>
                        <TableHead className="w-32 text-center">Jumlah Kegiatan</TableHead>
                        <TableHead className="w-20">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {new Date(row.tanggal).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 max-w-md">
                            <div className="line-clamp-2">{row.deskripsi}</div>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-teal-600">
                            {row.jumlahKegiatan}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(row.deskripsi)}
                              data-testid={`btn-copy-row-${idx}`}
                              className="h-8 w-8"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Pilih filter dan klik "Generate" untuk menampilkan data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ERemunerasiPage;

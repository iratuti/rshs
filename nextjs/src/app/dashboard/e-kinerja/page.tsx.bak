import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, FileCheck, FileText } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Shift times mapping
const SHIFT_TIMES = {
  PAGI: { time1: '07:00', time2: '07:15', time3: '07:30', label: 'pagi' },
  SIANG: { time1: '14:00', time2: '14:15', time3: '14:30', label: 'siang' },
  MALAM: { time1: '21:00', time2: '21:15', time3: '21:30', label: 'malam' },
};

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

// ALL e-Kinerja Point Definitions including Points 6, 7, 8
const EKINERJA_POINT_DEFINITIONS = [
  { point: 1, title: 'Menerima Pasien Baru', category: 'PASIEN BARU' },
  { point: 2, title: 'Menyiapkan Ruangan untuk Pasien Baru', category: 'PASIEN BARU' },
  { point: 4, title: 'Koordinasi DPJP Resume Pulang', category: 'PASIEN PULANG' },
  { point: 5, title: 'Menerima Pasien Baru Admission', category: 'PASIEN BARU' },
  { point: 6, title: 'Pengkajian & Evaluasi Keperawatan', category: 'SEMUA PASIEN' },
  { point: 7, title: 'Melakukan Visit Pasien', category: 'SEMUA PASIEN' },
  { point: 8, title: 'Dokumentasi Keperawatan di EMR', category: 'SEMUA PASIEN' },
  { point: 10, title: 'Intervensi & Implementasi Keperawatan', category: 'SEMUA PASIEN' },
  { point: 11, title: 'Pengisian EMR', category: 'SEMUA PASIEN' },
  { point: 13, title: 'Asesmen Risiko Jatuh', category: 'SEMUA PASIEN' },
  { point: 16, title: 'Asuhan Keperawatan Sesuai SOP', category: 'SEMUA PASIEN' },
  { point: 17, title: 'Mendampingi DPJP Visite', category: 'SEMUA PASIEN' },
  { point: 18, title: 'Tindakan Keperawatan Efektif', category: 'SEMUA PASIEN' },
  { point: 22, title: 'Manajemen Infus', category: 'SEMUA PASIEN' },
  { point: 24, title: 'Cuci Tangan 5 Momen', category: 'SEMUA PASIEN' },
  { point: 25, title: 'Kelengkapan Administrasi Pulang', category: 'PASIEN PULANG' },
  { point: 27, title: 'Penggunaan APD', category: 'SEMUA PASIEN' },
  { point: 28, title: 'Briefing dan Operan Shift', category: 'ABSENSI' },
  { point: 29, title: 'Absensi Dinas', category: 'ABSENSI' },
];

// e-Kinerja Point Templates - ALL POINTS as specified
const EKINERJA_POINTS = {
  // PASIEN BARU - Points 1, 2, 5
  BARU: [
    {
      point: 1,
      template: (patients) => `Menerima pasien baru ${patients}\nMemastikan ketersediaan tempat tidur untuk pasien yang akan masuk rawat inap ${patients}`
    },
    {
      point: 2,
      template: (patients) => `Menyiapkan ruangan dan melakukan verbedent sebelum pasien baru ${patients} masuk ke ruangan.`
    },
    {
      point: 5,
      template: (patients) => `Menerima pasien baru ${patients} sesuai dengan pesanan admission`
    },
  ],
  // PASIEN PULANG - Points 4, 25
  PULANG: [
    {
      point: 4,
      template: (patients) => `Melakukan koordinasi dengan DPJP terkait resume pulang dan KOP pulang pasien ${patients} harus ada sebelum pulang atau H-1`
    },
    {
      point: 25,
      template: (patients) => `Memastikan kelengkapan administrasi pasien pulang mulai dari RMK, resume, kelengkapan tindakan atau data pelayanaan, laporan operasi dan obat pulang kepada ${patients}`
    },
  ],
  // SEMUA PASIEN - Points 6, 7, 8, 10, 11, 13, 16, 17, 18, 22, 24, 27
  ALL: [
    // NEW POINT 6
    {
      point: 6,
      template: (patients) => `Melakukan pengkajian keperawatan lanjutan kepada pasien ${patients}\nMelakukan perencanaan keperawatan kepada pasien ${patients}\nMelakukan intervensi keperawatan kepada pasien ${patients}\nMelakukan implementasi keperawatan kepada pasien ${patients}\nMelakukan evaluasi keperawatan kepada pasien ${patients}`
    },
    // NEW POINT 7
    {
      point: 7,
      template: (patients) => `Melakukan visit kepada pasien ${patients}`
    },
    // NEW POINT 8
    {
      point: 8,
      template: (patients) => `Melakukan asuhan keperawatan awal dan lanjutan pada pasien ${patients} di EMR\nMelakukan perencanaan keperawatan pada pasien ${patients} di EMR\nMelakukan intervensi keperawatan pada pasien ${patients} di EMR\nMelakukan implementasi keperawatan pada pasien ${patients} di EMR\nMelakukan evaluasi keperawatan pada pasien ${patients} di EMR\nMelakukan dokumentasi keperawatan pada pasien ${patients} di EMR\nMendokumentasikan segala tindakan yang dilakukan kepada pasien ${patients} di EMR`
    },
    {
      point: 10,
      template: (patients) => `Melakukan intervensi keperawatan kepada pasien ${patients}\nMelakukan implementasi keperawatan kepada pasien ${patients}`
    },
    {
      point: 11,
      template: (patients) => `Melakukan pengisian EMR terhadap pasien ${patients} , pada setiap melakukan tindakan dan asuhan yang di dokumentasikan di EMR.`
    },
    {
      point: 13,
      template: (patients) => `Melakukan assesmen ulang resiko jatuh kepada pasien ${patients}\nMemastikan bed plang pasien ${patients}\nMemastikan bahwa lingkungan fisik ruangan aman untuk mencegah terjadinya cedera kepada pasien ${patients}`
    },
    {
      point: 16,
      template: (patients) => `Melakukan asuhan keperawatan kepada pasien ${patients} sesuai SOP yang berlaku`
    },
    {
      point: 17,
      template: (patients) => `Mendampingi DPJP saat visite kepada pasien ${patients}`
    },
    {
      point: 18,
      template: (patients) => `Melakukan tindakan keperawatan secara efektif pada pasien ${patients} setiap shift sesuai dengan rencana asuhan terpadu`
    },
    {
      point: 22,
      template: (patients) => `Setiap melakukan pemasangan infus kepada pasien ${patients} diberikan tanggal pemasangan dan jam\nMengecek tanggal dilakukan pemasangan infus kepada pasien ${patients} , jika sudah >3 hari pemasangan infus dipindahkan\nMelakukan pengecekan di area pemasangan infus kepada pasien ${patients} apakah terjadi kemerahan, bengkak, terasa nyeri dan panas pada area pemasangan infus`
    },
    {
      point: 24,
      template: (patients) => `Setelah kontak dengan lingkungan pasien ${patients} meakukan cuci tangan dengan handrub atau air mengalir\nSetelah kontak dengan pasien ${patients} melakukan cuci tangan dengan handrub atau air mengalir\nSetelah terkena cairan tubuh pasien ${patients} melakukan cuci tangan dengan handrub atau air mengalir\nSebelum melakukan tindakan aseptik kepada ${patients} melakukan cuci tangan terlebih dahulu dengan handrub atau air mengalir\nSebelum kontak dengan pasien ${patients} melakukan cuci tangan terlebih dahulu dengan handrub atau air mengalir`
    },
    {
      point: 27,
      template: (patients) => `Setiap melakukan tindakan keperawatan kepada pasien ${patients} memakai APD sesuai standar, misalnya membuang urine pasien menggunakan handscone, memakai masker di ruang droplet`
    },
  ],
};

const EKinerjaPage = () => {
  const [activeMode, setActiveMode] = useState('per-nilai');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [logbookData, setLogbookData] = useState(null);
  const [generatedSubPoints, setGeneratedSubPoints] = useState([]);
  
  // Mode 2: Per Tanggal (By Point & Month)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPoint, setSelectedPoint] = useState('6');
  const [monthlyData, setMonthlyData] = useState([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Format patient name
  const formatPatientName = (tindakan) => {
    return `Tn. ${tindakan.nama_pasien} (${tindakan.no_rm})`;
  };

  // Generate text for a specific point
  const generatePointText = useCallback((pointNum, logbook) => {
    if (!logbook?.daftar_tindakan?.length) return '';
    
    const allPatients = logbook.daftar_tindakan.map(formatPatientName);
    const pasienBaru = logbook.daftar_tindakan
      .filter(t => t.jenis_pasien === 'PASIEN_BARU')
      .map(formatPatientName);
    const pasienPulang = logbook.daftar_tindakan
      .filter(t => t.jenis_pasien === 'PASIEN_PULANG')
      .map(formatPatientName);

    const semuaPasienStr = allPatients.join(', ');
    const pasienBaruStr = pasienBaru.length > 0 ? pasienBaru.join(', ') : null;
    const pasienPulangStr = pasienPulang.length > 0 ? pasienPulang.join(', ') : null;

    const shiftTimes = SHIFT_TIMES[logbook.shift] || SHIFT_TIMES.PAGI;
    
    // Find template and generate
    const baruPoint = EKINERJA_POINTS.BARU.find(p => p.point === pointNum);
    if (baruPoint && pasienBaruStr) {
      return baruPoint.template(pasienBaruStr);
    }
    
    const pulangPoint = EKINERJA_POINTS.PULANG.find(p => p.point === pointNum);
    if (pulangPoint && pasienPulangStr) {
      return pulangPoint.template(pasienPulangStr);
    }
    
    const allPoint = EKINERJA_POINTS.ALL.find(p => p.point === pointNum);
    if (allPoint) {
      return allPoint.template(semuaPasienStr);
    }
    
    // Shift points
    if (pointNum === 28) {
      return `Melakukan briefing dan berdoa sebelum jam pelayanan dimulai pukul ${shiftTimes.time1}\nMelakukan dan memulai jam pelayanan pada pukul ${shiftTimes.time2}\nMelakukan operan pada pasien dari dinas ${shiftTimes.label}`;
    }
    if (pointNum === 29) {
      return `Melakukan absensi dinas ${shiftTimes.label}, absensi datang pukul ${logbook.jam_datang}, dan absesni pulang pukul ${logbook.jam_pulang}`;
    }
    
    return '';
  }, []);

  // Process patients and generate e-Kinerja points, then SPLIT by \n
  const generateEKinerja = useCallback((logbook) => {
    if (!logbook?.daftar_tindakan?.length) return [];

    const allPatients = logbook.daftar_tindakan.map(formatPatientName);
    const pasienBaru = logbook.daftar_tindakan
      .filter(t => t.jenis_pasien === 'PASIEN_BARU')
      .map(formatPatientName);
    const pasienPulang = logbook.daftar_tindakan
      .filter(t => t.jenis_pasien === 'PASIEN_PULANG')
      .map(formatPatientName);

    const semuaPasienStr = allPatients.join(', ');
    const pasienBaruStr = pasienBaru.length > 0 ? pasienBaru.join(', ') : null;
    const pasienPulangStr = pasienPulang.length > 0 ? pasienPulang.join(', ') : null;

    const shiftTimes = SHIFT_TIMES[logbook.shift] || SHIFT_TIMES.PAGI;
    const subPoints = [];

    // Helper to split and add sub-points
    const addSubPoints = (point, category, text) => {
      const lines = text.split('\n').filter(line => line.trim());
      lines.forEach((line, idx) => {
        subPoints.push({
          point,
          subIndex: idx + 1,
          totalSubs: lines.length,
          category,
          text: line.trim()
        });
      });
    };

    // PASIEN BARU points (only if exists) - Points 1, 2, 5
    if (pasienBaruStr) {
      EKINERJA_POINTS.BARU.forEach(({ point, template }) => {
        addSubPoints(point, 'PASIEN BARU', template(pasienBaruStr));
      });
    }

    // PASIEN PULANG points (only if exists) - Points 4, 25
    if (pasienPulangStr) {
      EKINERJA_POINTS.PULANG.forEach(({ point, template }) => {
        addSubPoints(point, 'PASIEN PULANG', template(pasienPulangStr));
      });
    }

    // ALL PASIEN points - Points 6, 7, 8, 10, 11, 13, 16, 17, 18, 22, 24, 27
    EKINERJA_POINTS.ALL.forEach(({ point, template }) => {
      addSubPoints(point, 'SEMUA PASIEN', template(semuaPasienStr));
    });

    // ABSENSI & SHIFT points - Points 28, 29
    addSubPoints(28, 'ABSENSI', 
      `Melakukan briefing dan berdoa sebelum jam pelayanan dimulai pukul ${shiftTimes.time1}\nMelakukan dan memulai jam pelayanan pada pukul ${shiftTimes.time2}\nMelakukan operan pada pasien dari dinas ${shiftTimes.label}`
    );

    addSubPoints(29, 'ABSENSI',
      `Melakukan absensi dinas ${shiftTimes.label}, absensi datang pukul ${logbook.jam_datang}, dan absesni pulang pukul ${logbook.jam_pulang}`
    );

    // Sort by point number, then by subIndex
    subPoints.sort((a, b) => {
      if (a.point !== b.point) return a.point - b.point;
      return a.subIndex - b.subIndex;
    });

    return subPoints;
  }, []);

  const fetchLogbookByDate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/logbooks?month=${parseInt(selectedDate.split('-')[1])}&year=${parseInt(selectedDate.split('-')[0])}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const logbooks = await response.json();
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
        const pointNum = parseInt(selectedPoint);
        
        const processedData = logbooks.map(logbook => {
          const patientCount = logbook.daftar_tindakan?.length || 0;
          if (patientCount === 0) return null;

          const pointText = generatePointText(pointNum, logbook);
          if (!pointText) return null;
          
          return {
            tanggal: logbook.tanggal_dinas,
            deskripsi: pointText,
            jumlahKegiatan: patientCount
          };
        }).filter(d => d !== null);
        
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

  const copyAllSubPoints = () => {
    const fullText = generatedSubPoints.map(p => p.text).join('\n\n');
    copyToClipboard(fullText, 'Semua sub-poin e-Kinerja');
  };

  const getSummary = () => {
    if (!logbookData) return null;
    
    const baru = logbookData.daftar_tindakan?.filter(t => t.jenis_pasien === 'PASIEN_BARU').length || 0;
    const pulang = logbookData.daftar_tindakan?.filter(t => t.jenis_pasien === 'PASIEN_PULANG').length || 0;
    const total = logbookData.daftar_tindakan?.length || 0;
    
    return { total, baru, pulang };
  };

  const summary = getSummary();

  // Group sub-points by point number for display
  const groupedByPoint = generatedSubPoints.reduce((acc, sp) => {
    if (!acc[sp.point]) {
      acc[sp.point] = { category: sp.category, items: [] };
    }
    acc[sp.point].items.push(sp);
    return acc;
  }, {});

  const getCategoryColor = (category) => {
    switch (category) {
      case 'PASIEN BARU': return 'text-emerald-600 bg-emerald-50';
      case 'PASIEN PULANG': return 'text-orange-600 bg-orange-50';
      case 'ABSENSI': return 'text-purple-600 bg-purple-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">e-Kinerja</h1>
        <p className="text-slate-500 text-sm mt-0.5">Generate laporan e-Kinerja dari data logbook</p>
      </div>

      {/* DUAL VIEW MODE TABS - Same as e-Remunerasi */}
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
          {/* Date Picker & Generate */}
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
                    data-testid="date-picker-kinerja"
                    className="h-10 md:h-12"
                  />
                </div>
                <Button
                  onClick={fetchLogbookByDate}
                  disabled={loading}
                  data-testid="btn-generate-kinerja"
                  className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700 px-6 md:px-8"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
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
                        {new Date(selectedDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs md:text-sm text-slate-600">
                        Shift {logbookData?.shift} | {summary.total} pasien
                        {summary.baru > 0 && ` (${summary.baru} baru)`}
                        {summary.pulang > 0 && ` (${summary.pulang} pulang)`}
                      </p>
                    </div>
                  </div>
                  {generatedSubPoints.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAllSubPoints}
                      data-testid="btn-copy-all-kinerja"
                      className="rounded-full text-xs md:text-sm"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Salin Semua ({generatedSubPoints.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Sub-Points - EACH IN SEPARATE CARD */}
          {generatedSubPoints.length > 0 ? (
            <Card className="border-0 shadow-card bg-white">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-base md:text-lg font-heading flex items-center gap-2">
                  <FileCheck className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                  Hasil e-Kinerja ({generatedSubPoints.length} Sub-Poin)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] md:h-[600px]">
                  <div className="p-4 space-y-3">
                    {Object.entries(groupedByPoint).map(([pointNum, group]) => (
                      <div key={pointNum} className="space-y-2">
                        {/* Point Header */}
                        <div className="flex items-center gap-2 sticky top-0 bg-white py-2 z-10">
                          <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold ${getCategoryColor(group.category)}`}>
                            {pointNum}
                          </span>
                          <span className="text-xs text-slate-500 uppercase tracking-wide">
                            {group.category}
                          </span>
                        </div>
                        
                        {/* Sub-Points - EACH IN SEPARATE BOX with Copy button */}
                        {group.items.map((subPoint, idx) => (
                          <div 
                            key={`${pointNum}-${idx}`}
                            className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                {subPoint.text}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(subPoint.text, `Point ${pointNum}.${subPoint.subIndex}`)}
                              data-testid={`btn-copy-${pointNum}-${idx}`}
                              className="shrink-0 h-8 px-2 opacity-60 hover:opacity-100 transition-opacity"
                            >
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
                <p className="text-sm md:text-base">Pilih tanggal dan klik "Generate" untuk membuat laporan e-Kinerja</p>
                <p className="text-xs md:text-sm mt-2">Setiap sub-poin akan ditampilkan dalam kotak terpisah</p>
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
                    <SelectTrigger data-testid="select-month-kinerja" className="h-10 md:h-12 text-sm">
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
                    <SelectTrigger data-testid="select-year-kinerja" className="h-10 md:h-12 text-sm">
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
                    <SelectTrigger data-testid="select-point-kinerja" className="h-10 md:h-12 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EKINERJA_POINT_DEFINITIONS.map((point) => (
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
                  data-testid="btn-generate-tanggal-kinerja"
                  className="h-10 md:h-12 bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 md:mr-2 animate-spin" />
                  ) : (
                    <FileCheck className="w-4 h-4 md:mr-2" />
                  )}
                  <span className="hidden md:inline">Generate</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Data Table */}
          <Card className="border-0 shadow-card bg-white overflow-hidden">
            <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
              <CardTitle className="text-sm md:text-lg font-heading">
                Point {selectedPoint}: {EKINERJA_POINT_DEFINITIONS.find(p => p.point === parseInt(selectedPoint))?.title}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {monthlyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-28 md:w-36 text-xs md:text-sm">Tanggal</TableHead>
                        <TableHead className="text-xs md:text-sm">Deskripsi Kegiatan</TableHead>
                        <TableHead className="w-20 md:w-32 text-center text-xs md:text-sm">Jumlah</TableHead>
                        <TableHead className="w-12 md:w-20 text-xs md:text-sm">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-xs md:text-sm align-top">
                            {new Date(row.tanggal).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm text-slate-700">
                            <pre className="whitespace-pre-wrap font-sans">{row.deskripsi}</pre>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-teal-600 text-xs md:text-sm align-top">
                            {row.jumlahKegiatan}
                          </TableCell>
                          <TableCell className="align-top">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(row.deskripsi)}
                              data-testid={`btn-copy-row-${idx}`}
                              className="h-7 w-7 md:h-8 md:w-8"
                            >
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
                  <p className="text-sm md:text-base">Pilih filter dan klik "Generate" untuk menampilkan data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EKinerjaPage;

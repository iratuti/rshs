import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, FileCheck, ClipboardCopy } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// e-Kinerja Point Templates
const EKINERJA_POINTS = {
  // SEMUA PASIEN
  ALL: [
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
  // PASIEN BARU
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
  // PASIEN PULANG
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
};

// Shift times mapping
const SHIFT_TIMES = {
  PAGI: { time1: '07:00', time2: '07:15', time3: '07:30', label: 'pagi' },
  SIANG: { time1: '14:00', time2: '14:15', time3: '14:30', label: 'siang' },
  MALAM: { time1: '21:00', time2: '21:15', time3: '21:30', label: 'malam' },
};

const EKinerjaPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [logbookData, setLogbookData] = useState(null);
  const [generatedPoints, setGeneratedPoints] = useState([]);

  // Format patient name
  const formatPatientName = (tindakan) => {
    return `Tn. ${tindakan.nama_pasien} (${tindakan.no_rm})`;
  };

  // Process patients and generate e-Kinerja points
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
    const points = [];

    // PASIEN BARU points (only if exists)
    if (pasienBaruStr) {
      EKINERJA_POINTS.BARU.forEach(({ point, template }) => {
        points.push({
          point,
          category: 'PASIEN BARU',
          text: template(pasienBaruStr)
        });
      });
    }

    // PASIEN PULANG points (only if exists)
    if (pasienPulangStr) {
      EKINERJA_POINTS.PULANG.forEach(({ point, template }) => {
        points.push({
          point,
          category: 'PASIEN PULANG',
          text: template(pasienPulangStr)
        });
      });
    }

    // ALL PASIEN points
    EKINERJA_POINTS.ALL.forEach(({ point, template }) => {
      points.push({
        point,
        category: 'SEMUA PASIEN',
        text: template(semuaPasienStr)
      });
    });

    // ABSENSI & SHIFT points
    points.push({
      point: 28,
      category: 'ABSENSI & SHIFT',
      text: `Melakukan briefing dan berdoa sebelum jam pelayanan dimulai pukul ${shiftTimes.time1}\nMelakukan dan memulai jam pelayanan pada pukul ${shiftTimes.time2}\nMelakukan operan pada pasien dari dinas ${shiftTimes.label}`
    });

    points.push({
      point: 29,
      category: 'ABSENSI & SHIFT',
      text: `Melakukan absensi dinas ${shiftTimes.label}, absensi datang pukul ${logbook.jam_datang}, dan absesni pulang pukul ${logbook.jam_pulang}`
    });

    // Sort by point number
    points.sort((a, b) => a.point - b.point);

    return points;
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
          const points = generateEKinerja(logbook);
          setGeneratedPoints(points);
          toast.success(`e-Kinerja berhasil di-generate (${points.length} poin)`);
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

  const copyToClipboard = (text, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin`);
  };

  const copyAllPoints = () => {
    const fullText = generatedPoints.map(p => `[Point ${p.point}]\n${p.text}`).join('\n\n');
    copyToClipboard(fullText, 'Semua poin e-Kinerja');
  };

  const getSummary = () => {
    if (!logbookData) return null;
    
    const baru = logbookData.daftar_tindakan?.filter(t => t.jenis_pasien === 'PASIEN_BARU').length || 0;
    const pulang = logbookData.daftar_tindakan?.filter(t => t.jenis_pasien === 'PASIEN_PULANG').length || 0;
    const total = logbookData.daftar_tindakan?.length || 0;
    
    return { total, baru, pulang };
  };

  const summary = getSummary();

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">e-Kinerja</h1>
        <p className="text-slate-500 text-sm mt-1">Generate laporan e-Kinerja dari data logbook</p>
      </div>

      {/* Date Picker & Generate */}
      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-picker">Pilih Tanggal</Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                data-testid="date-picker-kinerja"
                className="h-12"
              />
            </div>
            <Button
              onClick={fetchLogbookByDate}
              disabled={loading}
              data-testid="btn-generate-kinerja"
              className="h-12 bg-teal-600 hover:bg-teal-700 px-8"
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-slate-900">
                    {new Date(selectedDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-slate-600">
                    Shift {logbookData?.shift} | {summary.total} pasien
                    {summary.baru > 0 && ` (${summary.baru} baru)`}
                    {summary.pulang > 0 && ` (${summary.pulang} pulang)`}
                  </p>
                </div>
              </div>
              {generatedPoints.length > 0 && (
                <Button
                  variant="outline"
                  onClick={copyAllPoints}
                  data-testid="btn-copy-all-kinerja"
                  className="rounded-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Salin Semua ({generatedPoints.length} poin)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Points */}
      {generatedPoints.length > 0 ? (
        <Card className="border-0 shadow-card bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-600" />
              Hasil e-Kinerja ({generatedPoints.length} Poin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {generatedPoints.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600 text-white text-sm font-semibold">
                          {item.point}
                        </span>
                        <span className="text-sm text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(item.text, `Point ${item.point}`)}
                        data-testid={`btn-copy-point-${item.point}`}
                        className="rounded-full"
                      >
                        <ClipboardCopy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    {/* Clean text output - no badges inside */}
                    <Textarea
                      value={item.text}
                      readOnly
                      className="min-h-[100px] text-sm bg-white resize-none font-normal"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-card bg-slate-50">
          <CardContent className="p-12 text-center text-slate-400">
            <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Pilih tanggal dan klik "Generate" untuk membuat laporan e-Kinerja</p>
            <p className="text-sm mt-2">Laporan akan di-generate berdasarkan data logbook yang tersimpan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EKinerjaPage;

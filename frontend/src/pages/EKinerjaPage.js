import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, FileCheck } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
  // SEMUA PASIEN - Points 10, 11, 13, 16, 17, 18, 22, 24, 27
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
  const [generatedSubPoints, setGeneratedSubPoints] = useState([]);

  // Format patient name
  const formatPatientName = (tindakan) => {
    return `Tn. ${tindakan.nama_pasien} (${tindakan.no_rm})`;
  };

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

    // ALL PASIEN points - Points 10, 11, 13, 16, 17, 18, 22, 24, 27
    EKINERJA_POINTS.ALL.forEach(({ point, template }) => {
      addSubPoints(point, 'SEMUA PASIEN', template(semuaPasienStr));
    });

    // ABSENSI & SHIFT points - Points 28, 29
    addSubPoints(28, 'ABSENSI & SHIFT', 
      `Melakukan briefing dan berdoa sebelum jam pelayanan dimulai pukul ${shiftTimes.time1}\nMelakukan dan memulai jam pelayanan pada pukul ${shiftTimes.time2}\nMelakukan operan pada pasien dari dinas ${shiftTimes.label}`
    );

    addSubPoints(29, 'ABSENSI & SHIFT',
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
      case 'ABSENSI & SHIFT': return 'text-purple-600 bg-purple-50';
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

      {/* Date Picker & Generate */}
      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-4">
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
                    
                    {/* Sub-Points - EACH IN SEPARATE BOX */}
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
    </div>
  );
};

export default EKinerjaPage;

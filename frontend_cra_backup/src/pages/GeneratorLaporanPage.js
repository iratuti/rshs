import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText, Copy, RefreshCw, Calendar, CheckCircle, ClipboardCopy, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Toggle labels mapping for e-Remunerasi
const TINDAKAN_LABELS = {
  oksigenasi: 'OKSIGENASI',
  perawatan_luka_sederhana: 'PERAWATAN LUKA SEDERHANA',
  pre_pasca_op: 'PRE / PASCA OP',
  kompres_terbuka: 'KOMPRES TERBUKA',
  memasang_infus_baru: 'MEMASANG INFUS BARU',
  memberikan_cairan_infus: 'MEMBERIKAN CAIRAN INFUS',
  memasang_ngt: 'MEMASANG NGT',
  transfusi_darah: 'TRANSFUSI DARAH',
  nebu: 'NEBU',
  memasang_dc_kateter: 'MEMASANG DC/KATETER',
  koreksi_caglukonas: 'KOREKSI CAGlukonas',
  koreksi_kcl: 'KOREKSI KCL',
  uji_lab: 'UJI LAB',
};

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

const GeneratorLaporanPage = () => {
  const [logbook, setLogbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [remunerasiText, setRemunerasiText] = useState('');
  const [kinerjaPoints, setKinerjaPoints] = useState([]);
  const [activeTab, setActiveTab] = useState('remunerasi');

  useEffect(() => {
    fetchTodayLogbook();
  }, []);

  const fetchTodayLogbook = async () => {
    try {
      const response = await fetch(`${API_URL}/api/logbooks/today`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
      }
    } catch (error) {
      console.error('Error fetching logbook:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format patient name as "Tn. Nama (NoRM)"
  const formatPatientName = (tindakan) => {
    return `Tn. ${tindakan.nama_pasien} (${tindakan.no_rm})`;
  };

  // Process patients and categorize them
  const processPatients = () => {
    if (!logbook?.daftar_tindakan?.length) return null;

    const allPatients = logbook.daftar_tindakan.map(formatPatientName);
    const pasienBaru = logbook.daftar_tindakan
      .filter(t => t.jenis_pasien === 'PASIEN_BARU')
      .map(formatPatientName);
    const pasienPulang = logbook.daftar_tindakan
      .filter(t => t.jenis_pasien === 'PASIEN_PULANG')
      .map(formatPatientName);

    return {
      semuaPasienStr: allPatients.join(', '),
      pasienBaruStr: pasienBaru.length > 0 ? pasienBaru.join(', ') : null,
      pasienPulangStr: pasienPulang.length > 0 ? pasienPulang.join(', ') : null,
      counts: {
        all: allPatients.length,
        baru: pasienBaru.length,
        pulang: pasienPulang.length
      }
    };
  };

  const handleGenerateRemun = async () => {
    if (!logbook || !logbook.daftar_tindakan?.length) {
      toast.error('Tidak ada data tindakan untuk hari ini');
      return;
    }

    setGenerating(true);
    
    try {
      let lines = [];
      
      logbook.daftar_tindakan.forEach((tindakan, idx) => {
        let keterangan = [];
        if (tindakan.keterangan_tindakan?.length > 0) {
          keterangan = [...tindakan.keterangan_tindakan];
        }
        
        Object.keys(TINDAKAN_LABELS).forEach(key => {
          if (tindakan[key]) {
            keterangan.push(TINDAKAN_LABELS[key]);
          }
        });
        
        if (tindakan.catatan_lainnya) {
          keterangan.push(tindakan.catatan_lainnya);
        }
        
        const keteranganText = keterangan.join(', ');
        const statusLabel = {
          'PASIEN_BARU': 'PASIEN BARU',
          'PASIEN_LAMA': 'PASIEN LAMA',
          'PASIEN_PULANG': 'PASIEN PULANG'
        }[tindakan.jenis_pasien] || '';
        
        const line = `${idx + 1}. ${tindakan.nama_pasien} (RM: ${tindakan.no_rm}${tindakan.no_billing ? `, Billing: ${tindakan.no_billing}` : ''}) - ${statusLabel}\n   Diagnosa: ${tindakan.diagnosa || '-'}\n   Keterangan: ${keteranganText}`;
        lines.push(line);
      });
      
      const header = `=== LAPORAN e-REMUNERASI ===\nTanggal: ${logbook.tanggal_dinas}\nShift: ${logbook.shift}\nJam Dinas: ${logbook.jam_datang} - ${logbook.jam_pulang}\nJumlah Pasien: ${logbook.daftar_tindakan.length}\n\n--- DAFTAR TINDAKAN ---\n`;
      
      setRemunerasiText(header + lines.join('\n\n'));
      setActiveTab('remunerasi');
      toast.success('Laporan e-Remunerasi berhasil di-generate');
    } catch (error) {
      toast.error('Gagal generate laporan');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateKinerja = async () => {
    if (!logbook || !logbook.daftar_tindakan?.length) {
      toast.error('Tidak ada data tindakan untuk hari ini');
      return;
    }

    setGenerating(true);
    
    try {
      const patientData = processPatients();
      if (!patientData) {
        toast.error('Gagal memproses data pasien');
        return;
      }

      const { semuaPasienStr, pasienBaruStr, pasienPulangStr, counts } = patientData;
      const shiftTimes = SHIFT_TIMES[logbook.shift] || SHIFT_TIMES.PAGI;
      
      const generatedPoints = [];

      // Category A: ALL PASIEN
      EKINERJA_POINTS.ALL.forEach(({ point, template }) => {
        generatedPoints.push({
          point,
          category: 'SEMUA PASIEN',
          text: template(semuaPasienStr)
        });
      });

      // Category B: PASIEN BARU (only if exists)
      if (pasienBaruStr) {
        EKINERJA_POINTS.BARU.forEach(({ point, template }) => {
          generatedPoints.push({
            point,
            category: 'PASIEN BARU',
            text: template(pasienBaruStr)
          });
        });
      }

      // Category C: PASIEN PULANG (only if exists)
      if (pasienPulangStr) {
        EKINERJA_POINTS.PULANG.forEach(({ point, template }) => {
          generatedPoints.push({
            point,
            category: 'PASIEN PULANG',
            text: template(pasienPulangStr)
          });
        });
      }

      // Category D: ABSENSI & SHIFT
      generatedPoints.push({
        point: 28,
        category: 'ABSENSI & SHIFT',
        text: `Melakukan briefing dan berdoa sebelum jam pelayanan dimulai pukul ${shiftTimes.time1}\nMelakukan dan memulai jam pelayanan pada pukul ${shiftTimes.time2}\nMelakukan operan pada pasien dari dinas ${shiftTimes.label}`
      });

      generatedPoints.push({
        point: 29,
        category: 'ABSENSI & SHIFT',
        text: `Melakukan absensi dinas ${shiftTimes.label}, absensi datang pukul ${logbook.jam_datang}, dan absesni pulang pukul ${logbook.jam_pulang}`
      });

      // Sort by point number
      generatedPoints.sort((a, b) => a.point - b.point);

      setKinerjaPoints(generatedPoints);
      setActiveTab('kinerja');
      toast.success(`Laporan e-Kinerja berhasil di-generate (${generatedPoints.length} poin)`);
    } catch (error) {
      console.error('Error generating e-Kinerja:', error);
      toast.error('Gagal generate laporan');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin`);
  };

  const copyAllKinerja = () => {
    const fullText = kinerjaPoints.map(p => `[Point ${p.point}]\n${p.text}`).join('\n\n');
    copyToClipboard(fullText, 'Semua poin e-Kinerja');
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'PASIEN BARU': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PASIEN PULANG': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'ABSENSI & SHIFT': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const patientSummary = processPatients();

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Generator Laporan</h1>
        <p className="text-slate-500 text-sm mt-1">Generate laporan otomatis dari data logbook</p>
      </div>

      {/* Today's Summary */}
      <Card className="border-0 shadow-card bg-gradient-to-br from-teal-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-slate-900">
                Data Hari Ini
              </h3>
              {logbook ? (
                <div className="text-sm text-slate-600">
                  <p>Shift {logbook.shift} | {logbook.daftar_tindakan?.length || 0} pasien tercatat</p>
                  {patientSummary && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {patientSummary.counts.baru > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                          {patientSummary.counts.baru} Pasien Baru
                        </Badge>
                      )}
                      {patientSummary.counts.pulang > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                          {patientSummary.counts.pulang} Pasien Pulang
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada data logbook untuk hari ini</p>
              )}
            </div>
            {logbook && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Tersedia
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleGenerateRemun}
          disabled={generating || !logbook}
          data-testid="btn-generate-remunerasi"
          className="h-14 bg-orange-500 hover:bg-orange-600 rounded-xl font-heading font-semibold"
        >
          {generating ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <FileText className="w-5 h-5 mr-2" />
          )}
          Generate e-Remunerasi
        </Button>
        <Button
          onClick={handleGenerateKinerja}
          disabled={generating || !logbook}
          data-testid="btn-generate-kinerja"
          className="h-14 bg-teal-600 hover:bg-teal-700 rounded-xl font-heading font-semibold"
        >
          {generating ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <FileText className="w-5 h-5 mr-2" />
          )}
          Generate e-Kinerja
        </Button>
      </div>

      {/* Tabs for Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-xl p-1">
          <TabsTrigger 
            value="remunerasi" 
            data-testid="tab-remunerasi"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            e-Remunerasi
          </TabsTrigger>
          <TabsTrigger 
            value="kinerja"
            data-testid="tab-kinerja"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            e-Kinerja ({kinerjaPoints.length} poin)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="remunerasi" className="mt-4">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">Hasil e-Remunerasi</CardTitle>
                {remunerasiText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(remunerasiText, 'e-Remunerasi')}
                    data-testid="btn-copy-remunerasi"
                    className="rounded-full"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Salin Semua
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={remunerasiText}
                onChange={(e) => setRemunerasiText(e.target.value)}
                placeholder="Hasil generate e-Remunerasi akan muncul di sini..."
                data-testid="textarea-remunerasi"
                className="min-h-[300px] font-mono text-sm"
                readOnly={!remunerasiText}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="kinerja" className="mt-4">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Hasil e-Kinerja
                </CardTitle>
                {kinerjaPoints.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllKinerja}
                    data-testid="btn-copy-all-kinerja"
                    className="rounded-full"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Salin Semua
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {kinerjaPoints.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Klik "Generate e-Kinerja" untuk membuat laporan</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {kinerjaPoints.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              Point {item.point}
                            </Badge>
                            <Badge className={`${getCategoryColor(item.category)} border text-xs`}>
                              {item.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.text, `Point ${item.point}`)}
                            data-testid={`btn-copy-point-${item.point}`}
                            className="h-8 px-2"
                          >
                            <ClipboardCopy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={item.text}
                          readOnly
                          className="min-h-[100px] text-sm bg-white resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneratorLaporanPage;

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { FileText, Copy, RefreshCw, Calendar, CheckCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Toggle labels mapping
const TINDAKAN_LABELS = {
  oksigenasi: 'OKSIGENASI',
  perawatan_luka_sederhana: 'PERAWATAN LUKA SEDERHANA',
  pre_pasca_op: 'PRE / PASCA OP',
  kompres_terbuka: 'KOMPRES TERBUKA',
  memasang_infus_baru: 'MEMASANG INFUS BARU',
  memberikan_cairan_infus: 'MEMBERIKAN CAIRAN INFUS',
  ngt: 'NGT',
  transfusi_darah: 'TRANSFUSI DARAH',
  injeksi: 'INJEKSI',
  nebu: 'NEBU',
  memasang_dc_kateter: 'MEMASANG DC/KATETER',
  koreksi_caglukonas: 'KOREKSI CAGlukonas',
  koreksi_kcl: 'KOREKSI KCL',
  uji_lab: 'UJI LAB',
  pasien_baru_pulang: 'PASIEN BARU/PASIEN PULANG',
};

const GeneratorLaporanPage = () => {
  const [logbook, setLogbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [remunerasiText, setRemunerasiText] = useState('');
  const [kinerjaText, setKinerjaText] = useState('');
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

  const handleGenerateRemun = async () => {
    if (!logbook || !logbook.daftar_tindakan?.length) {
      toast.error('Tidak ada data tindakan untuk hari ini');
      return;
    }

    setGenerating(true);
    
    try {
      // Generate e-Remunerasi format
      // Format: Combine patient info with keterangan
      let lines = [];
      
      logbook.daftar_tindakan.forEach((tindakan, idx) => {
        // Build keterangan text from checkboxes
        let keterangan = [];
        if (tindakan.keterangan_tindakan?.length > 0) {
          keterangan = [...tindakan.keterangan_tindakan];
        }
        
        // Add toggle actions that are true
        Object.keys(TINDAKAN_LABELS).forEach(key => {
          if (tindakan[key]) {
            keterangan.push(TINDAKAN_LABELS[key]);
          }
        });
        
        // Add catatan if exists
        if (tindakan.catatan_lainnya) {
          keterangan.push(tindakan.catatan_lainnya);
        }
        
        const keteranganText = keterangan.join(', ');
        
        // Format line
        const line = `${idx + 1}. ${tindakan.nama_pasien} (RM: ${tindakan.no_rm}${tindakan.no_billing ? `, Billing: ${tindakan.no_billing}` : ''}) - ${tindakan.diagnosa || 'Dx: -'}\n   Keterangan: ${keteranganText}`;
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
      // Generate e-Kinerja format
      // Different format focusing on actions performed
      let actionCounts = {};
      let patientList = [];
      
      logbook.daftar_tindakan.forEach((tindakan) => {
        patientList.push(`- ${tindakan.nama_pasien} (${tindakan.no_rm})`);
        
        // Count toggle actions
        Object.keys(TINDAKAN_LABELS).forEach(key => {
          if (tindakan[key]) {
            actionCounts[TINDAKAN_LABELS[key]] = (actionCounts[TINDAKAN_LABELS[key]] || 0) + 1;
          }
        });
        
        // Count keterangan items
        tindakan.keterangan_tindakan?.forEach(ket => {
          actionCounts[ket] = (actionCounts[ket] || 0) + 1;
        });
      });
      
      const actionSummary = Object.entries(actionCounts)
        .map(([action, count]) => `- ${action}: ${count}x`)
        .join('\n');
      
      const header = `=== LAPORAN e-KINERJA ===\nTanggal: ${logbook.tanggal_dinas}\nShift: ${logbook.shift}\nJam Dinas: ${logbook.jam_datang} - ${logbook.jam_pulang}\n\n--- RINGKASAN TINDAKAN ---\n${actionSummary}\n\n--- DAFTAR PASIEN (${logbook.daftar_tindakan.length} orang) ---\n${patientList.join('\n')}`;
      
      setKinerjaText(header);
      setActiveTab('kinerja');
      toast.success('Laporan e-Kinerja berhasil di-generate');
    } catch (error) {
      toast.error('Gagal generate laporan');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Teks berhasil disalin ke clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

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
                <p className="text-sm text-slate-600">
                  Shift {logbook.shift} | {logbook.daftar_tindakan?.length || 0} pasien tercatat
                </p>
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
            e-Kinerja
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
                    onClick={() => copyToClipboard(remunerasiText)}
                    data-testid="btn-copy-remunerasi"
                    className="rounded-full"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Salin
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
                <CardTitle className="text-lg font-heading">Hasil e-Kinerja</CardTitle>
                {kinerjaText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(kinerjaText)}
                    data-testid="btn-copy-kinerja"
                    className="rounded-full"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Salin
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={kinerjaText}
                onChange={(e) => setKinerjaText(e.target.value)}
                placeholder="Hasil generate e-Kinerja akan muncul di sini..."
                data-testid="textarea-kinerja"
                className="min-h-[300px] font-mono text-sm"
                readOnly={!kinerjaText}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeneratorLaporanPage;

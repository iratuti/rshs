'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Database, Plus, FileDown, FileUp, Printer, Search, Edit, Trash2, Loader2, Upload, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { validateForm, PatientValidationSchema } from '@/lib/validation';

interface Patient {
  patient_id: string;
  nama_pasien: string;
  no_rm: string;
  no_billing?: string;
  diagnosa?: string;
}

export default function MasterDataPasienPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nama_pasien: '',
    no_rm: '',
    no_billing: '',
    diagnosa: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate form
    const validation = validateForm(formData, PatientValidationSchema);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }
    setFormErrors({});

    setSaving(true);
    try {
      const method = editingPatient ? 'PUT' : 'POST';
      const url = editingPatient ? `/api/patients/${editingPatient.patient_id}` : '/api/patients';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const patient = await response.json();
        if (editingPatient) {
          setPatients(patients.map(p => p.patient_id === patient.patient_id ? patient : p));
          toast.success('Pasien berhasil diperbarui');
        } else {
          setPatients([...patients, patient]);
          toast.success('Pasien berhasil ditambahkan');
        }
        resetForm();
      }
    } catch (error) {
      toast.error('Gagal menyimpan pasien');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Yakin ingin menghapus pasien ini?')) return;

    try {
      const response = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      if (response.ok) {
        setPatients(patients.filter(p => p.patient_id !== patientId));
        toast.success('Pasien berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pasien');
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      nama_pasien: patient.nama_pasien,
      no_rm: patient.no_rm,
      no_billing: patient.no_billing || '',
      diagnosa: patient.diagnosa || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({ nama_pasien: '', no_rm: '', no_billing: '', diagnosa: '' });
    setFormErrors({});
    setEditingPatient(null);
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    if (filteredPatients.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    setExporting(true);
    try {
      const csvData = filteredPatients.map((p, idx) => ({
        'No': idx + 1,
        'Nama Pasien': p.nama_pasien,
        'No. RM': p.no_rm,
        'No. Billing': p.no_billing || '',
        'Diagnosa': p.diagnosa || ''
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `master-data-pasien-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Export CSV berhasil!');
    } catch (error) {
      toast.error('Gagal export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const importedPatients = results.data as Record<string, string>[];
          let successCount = 0;
          let errorCount = 0;

          for (const row of importedPatients) {
            const patientData = {
              nama_pasien: row['Nama Pasien'] || row['nama_pasien'] || '',
              no_rm: row['No. RM'] || row['no_rm'] || '',
              no_billing: row['No. Billing'] || row['no_billing'] || '',
              diagnosa: row['Diagnosa'] || row['diagnosa'] || ''
            };

            if (!patientData.nama_pasien || !patientData.no_rm) {
              errorCount++;
              continue;
            }

            try {
              const response = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData)
              });
              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch {
              errorCount++;
            }
          }

          await fetchPatients();
          toast.success(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`);
          setShowImportModal(false);
        } catch (error) {
          toast.error('Gagal mengimport data');
        } finally {
          setImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: () => {
        toast.error('Gagal membaca file CSV');
        setImporting(false);
      }
    });
  };

  const handleExportPDF = () => {
    if (filteredPatients.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MASTER DATA PASIEN', doc.internal.pageSize.width / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

      // Table data
      const tableData = filteredPatients.map((p, idx) => [
        (idx + 1).toString(),
        p.nama_pasien,
        p.no_rm,
        p.no_billing || '-',
        (p.diagnosa || '-').substring(0, 40) + ((p.diagnosa?.length || 0) > 40 ? '...' : '')
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['No', 'Nama Pasien', 'No. RM', 'No. Billing', 'Diagnosa']],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
        doc.text(`Total: ${filteredPatients.length} pasien`, 15, doc.internal.pageSize.height - 10);
      }

      doc.save(`master-data-pasien-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF berhasil!');
    } catch (error) {
      toast.error('Gagal export PDF');
    } finally {
      setExporting(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.nama_pasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.no_rm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Master Data Pasien</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data pasien Anda</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) resetForm(); else setShowAddModal(true); }}>
          <DialogTrigger asChild>
            <Button data-testid="btn-tambah-pasien" className="bg-teal-600 hover:bg-teal-700 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pasien
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{editingPatient ? 'Edit Pasien' : 'Tambah Pasien Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_pasien">Nama Pasien *</Label>
                <Input id="nama_pasien" placeholder="Masukkan nama pasien" value={formData.nama_pasien} onChange={(e) => setFormData({...formData, nama_pasien: e.target.value})} data-testid="input-nama-pasien" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_rm">No. RM *</Label>
                <Input id="no_rm" placeholder="Masukkan nomor rekam medis" value={formData.no_rm} onChange={(e) => setFormData({...formData, no_rm: e.target.value})} data-testid="input-no-rm" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_billing">No. Billing</Label>
                <Input id="no_billing" placeholder="Masukkan nomor billing (opsional)" value={formData.no_billing} onChange={(e) => setFormData({...formData, no_billing: e.target.value})} data-testid="input-no-billing" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosa">Diagnosa</Label>
                <Textarea id="diagnosa" placeholder="Masukkan diagnosa (opsional)" value={formData.diagnosa} onChange={(e) => setFormData({...formData, diagnosa: e.target.value})} data-testid="input-diagnosa" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
              <Button onClick={handleSave} disabled={saving} data-testid="btn-simpan-pasien" className="bg-teal-600 hover:bg-teal-700">
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>) : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Cari nama atau No. RM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="input-search-pasien" className="pl-10 h-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="btn-import-csv" className="rounded-full">
                    <FileUp className="w-4 h-4 mr-1" />Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Data Pasien dari CSV</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-slate-600 mb-4">
                      Upload file CSV dengan kolom: <strong>Nama Pasien</strong>, <strong>No. RM</strong>, No. Billing, Diagnosa
                    </p>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-teal-600 hover:text-teal-700 font-medium">Pilih file CSV</span>
                        <span className="text-slate-500"> atau drag & drop</span>
                      </label>
                    </div>
                    {importing && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-teal-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengimport data...</span>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting || filteredPatients.length === 0} data-testid="btn-export-csv" className="rounded-full">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileDown className="w-4 h-4 mr-1" />}Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting || filteredPatients.length === 0} data-testid="btn-export-pdf" className="rounded-full">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Printer className="w-4 h-4 mr-1" />}Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card bg-white overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Data Pasien ({filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada data pasien</p>
              <p className="text-sm">Klik &quot;Tambah Pasien&quot; untuk menambahkan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nama Pasien</TableHead>
                    <TableHead>No. RM</TableHead>
                    <TableHead>No. Billing</TableHead>
                    <TableHead>Diagnosa</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient, idx) => (
                    <TableRow key={patient.patient_id} className="hover:bg-slate-50">
                      <TableCell className="text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{patient.nama_pasien}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{patient.no_rm}</Badge></TableCell>
                      <TableCell className="text-slate-600">{patient.no_billing || '-'}</TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate">{patient.diagnosa || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)} data-testid={`btn-edit-${patient.patient_id}`} className="h-8 w-8 text-slate-500 hover:text-teal-600">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(patient.patient_id)} data-testid={`btn-delete-${patient.patient_id}`} className="h-8 w-8 text-slate-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

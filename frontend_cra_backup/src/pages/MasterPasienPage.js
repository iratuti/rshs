import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Database, Plus, FileDown, Printer, Search, Edit, Trash2, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MasterPasienPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  
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
      const response = await fetch(`${API_URL}/api/patients`, {
        credentials: 'include'
      });
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
    if (!formData.nama_pasien || !formData.no_rm) {
      toast.error('Nama pasien dan No. RM wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const method = editingPatient ? 'PUT' : 'POST';
      const url = editingPatient 
        ? `${API_URL}/api/patients/${editingPatient.patient_id}`
        : `${API_URL}/api/patients`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const handleDelete = async (patientId) => {
    if (!window.confirm('Yakin ingin menghapus pasien ini?')) return;

    try {
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setPatients(patients.filter(p => p.patient_id !== patientId));
        toast.success('Pasien berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pasien');
    }
  };

  const handleEdit = (patient) => {
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
    setEditingPatient(null);
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    toast.info('Fitur Export CSV akan segera hadir');
  };

  const handleImportCSV = () => {
    toast.info('Fitur Import CSV akan segera hadir');
  };

  const handlePrint = () => {
    toast.info('Fitur Print PDF akan segera hadir');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Master Data Pasien</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data pasien Anda</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) resetForm(); else setShowAddModal(true); }}>
          <DialogTrigger asChild>
            <Button 
              data-testid="btn-tambah-pasien"
              className="bg-teal-600 hover:bg-teal-700 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pasien
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingPatient ? 'Edit Pasien' : 'Tambah Pasien Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_pasien">Nama Pasien *</Label>
                <Input
                  id="nama_pasien"
                  placeholder="Masukkan nama pasien"
                  value={formData.nama_pasien}
                  onChange={(e) => setFormData({...formData, nama_pasien: e.target.value})}
                  data-testid="input-nama-pasien"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_rm">No. RM *</Label>
                <Input
                  id="no_rm"
                  placeholder="Masukkan nomor rekam medis"
                  value={formData.no_rm}
                  onChange={(e) => setFormData({...formData, no_rm: e.target.value})}
                  data-testid="input-no-rm"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_billing">No. Billing</Label>
                <Input
                  id="no_billing"
                  placeholder="Masukkan nomor billing (opsional)"
                  value={formData.no_billing}
                  onChange={(e) => setFormData({...formData, no_billing: e.target.value})}
                  data-testid="input-no-billing"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosa">Diagnosa</Label>
                <Textarea
                  id="diagnosa"
                  placeholder="Masukkan diagnosa (opsional)"
                  value={formData.diagnosa}
                  onChange={(e) => setFormData({...formData, diagnosa: e.target.value})}
                  data-testid="input-diagnosa"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                data-testid="btn-simpan-pasien"
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Actions Bar */}
      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari nama atau No. RM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-pasien"
                className="pl-10 h-10"
              />
            </div>
            
            {/* Export/Import Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportCSV}
                data-testid="btn-import-csv"
                className="rounded-full"
              >
                <FileDown className="w-4 h-4 mr-1" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                data-testid="btn-export-csv"
                className="rounded-full"
              >
                <FileDown className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                data-testid="btn-print-pdf"
                className="rounded-full"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
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
              <p className="text-sm">Klik "Tambah Pasien" untuk menambahkan</p>
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
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {patient.no_rm}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {patient.no_billing || '-'}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate">
                        {patient.diagnosa || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(patient)}
                            data-testid={`btn-edit-${patient.patient_id}`}
                            className="h-8 w-8 text-slate-500 hover:text-teal-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(patient.patient_id)}
                            data-testid={`btn-delete-${patient.patient_id}`}
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                          >
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
};

export default MasterPasienPage;

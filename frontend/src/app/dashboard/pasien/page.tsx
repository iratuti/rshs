'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Database, Plus, FileDown, FileUp, Search, Edit, Trash2, Loader2, Upload, AlertCircle, Filter, X, Clock } from 'lucide-react';
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
  created_at?: string;
}

export default function MasterDataPasienPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [filterDiagnosa, setFilterDiagnosa] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nama_pasien: '',
    no_rm: '',
    no_billing: '',
    diagnosa: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        // Sort by created_at (newest first)
        const sorted = data.sort((a: Patient, b: Patient) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setPatients(sorted);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique diagnosa for filter dropdown
  const uniqueDiagnosa = useMemo(() => {
    const diagnosaSet = new Set<string>();
    patients.forEach(p => {
      if (p.diagnosa) {
        diagnosaSet.add(p.diagnosa);
      }
    });
    return Array.from(diagnosaSet).sort();
  }, [patients]);

  // Search suggestions for autocomplete - memoized to prevent unnecessary recalculations
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase();
    return patients
      .filter(p => 
        p.nama_pasien.toLowerCase().includes(query) ||
        p.no_rm.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, patients]);

  // Filtered patients - memoized
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = !searchQuery || 
        p.nama_pasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.no_rm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.no_billing && p.no_billing.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = filterDiagnosa === 'all' || p.diagnosa === filterDiagnosa;
      
      return matchesSearch && matchesFilter;
    });
  }, [patients, searchQuery, filterDiagnosa]);

  // Stable search change handler - using useCallback to prevent re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
    }
  }, [searchQuery]);

  const selectSuggestion = useCallback((patient: Patient) => {
    setSearchQuery(patient.nama_pasien);
    setShowSuggestions(false);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  const handleSave = async () => {
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
          setPatients([patient, ...patients]);
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

  const handleDelete = async (patient: Patient) => {
    if (!window.confirm(`Yakin ingin menghapus pasien ${patient.nama_pasien}?`)) return;

    try {
      const response = await fetch(`/api/patients/${patient.patient_id}`, { method: 'DELETE' });
      if (response.ok) {
        setPatients(patients.filter(p => p.patient_id !== patient.patient_id));
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
    setEditingPatient(null);
    setShowAddModal(false);
    setFormErrors({});
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const importedPatients = results.data as Record<string, string>[];
          let successCount = 0;
          
          for (const row of importedPatients) {
            const patientData = {
              nama_pasien: row['Nama Pasien'] || row['nama_pasien'] || '',
              no_rm: row['No. RM'] || row['no_rm'] || '',
              no_billing: row['No. Billing'] || row['no_billing'] || '',
              diagnosa: row['Diagnosa'] || row['diagnosa'] || ''
            };

            if (patientData.nama_pasien && patientData.no_rm) {
              try {
                const response = await fetch('/api/patients', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(patientData)
                });
                if (response.ok) successCount++;
              } catch (e) {
                console.error('Error importing patient:', e);
              }
            }
          }

          toast.success(`Berhasil import ${successCount} pasien`);
          fetchPatients();
          setShowImportModal(false);
        },
        error: (error) => {
          toast.error('Gagal membaca file CSV');
          console.error('CSV parse error:', error);
        }
      });
    } catch (error) {
      toast.error('Gagal import data');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        'No. Billing': p.no_billing || '-',
        'Diagnosa': p.diagnosa || '-',
        'Waktu Input': p.created_at ? formatTimestamp(p.created_at) : '-'
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

  const handleExportPDF = () => {
    if (filteredPatients.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Master Data Pasien', 14, 20);
      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

      const tableData = filteredPatients.map((p, idx) => [
        idx + 1,
        p.nama_pasien,
        p.no_rm,
        p.no_billing || '-',
        p.diagnosa || '-',
        p.created_at ? formatTimestamp(p.created_at) : '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Nama Pasien', 'No. RM', 'No. Billing', 'Diagnosa', 'Waktu Input']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [13, 148, 136] },
      });

      doc.save(`master-data-pasien-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF berhasil!');
    } catch (error) {
      toast.error('Gagal export PDF');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDiagnosa('all');
    setShowSuggestions(false);
  };

  // Format timestamp to user-friendly format
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
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
              <DialogDescription>Isi data pasien dengan lengkap</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_pasien">Nama Pasien *</Label>
                <Input 
                  id="nama_pasien" 
                  placeholder="Masukkan nama pasien" 
                  value={formData.nama_pasien} 
                  onChange={(e) => { setFormData({...formData, nama_pasien: e.target.value}); setFormErrors({...formErrors, nama_pasien: ''}); }} 
                  data-testid="input-nama-pasien" 
                  className={`h-12 ${formErrors.nama_pasien ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                />
                {formErrors.nama_pasien && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{formErrors.nama_pasien}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_rm">No. RM *</Label>
                <Input 
                  id="no_rm" 
                  placeholder="Masukkan nomor rekam medis" 
                  value={formData.no_rm} 
                  onChange={(e) => { setFormData({...formData, no_rm: e.target.value}); setFormErrors({...formErrors, no_rm: ''}); }} 
                  data-testid="input-no-rm" 
                  className={`h-12 ${formErrors.no_rm ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                />
                {formErrors.no_rm && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{formErrors.no_rm}
                  </p>
                )}
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
                <p className="text-xs text-slate-400">{formData.diagnosa?.length || 0}/500 karakter</p>
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search Input - Refactored to be stable without Popover */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input 
                ref={searchInputRef}
                placeholder="Cari nama pasien atau No. RM..." 
                value={searchQuery} 
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                data-testid="input-search-pasien" 
                className="pl-10 pr-8 h-10" 
                autoComplete="off"
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  <div className="p-2 text-xs text-slate-500 border-b">Saran</div>
                  {searchSuggestions.map((patient) => (
                    <button
                      key={patient.patient_id}
                      onClick={() => selectSuggestion(patient)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
                      type="button"
                    >
                      <span className="font-medium text-sm">{patient.nama_pasien}</span>
                      <span className="text-xs text-slate-500">RM: {patient.no_rm}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {/* Filter by Diagnosa */}
              <Select value={filterDiagnosa} onValueChange={setFilterDiagnosa}>
                <SelectTrigger className="w-40 h-10" data-testid="filter-diagnosa">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter Diagnosa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Diagnosa</SelectItem>
                  {uniqueDiagnosa.map((d) => (
                    <SelectItem key={d} value={d}>{d.length > 20 ? d.substring(0, 20) + '...' : d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchQuery || filterDiagnosa !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}

              <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="btn-import-csv" className="rounded-full">
                    <FileUp className="w-4 h-4 mr-1" />Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading">Import Data Pasien</DialogTitle>
                    <DialogDescription>Upload file CSV dengan format yang sesuai</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                      <input type="file" ref={fileInputRef} accept=".csv" onChange={handleImportCSV} className="hidden" id="csv-upload" />
                      <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-teal-600 font-medium hover:underline">Pilih file CSV</span>
                        <p className="text-xs text-slate-400 mt-1">Format: Nama Pasien, No. RM, No. Billing, Diagnosa</p>
                      </label>
                    </div>
                    {importing && (
                      <div className="flex items-center justify-center gap-2 text-teal-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengimport data...</span>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting} data-testid="btn-export-csv" className="rounded-full">
                <FileDown className="w-4 h-4 mr-1" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} data-testid="btn-export-pdf" className="rounded-full">
                <FileDown className="w-4 h-4 mr-1" />PDF
              </Button>
            </div>
          </div>

          {/* Active filters display */}
          {(searchQuery || filterDiagnosa !== 'all') && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Cari: {searchQuery}
                  <button onClick={clearSearch} className="ml-1"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {filterDiagnosa !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Diagnosa: {filterDiagnosa.length > 15 ? filterDiagnosa.substring(0, 15) + '...' : filterDiagnosa}
                  <button onClick={() => setFilterDiagnosa('all')} className="ml-1"><X className="w-3 h-3" /></button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-0">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{searchQuery || filterDiagnosa !== 'all' ? 'Tidak ada pasien yang cocok dengan filter' : 'Belum ada data pasien'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Nama Pasien</TableHead>
                    <TableHead>No. RM</TableHead>
                    <TableHead>No. Billing</TableHead>
                    <TableHead>Diagnosa</TableHead>
                    <TableHead className="w-36">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Waktu Input
                      </div>
                    </TableHead>
                    <TableHead className="w-24 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient, idx) => (
                    <TableRow key={patient.patient_id} className="hover:bg-slate-50">
                      <TableCell className="text-center text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{patient.nama_pasien}</TableCell>
                      <TableCell className="font-mono text-sm">{patient.no_rm}</TableCell>
                      <TableCell className="text-slate-600">{patient.no_billing || '-'}</TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate">{patient.diagnosa || '-'}</TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {patient.created_at ? formatTimestamp(patient.created_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)} className="h-8 w-8" data-testid={`btn-edit-${patient.patient_id}`}>
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(patient)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" data-testid={`btn-delete-${patient.patient_id}`}>
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

      <div className="text-sm text-slate-500 text-center">
        Menampilkan {filteredPatients.length} dari {patients.length} pasien
      </div>
    </div>
  );
}

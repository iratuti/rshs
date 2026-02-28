'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Plus, User, Calendar, Trash2, Eye, Pencil, AlertTriangle, ChevronsUpDown, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Patient {
  patient_id: string;
  nama_pasien: string;
  no_rm: string;
  no_billing?: string;
  diagnosa?: string;
}

interface TindakanItem {
  patient_id: string;
  nama_pasien: string;
  no_rm: string;
  no_billing?: string;
  diagnosa?: string;
  jenis_pasien: string;
  ketergantungan: string;
  keterangan_tindakan: string[];
  catatan_lainnya?: string;
  [key: string]: unknown;
}

interface Logbook {
  logbook_id: string;
  tanggal_dinas: string;
  shift: string;
  jam_datang: string;
  jam_pulang: string;
  daftar_tindakan: TindakanItem[];
}

const TINDAKAN_TOGGLES = [
  { key: 'oksigenasi', label: 'Oksigenasi' },
  { key: 'perawatan_luka_sederhana', label: 'Perawatan Luka Sederhana' },
  { key: 'pre_pasca_op', label: 'Pre / Pasca OP' },
  { key: 'kompres_terbuka', label: 'Kompres Terbuka' },
  { key: 'memasang_infus_baru', label: 'Memasang Infus Baru' },
  { key: 'memberikan_cairan_infus', label: 'Memberikan Cairan Infus' },
  { key: 'memasang_ngt', label: 'Memasang NGT' },
  { key: 'transfusi_darah', label: 'Transfusi Darah' },
  { key: 'nebu', label: 'Nebu' },
  { key: 'memasang_dc_kateter', label: 'Memasang DC/Kateter' },
  { key: 'koreksi_caglukonas', label: 'Koreksi CAGlukonas' },
  { key: 'koreksi_kcl', label: 'Koreksi KCL' },
  { key: 'uji_lab', label: 'Uji Lab' },
];

const STATUS_PASIEN_OPTIONS = [
  { value: 'PASIEN_BARU', label: 'Pasien Baru' },
  { value: 'PASIEN_LAMA', label: 'Pasien Lama' },
  { value: 'PASIEN_PULANG', label: 'Pasien Pulang' },
];

const KETERGANTUNGAN_OPTIONS = [
  { value: 'ADL_SELF_CARE', label: 'ADL Self Care' },
  { value: 'ADL_PARTIAL_CARE', label: 'ADL Partial Care' },
  { value: 'ADL_TOTAL_CARE', label: 'ADL Total Care' },
];

const KETERANGAN_OPTIONS = [
  'Assesment awal dan lanjutan serta memberikan edukasi pasien baru',
  'Observasi EWS per jam',
  'Observasi EWS per 4 jam',
  'Observasi EWS per 8 jam',
  'Memberikan obat',
  'Memberikan cairan infus',
  'Memberikan manajemen nyeri',
  'Cek lab',
  'Membantu makan peroral',
  'Membantu makan perNGT',
  'Membantu memasang sepre',
  'Membantu mengganti pampers',
  'Membuang urin pasien',
  'Membantu memandikan pasien',
  'Membantu melibatkan keluarga dalam perawatan pasien',
];

interface TindakanForm {
  jenis_pasien: string;
  ketergantungan: string;
  keterangan_tindakan: string[];
  catatan_lainnya: string;
  [key: string]: string | string[] | boolean;
}

const initialTindakanForm: TindakanForm = {
  jenis_pasien: 'PASIEN_LAMA',
  ketergantungan: 'ADL_PARTIAL_CARE',
  keterangan_tindakan: [] as string[],
  catatan_lainnya: '',
  ...Object.fromEntries(TINDAKAN_TOGGLES.map(t => [t.key, false]))
};

export default function InputLogbookPage() {
  const { user } = useAuth();
  const [logbook, setLogbook] = useState<Logbook | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftExists, setShiftExists] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [viewingTindakan, setViewingTindakan] = useState<TindakanItem | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ shift: 'PAGI', jam_datang: '07:00', jam_pulang: '14:00' });
  const [tindakanForm, setTindakanForm] = useState(initialTindakanForm);
  const [newPatient, setNewPatient] = useState({ nama_pasien: '', no_rm: '', no_billing: '', diagnosa: '' });

  useEffect(() => {
    fetchLogbookByDate(selectedDate);
    fetchPatients();
  }, [selectedDate]);

  const fetchLogbookByDate = async (date: string) => {
    setLoading(true);
    try {
      const month = parseInt(date.split('-')[1]);
      const year = parseInt(date.split('-')[0]);
      const response = await fetch(`/api/logbooks?month=${month}&year=${year}`);
      if (response.ok) {
        const logbooks: Logbook[] = await response.json();
        const found = logbooks.find(l => l.tanggal_dinas === date);
        if (found) {
          setLogbook(found);
          setFormData({ shift: found.shift, jam_datang: found.jam_datang, jam_pulang: found.jam_pulang });
          setShiftExists(true);
        } else {
          setLogbook(null);
          setFormData({ shift: 'PAGI', jam_datang: '07:00', jam_pulang: '14:00' });
          setShiftExists(false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveShiftInfo = async () => {
    setSaving(true);
    try {
      const method = logbook ? 'PUT' : 'POST';
      const url = logbook ? `/api/logbooks/${logbook.logbook_id}` : '/api/logbooks';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_dinas: selectedDate, ...formData, daftar_tindakan: logbook?.daftar_tindakan || [] })
      });
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
        setShiftExists(true);
        toast.success('Info Dinas berhasil disimpan');
        return data;
      }
    } catch (error) {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
    return null;
  };

  const isPatientDuplicate = useCallback((patientId: string) => {
    if (!logbook?.daftar_tindakan) return false;
    return logbook.daftar_tindakan.some((t, idx) => t.patient_id === patientId && idx !== editIndex);
  }, [logbook, editIndex]);

  const handleAddOrUpdateTindakan = async () => {
    if (!selectedPatient) {
      toast.error('Pilih pasien terlebih dahulu');
      return;
    }
    if (isPatientDuplicate(selectedPatient.patient_id)) {
      toast.error('Data pasien ini sudah di input pada tanggal ini.');
      return;
    }
    let currentLogbook = logbook;
    if (!logbook) {
      currentLogbook = await handleSaveShiftInfo();
      if (!currentLogbook) return;
    }
    const tindakan: TindakanItem = {
      patient_id: selectedPatient.patient_id,
      nama_pasien: selectedPatient.nama_pasien,
      no_rm: selectedPatient.no_rm,
      no_billing: selectedPatient.no_billing,
      diagnosa: selectedPatient.diagnosa,
      ...tindakanForm
    };
    let updatedTindakan: TindakanItem[];
    if (editIndex !== null) {
      updatedTindakan = [...(currentLogbook!.daftar_tindakan || [])];
      updatedTindakan[editIndex] = tindakan;
    } else {
      updatedTindakan = [...(currentLogbook!.daftar_tindakan || []), tindakan];
    }
    try {
      const response = await fetch(`/api/logbooks/${currentLogbook!.logbook_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_dinas: selectedDate, ...formData, daftar_tindakan: updatedTindakan })
      });
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
        setShowAddModal(false);
        resetTindakanForm();
        toast.success(editIndex !== null ? 'Berhasil diperbarui' : 'Berhasil ditambahkan');
      }
    } catch (error) {
      toast.error('Gagal menyimpan');
    }
  };

  const resetTindakanForm = () => {
    setSelectedPatient(null);
    setEditIndex(null);
    setTindakanForm(initialTindakanForm);
  };

  const handleDeleteTindakan = async (index: number) => {
    if (!logbook) return;
    const updatedTindakan = logbook.daftar_tindakan.filter((_, i) => i !== index);
    try {
      const response = await fetch(`/api/logbooks/${logbook.logbook_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_dinas: selectedDate, ...formData, daftar_tindakan: updatedTindakan })
      });
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
        toast.success('Berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus');
    }
  };

  const handleViewTindakan = (tindakan: TindakanItem) => {
    setViewingTindakan(tindakan);
    setShowViewModal(true);
  };

  const handleEditTindakan = (tindakan: TindakanItem, index: number) => {
    const patient = patients.find(p => p.patient_id === tindakan.patient_id) || {
      patient_id: tindakan.patient_id,
      nama_pasien: tindakan.nama_pasien,
      no_rm: tindakan.no_rm,
      no_billing: tindakan.no_billing,
      diagnosa: tindakan.diagnosa
    };
    setSelectedPatient(patient);
    setEditIndex(index);
    setTindakanForm({
      jenis_pasien: tindakan.jenis_pasien || 'PASIEN_LAMA',
      ketergantungan: tindakan.ketergantungan || 'ADL_PARTIAL_CARE',
      keterangan_tindakan: tindakan.keterangan_tindakan || [],
      catatan_lainnya: tindakan.catatan_lainnya || '',
      ...Object.fromEntries(TINDAKAN_TOGGLES.map(t => [t.key, tindakan[t.key] || false]))
    });
    setShowAddModal(true);
  };

  const handleCreatePatient = async () => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      if (response.ok) {
        const patient = await response.json();
        setPatients([...patients, patient]);
        setSelectedPatient(patient);
        setShowPatientModal(false);
        setNewPatient({ nama_pasien: '', no_rm: '', no_billing: '', diagnosa: '' });
        toast.success('Pasien berhasil ditambahkan');
      }
    } catch (error) {
      toast.error('Gagal menambahkan pasien');
    }
  };

  const toggleKeterangan = (option: string) => {
    setTindakanForm(prev => ({
      ...prev,
      keterangan_tindakan: prev.keterangan_tindakan.includes(option)
        ? prev.keterangan_tindakan.filter(k => k !== option)
        : [...prev.keterangan_tindakan, option]
    }));
  };

  const filteredPatients = patients.filter(p =>
    p.nama_pasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.no_rm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getJenisPasienBadge = (jenis: string) => {
    const colors: Record<string, string> = {
      'PASIEN_BARU': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'PASIEN_LAMA': 'bg-blue-50 text-blue-700 border-blue-200',
      'PASIEN_PULANG': 'bg-orange-50 text-orange-700 border-orange-200'
    };
    const labels: Record<string, string> = { 'PASIEN_BARU': 'Baru', 'PASIEN_LAMA': 'Lama', 'PASIEN_PULANG': 'Pulang' };
    return <Badge className={`${colors[jenis] || 'bg-slate-100'} border text-xs`}>{labels[jenis] || jenis}</Badge>;
  };

  const getKetergantunganLabel = (value: string) => {
    const option = KETERGANTUNGAN_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">Input Logbook</h1>
          <p className="text-slate-500 text-sm mt-0.5">Catat aktivitas harian Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="date-select" className="text-sm text-slate-600 whitespace-nowrap">Tanggal:</Label>
          <Input id="date-select" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} data-testid="input-tanggal-utama" className="h-9 w-40" />
        </div>
      </div>

      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-base md:text-lg font-heading flex items-center gap-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
            Info Dinas - {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="shift" className="text-sm">Shift</Label>
              <Select value={formData.shift} onValueChange={(v) => setFormData({...formData, shift: v})}>
                <SelectTrigger id="shift" data-testid="select-shift" className="h-10 md:h-12 text-sm"><SelectValue placeholder="Pilih shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGI">Pagi (07:00 - 14:00)</SelectItem>
                  <SelectItem value="SIANG">Siang (14:00 - 21:00)</SelectItem>
                  <SelectItem value="MALAM">Malam (21:00 - 07:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jam_datang" className="text-sm">Jam Datang</Label>
              <Input id="jam_datang" type="time" value={formData.jam_datang} onChange={(e) => setFormData({...formData, jam_datang: e.target.value})} data-testid="input-jam-datang" className="h-10 md:h-12 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jam_pulang" className="text-sm">Jam Pulang</Label>
              <Input id="jam_pulang" type="time" value={formData.jam_pulang} onChange={(e) => setFormData({...formData, jam_pulang: e.target.value})} data-testid="input-jam-pulang" className="h-10 md:h-12 text-sm" />
            </div>
          </div>
          <Button onClick={handleSaveShiftInfo} disabled={saving} data-testid="btn-simpan-logbook" className="w-full bg-teal-600 hover:bg-teal-700 h-10 md:h-12 rounded-xl text-sm md:text-base">
            {saving ? 'Menyimpan...' : (shiftExists ? 'Update Info Dinas' : 'Simpan Info Dinas')}
          </Button>
        </CardContent>
      </Card>

      {!shiftExists ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Silakan rekam data shift Anda untuk tanggal ini terlebih dahulu sebelum menambahkan catatan kegiatan.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="border-0 shadow-card bg-white">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg font-heading flex items-center gap-2">
                <User className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                Catatan Kegiatan ({logbook?.daftar_tindakan?.length || 0})
              </CardTitle>
              <Button size="sm" onClick={() => { resetTindakanForm(); setShowAddModal(true); }} data-testid="btn-tambah-tindakan" className="bg-orange-500 hover:bg-orange-600 rounded-full text-xs md:text-sm h-8 md:h-9">
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(!logbook?.daftar_tindakan || logbook.daftar_tindakan.length === 0) ? (
              <div className="text-center py-8 text-slate-400">
                <User className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada catatan kegiatan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logbook.daftar_tindakan.map((tindakan, idx) => (
                  <div key={idx} className="p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm md:text-base">{tindakan.nama_pasien}</h4>
                          {getJenisPasienBadge(tindakan.jenis_pasien)}
                          {tindakan.ketergantungan && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 border text-xs">
                              {getKetergantunganLabel(tindakan.ketergantungan)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-slate-500">RM: {tindakan.no_rm}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {TINDAKAN_TOGGLES.filter(t => tindakan[t.key]).map(t => (
                            <Badge key={t.key} variant="secondary" className="text-[10px] md:text-xs bg-teal-50 text-teal-700">{t.label}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleViewTindakan(tindakan)} data-testid={`btn-view-tindakan-${idx}`} className="text-slate-400 hover:text-blue-500 h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditTindakan(tindakan, idx)} data-testid={`btn-edit-tindakan-${idx}`} className="text-slate-400 hover:text-amber-500 h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTindakan(idx)} data-testid={`btn-delete-tindakan-${idx}`} className="text-slate-400 hover:text-red-500 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetTindakanForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col mx-4 sm:mx-auto p-0">
          <DialogHeader className="p-4 pb-2 shrink-0">
            <DialogTitle className="font-heading text-base md:text-lg">{editIndex !== null ? 'Edit Catatan Kegiatan' : 'Tambah Catatan Kegiatan'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pilih Pasien *</Label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" data-testid="btn-pilih-pasien" className="w-full justify-between h-10 md:h-12 text-sm" disabled={editIndex !== null}>
                      {selectedPatient ? `${selectedPatient.nama_pasien} (${selectedPatient.no_rm})` : "Cari pasien..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari nama atau No. RM..." value={searchQuery} onValueChange={setSearchQuery} />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 text-center">
                            <p className="text-sm text-slate-500 mb-2">Pasien tidak ditemukan</p>
                            <Button size="sm" variant="outline" onClick={() => { setPatientSearchOpen(false); setShowPatientModal(true); }}><Plus className="w-4 h-4 mr-1" />Tambah Pasien Baru</Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredPatients.map((patient) => (
                            <CommandItem key={patient.patient_id} value={patient.nama_pasien} onSelect={() => { setSelectedPatient(patient); setPatientSearchOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${selectedPatient?.patient_id === patient.patient_id ? "opacity-100" : "opacity-0"}`} />
                              <div><p className="font-medium text-sm">{patient.nama_pasien}</p><p className="text-xs text-slate-500">RM: {patient.no_rm}</p></div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status Pasien *</Label>
                <RadioGroup value={tindakanForm.jenis_pasien} onValueChange={(v) => setTindakanForm({...tindakanForm, jenis_pasien: v})} className="flex flex-wrap gap-3">
                  {STATUS_PASIEN_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                      <Label htmlFor={`status-${option.value}`} className="text-sm cursor-pointer font-normal">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ketergantungan *</Label>
                <RadioGroup value={tindakanForm.ketergantungan} onValueChange={(v) => setTindakanForm({...tindakanForm, ketergantungan: v})} className="flex flex-wrap gap-3">
                  {KETERGANTUNGAN_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`ketergantungan-${option.value}`} />
                      <Label htmlFor={`ketergantungan-${option.value}`} className="text-sm cursor-pointer font-normal">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Keterangan Tindakan</Label>
                <div className="grid gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl">
                  {KETERANGAN_OPTIONS.map((option, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <Checkbox id={`ket-${idx}`} checked={tindakanForm.keterangan_tindakan.includes(option)} onCheckedChange={() => toggleKeterangan(option)} className="mt-0.5" />
                      <label htmlFor={`ket-${idx}`} className="text-xs text-slate-700 leading-tight cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan" className="text-sm font-medium">Catatan Tambahan</Label>
                <Textarea id="catatan" placeholder="Tuliskan catatan tambahan..." value={tindakanForm.catatan_lainnya} onChange={(e) => setTindakanForm({...tindakanForm, catatan_lainnya: e.target.value})} className="min-h-[60px] text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tindakan Spesifik (13 Item)</Label>
                <div className="grid gap-2">
                  {TINDAKAN_TOGGLES.map((toggle, idx) => (
                    <div key={toggle.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                      <Label htmlFor={toggle.key} className="text-xs md:text-sm cursor-pointer flex-1"><span className="text-slate-400 mr-2">{idx + 1}.</span>{toggle.label}</Label>
                      <Switch id={toggle.key} checked={!!tindakanForm[toggle.key]} onCheckedChange={(checked) => setTindakanForm({...tindakanForm, [toggle.key]: checked})} className="data-[state=checked]:bg-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 pt-2 shrink-0 border-t gap-2">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetTindakanForm(); }} className="flex-1 sm:flex-none">Batal</Button>
            <Button onClick={handleAddOrUpdateTindakan} data-testid="btn-simpan-tindakan" className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none">{editIndex !== null ? 'Update' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-heading">Detail Catatan Kegiatan</DialogTitle></DialogHeader>
          {viewingTindakan && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{viewingTindakan.nama_pasien}</h3>
                {getJenisPasienBadge(viewingTindakan.jenis_pasien)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">No. RM</p><p className="font-medium">{viewingTindakan.no_rm}</p></div>
                <div><p className="text-slate-500">Ketergantungan</p><p className="font-medium">{getKetergantunganLabel(viewingTindakan.ketergantungan)}</p></div>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-2">Tindakan Spesifik:</p>
                <div className="flex flex-wrap gap-1">
                  {TINDAKAN_TOGGLES.filter(t => viewingTindakan[t.key]).map(t => (
                    <Badge key={t.key} className="bg-teal-50 text-teal-700 text-xs">{t.label}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowViewModal(false)}>Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Patient Modal */}
      <Dialog open={showPatientModal} onOpenChange={setShowPatientModal}>
        <DialogContent className="mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-heading">Tambah Pasien Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama_pasien" className="text-sm">Nama Pasien *</Label>
              <Input id="nama_pasien" value={newPatient.nama_pasien} onChange={(e) => setNewPatient({...newPatient, nama_pasien: e.target.value})} className="h-10 md:h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_rm" className="text-sm">No. RM *</Label>
              <Input id="no_rm" value={newPatient.no_rm} onChange={(e) => setNewPatient({...newPatient, no_rm: e.target.value})} className="h-10 md:h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosa" className="text-sm">Diagnosa</Label>
              <Textarea id="diagnosa" value={newPatient.diagnosa} onChange={(e) => setNewPatient({...newPatient, diagnosa: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPatientModal(false)}>Batal</Button>
            <Button onClick={handleCreatePatient} className="bg-teal-600 hover:bg-teal-700" disabled={!newPatient.nama_pasien || !newPatient.no_rm}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

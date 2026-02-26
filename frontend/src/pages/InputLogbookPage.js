import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, User, Clock, Calendar, Trash2, Edit, Check, ChevronsUpDown } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// 15 Toggle Actions
const TINDAKAN_TOGGLES = [
  { key: 'oksigenasi', label: 'Oksigenasi' },
  { key: 'perawatan_luka_sederhana', label: 'Perawatan Luka Sederhana' },
  { key: 'pre_pasca_op', label: 'Pre/Pasca OP' },
  { key: 'kompres_terbuka', label: 'Kompres Terbuka' },
  { key: 'memasang_infus_baru', label: 'Memasang Infus Baru' },
  { key: 'memberikan_cairan_infus', label: 'Memberikan Cairan Infus' },
  { key: 'ngt', label: 'NGT' },
  { key: 'transfusi_darah', label: 'Transfusi Darah' },
  { key: 'injeksi', label: 'Injeksi' },
  { key: 'nebu', label: 'Nebu' },
  { key: 'memasang_dc_kateter', label: 'Memasang DC/Kateter' },
  { key: 'koreksi_caglukonas', label: 'Koreksi CAGlukonas' },
  { key: 'koreksi_kcl', label: 'Koreksi KCL' },
  { key: 'uji_lab', label: 'Uji Lab' },
  { key: 'pasien_baru_pulang', label: 'Pasien Baru/Pasien Pulang' },
];

// Keterangan Checkboxes
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

const InputLogbookPage = () => {
  const { user } = useAuth();
  const [logbook, setLogbook] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  
  // Form states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    tanggal_dinas: new Date().toISOString().split('T')[0],
    shift: 'PAGI',
    jam_datang: '07:00',
    jam_pulang: '14:00',
  });
  
  // Tindakan form
  const [tindakanForm, setTindakanForm] = useState({
    keterangan_tindakan: [],
    catatan_lainnya: '',
    ...Object.fromEntries(TINDAKAN_TOGGLES.map(t => [t.key, false]))
  });
  
  // New patient form
  const [newPatient, setNewPatient] = useState({
    nama_pasien: '',
    no_rm: '',
    no_billing: '',
    diagnosa: ''
  });

  useEffect(() => {
    fetchTodayLogbook();
    fetchPatients();
  }, []);

  const fetchTodayLogbook = async () => {
    try {
      const response = await fetch(`${API_URL}/api/logbooks/today`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setLogbook(data);
          setFormData({
            tanggal_dinas: data.tanggal_dinas,
            shift: data.shift,
            jam_datang: data.jam_datang,
            jam_pulang: data.jam_pulang,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching logbook:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const searchPatients = async (query) => {
    try {
      const response = await fetch(`${API_URL}/api/patients/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleCreatePatient = async () => {
    try {
      const response = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPatient)
      });
      
      if (response.ok) {
        const patient = await response.json();
        setPatients([...patients, patient]);
        setSelectedPatient(patient);
        setShowPatientModal(false);
        setNewPatient({ nama_pasien: '', no_rm: '', no_billing: '', diagnosa: '' });
        toast.success('Pasien baru berhasil ditambahkan');
      }
    } catch (error) {
      toast.error('Gagal menambahkan pasien');
    }
  };

  const handleSaveLogbook = async () => {
    setSaving(true);
    try {
      const method = logbook ? 'PUT' : 'POST';
      const url = logbook 
        ? `${API_URL}/api/logbooks/${logbook.logbook_id}`
        : `${API_URL}/api/logbooks`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          daftar_tindakan: logbook?.daftar_tindakan || []
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
        toast.success('Logbook berhasil disimpan');
      }
    } catch (error) {
      toast.error('Gagal menyimpan logbook');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTindakan = async () => {
    if (!selectedPatient) {
      toast.error('Pilih pasien terlebih dahulu');
      return;
    }

    // Create logbook first if doesn't exist
    if (!logbook) {
      await handleSaveLogbook();
    }

    const tindakan = {
      patient_id: selectedPatient.patient_id,
      nama_pasien: selectedPatient.nama_pasien,
      no_rm: selectedPatient.no_rm,
      no_billing: selectedPatient.no_billing,
      diagnosa: selectedPatient.diagnosa,
      ...tindakanForm
    };

    try {
      const response = await fetch(`${API_URL}/api/logbooks/${logbook?.logbook_id}/tindakan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tindakan)
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
        setShowAddModal(false);
        resetTindakanForm();
        toast.success('Tindakan berhasil ditambahkan');
      }
    } catch (error) {
      toast.error('Gagal menambahkan tindakan');
    }
  };

  const resetTindakanForm = () => {
    setSelectedPatient(null);
    setTindakanForm({
      keterangan_tindakan: [],
      catatan_lainnya: '',
      ...Object.fromEntries(TINDAKAN_TOGGLES.map(t => [t.key, false]))
    });
  };

  const handleDeleteTindakan = async (index) => {
    if (!logbook) return;
    
    const updatedTindakan = logbook.daftar_tindakan.filter((_, i) => i !== index);
    
    try {
      const response = await fetch(`${API_URL}/api/logbooks/${logbook.logbook_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          daftar_tindakan: updatedTindakan
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogbook(data);
        toast.success('Tindakan berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus tindakan');
    }
  };

  const toggleKeterangan = (option) => {
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
          <h1 className="text-2xl font-heading font-bold text-slate-900">Input Logbook</h1>
          <p className="text-slate-500 text-sm mt-1">Catat aktivitas harian Anda</p>
        </div>
      </div>

      {/* Shift Info Card */}
      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Info Dinas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Dinas</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal_dinas}
                onChange={(e) => setFormData({...formData, tanggal_dinas: e.target.value})}
                data-testid="input-tanggal"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select 
                value={formData.shift} 
                onValueChange={(v) => setFormData({...formData, shift: v})}
              >
                <SelectTrigger id="shift" data-testid="select-shift" className="h-12">
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGI">Pagi (07:00 - 14:00)</SelectItem>
                  <SelectItem value="SIANG">Siang (14:00 - 21:00)</SelectItem>
                  <SelectItem value="MALAM">Malam (21:00 - 07:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jam_datang">Jam Datang</Label>
              <Input
                id="jam_datang"
                type="time"
                value={formData.jam_datang}
                onChange={(e) => setFormData({...formData, jam_datang: e.target.value})}
                data-testid="input-jam-datang"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jam_pulang">Jam Pulang</Label>
              <Input
                id="jam_pulang"
                type="time"
                value={formData.jam_pulang}
                onChange={(e) => setFormData({...formData, jam_pulang: e.target.value})}
                data-testid="input-jam-pulang"
                className="h-12"
              />
            </div>
          </div>
          <Button 
            onClick={handleSaveLogbook} 
            disabled={saving}
            data-testid="btn-simpan-logbook"
            className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-xl"
          >
            {saving ? 'Menyimpan...' : 'Simpan Info Dinas'}
          </Button>
        </CardContent>
      </Card>

      {/* Tindakan List */}
      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Daftar Tindakan ({logbook?.daftar_tindakan?.length || 0})
            </CardTitle>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  data-testid="btn-tambah-tindakan"
                  className="bg-orange-500 hover:bg-orange-600 rounded-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-heading">Tambah Data Pasien</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-6 py-4">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                      <Label>Pilih Pasien *</Label>
                      <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={patientSearchOpen}
                            data-testid="btn-pilih-pasien"
                            className="w-full justify-between h-12"
                          >
                            {selectedPatient 
                              ? `${selectedPatient.nama_pasien} (${selectedPatient.no_rm})`
                              : "Cari pasien..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Cari nama atau No. RM..."
                              value={searchQuery}
                              onValueChange={setSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-4 text-center">
                                  <p className="text-sm text-slate-500 mb-2">Pasien tidak ditemukan</p>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setPatientSearchOpen(false);
                                      setShowPatientModal(true);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Tambah Pasien Baru
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredPatients.map((patient) => (
                                  <CommandItem
                                    key={patient.patient_id}
                                    value={patient.nama_pasien}
                                    onSelect={() => {
                                      setSelectedPatient(patient);
                                      setPatientSearchOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedPatient?.patient_id === patient.patient_id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div>
                                      <p className="font-medium">{patient.nama_pasien}</p>
                                      <p className="text-xs text-slate-500">RM: {patient.no_rm}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-teal-600"
                        onClick={() => setShowPatientModal(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Tambah pasien baru
                      </Button>
                    </div>

                    {/* Keterangan Checkboxes */}
                    <div className="space-y-3">
                      <Label>Keterangan Tindakan</Label>
                      <div className="grid gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-xl">
                        {KETERANGAN_OPTIONS.map((option, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <Checkbox
                              id={`ket-${idx}`}
                              checked={tindakanForm.keterangan_tindakan.includes(option)}
                              onCheckedChange={() => toggleKeterangan(option)}
                              data-testid={`checkbox-keterangan-${idx}`}
                            />
                            <label 
                              htmlFor={`ket-${idx}`}
                              className="text-sm text-slate-700 leading-tight cursor-pointer"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Catatan Lainnya */}
                    <div className="space-y-2">
                      <Label htmlFor="catatan">Yang Lain (Catatan Tambahan)</Label>
                      <Textarea
                        id="catatan"
                        placeholder="Tuliskan catatan tambahan jika ada..."
                        value={tindakanForm.catatan_lainnya}
                        onChange={(e) => setTindakanForm({...tindakanForm, catatan_lainnya: e.target.value})}
                        data-testid="textarea-catatan"
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Toggle Switches */}
                    <div className="space-y-3">
                      <Label>Tindakan Spesifik</Label>
                      <div className="grid gap-3">
                        {TINDAKAN_TOGGLES.map((toggle) => (
                          <div 
                            key={toggle.key}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                          >
                            <Label htmlFor={toggle.key} className="text-sm cursor-pointer">
                              {toggle.label}
                            </Label>
                            <Switch
                              id={toggle.key}
                              checked={tindakanForm[toggle.key]}
                              onCheckedChange={(checked) => 
                                setTindakanForm({...tindakanForm, [toggle.key]: checked})
                              }
                              data-testid={`switch-${toggle.key}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={handleAddTindakan}
                    data-testid="btn-simpan-tindakan"
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Simpan Tindakan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(!logbook?.daftar_tindakan || logbook.daftar_tindakan.length === 0) ? (
            <div className="text-center py-8 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada tindakan</p>
              <p className="text-sm">Klik "Tambah" untuk menambahkan data pasien</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logbook.daftar_tindakan.map((tindakan, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{tindakan.nama_pasien}</h4>
                      <p className="text-sm text-slate-500">
                        RM: {tindakan.no_rm} {tindakan.no_billing && `| Billing: ${tindakan.no_billing}`}
                      </p>
                      {tindakan.diagnosa && (
                        <p className="text-sm text-slate-600 mt-1">Dx: {tindakan.diagnosa}</p>
                      )}
                      {tindakan.keterangan_tindakan?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 mb-1">Keterangan:</p>
                          <p className="text-sm text-slate-700">
                            {tindakan.keterangan_tindakan.join(', ')}
                          </p>
                        </div>
                      )}
                      {tindakan.catatan_lainnya && (
                        <p className="text-sm text-slate-600 mt-1 italic">
                          Catatan: {tindakan.catatan_lainnya}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {TINDAKAN_TOGGLES.filter(t => tindakan[t.key]).map(t => (
                          <Badge key={t.key} variant="secondary" className="text-xs bg-teal-50 text-teal-700">
                            {t.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTindakan(idx)}
                      data-testid={`btn-delete-tindakan-${idx}`}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Patient Modal */}
      <Dialog open={showPatientModal} onOpenChange={setShowPatientModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Tambah Pasien Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama_pasien">Nama Pasien *</Label>
              <Input
                id="nama_pasien"
                value={newPatient.nama_pasien}
                onChange={(e) => setNewPatient({...newPatient, nama_pasien: e.target.value})}
                data-testid="input-nama-pasien"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_rm">No. RM *</Label>
              <Input
                id="no_rm"
                value={newPatient.no_rm}
                onChange={(e) => setNewPatient({...newPatient, no_rm: e.target.value})}
                data-testid="input-no-rm"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_billing">No. Billing</Label>
              <Input
                id="no_billing"
                value={newPatient.no_billing}
                onChange={(e) => setNewPatient({...newPatient, no_billing: e.target.value})}
                data-testid="input-no-billing"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosa">Diagnosa</Label>
              <Textarea
                id="diagnosa"
                value={newPatient.diagnosa}
                onChange={(e) => setNewPatient({...newPatient, diagnosa: e.target.value})}
                data-testid="input-diagnosa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatientModal(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleCreatePatient}
              data-testid="btn-simpan-pasien"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!newPatient.nama_pasien || !newPatient.no_rm}
            >
              Simpan Pasien
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InputLogbookPage;

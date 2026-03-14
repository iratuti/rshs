'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Ticket, 
  Percent,
  Calendar,
  Users,
  RefreshCw,
  Loader2,
  Search
} from 'lucide-react';

interface PromoCode {
  code: string;
  discountPercentage: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
  description?: string;
  created_at: string;
}

export default function AdminPromoCodesPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 10,
    maxUses: 100,
    expiresAt: '',
    description: '',
    isActive: true,
  });
  
  // Check if user is super admin (theomahrizal@gmail.com)
  const isSuperAdmin = user?.email === 'admin@demo.com' || user?.email === 'theomahrizal@gmail.com';
  
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin) {
      fetchPromoCodes();
    }
  }, [authLoading, isAdmin, router]);
  
  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/promo', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Gagal memuat data promo codes');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreate = async () => {
    if (!formData.code || !formData.expiresAt) {
      toast.error('Kode dan tanggal expired wajib diisi');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Promo code berhasil dibuat');
        setShowCreateModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Gagal membuat promo code');
      }
    } catch (error) {
      toast.error('Gagal membuat promo code');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!selectedCode) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/promo/${selectedCode.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          discountPercentage: formData.discountPercentage,
          maxUses: formData.maxUses,
          expiresAt: formData.expiresAt,
          isActive: formData.isActive,
          description: formData.description,
        }),
      });
      
      if (response.ok) {
        toast.success('Promo code berhasil diupdate');
        setShowEditModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Gagal mengupdate promo code');
      }
    } catch (error) {
      toast.error('Gagal mengupdate promo code');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (code: string) => {
    if (!window.confirm(`Yakin ingin menghapus promo code ${code}?`)) return;
    
    try {
      const response = await fetch(`/api/promo/${code}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast.success('Promo code berhasil dihapus');
        fetchPromoCodes();
      } else {
        toast.error('Gagal menghapus promo code');
      }
    } catch (error) {
      toast.error('Gagal menghapus promo code');
    }
  };
  
  const handleToggleActive = async (promoCode: PromoCode) => {
    try {
      const response = await fetch(`/api/promo/${promoCode.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !promoCode.isActive }),
      });
      
      if (response.ok) {
        toast.success(`Promo code ${promoCode.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchPromoCodes();
      }
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };
  
  const openEditModal = (promoCode: PromoCode) => {
    setSelectedCode(promoCode);
    setFormData({
      code: promoCode.code,
      discountPercentage: promoCode.discountPercentage,
      maxUses: promoCode.maxUses,
      expiresAt: promoCode.expiresAt.split('T')[0],
      description: promoCode.description || '',
      isActive: promoCode.isActive,
    });
    setShowEditModal(true);
  };
  
  const resetForm = () => {
    setFormData({
      code: '',
      discountPercentage: 10,
      maxUses: 100,
      expiresAt: '',
      description: '',
      isActive: true,
    });
    setSelectedCode(null);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  const filteredCodes = promoCodes.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Stats
  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(c => c.isActive).length,
    expired: promoCodes.filter(c => new Date(c.expiresAt) < new Date()).length,
    totalUsage: promoCodes.reduce((sum, c) => sum + c.currentUses, 0),
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }
  
  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Akses Ditolak</h1>
        <p className="text-slate-500">Hanya Super Admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Manajemen Promo Code</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola kode promosi untuk diskon langganan</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPromoCodes} variant="outline" size="icon" data-testid="btn-refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowCreateModal(true)} data-testid="btn-create-promo" className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Buat Promo
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <Ticket className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Promo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Percent className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-slate-500">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-xs text-slate-500">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
                <p className="text-xs text-slate-500">Total Pemakaian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Cari kode promo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="search-promo"
        />
      </div>
      
      {/* Table */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Penggunaan</TableHead>
                <TableHead>Expired</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {searchQuery ? 'Tidak ada promo code yang cocok' : 'Belum ada promo code'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => {
                  const isExpired = new Date(code.expiresAt) < new Date();
                  const usagePercent = (code.currentUses / code.maxUses) * 100;
                  
                  return (
                    <TableRow key={code.code}>
                      <TableCell>
                        <div>
                          <p className="font-mono font-bold">{code.code}</p>
                          {code.description && (
                            <p className="text-xs text-slate-500">{code.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-teal-100 text-teal-700 border-0">
                          {code.discountPercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{code.currentUses} / {code.maxUses}</p>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className={isExpired ? 'text-red-600' : 'text-slate-600'}>
                          {formatDate(code.expiresAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={code.isActive && !isExpired}
                          onCheckedChange={() => handleToggleActive(code)}
                          disabled={isExpired}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(code)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(code.code)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Buat Promo Code Baru</DialogTitle>
            <DialogDescription>Buat kode promosi untuk diskon langganan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Promo</Label>
              <Input
                id="code"
                placeholder="PROMO2024"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                data-testid="input-promo-code"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Diskon (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                  data-testid="input-discount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Maks. Penggunaan</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                  data-testid="input-max-uses"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Tanggal Expired</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                data-testid="input-expires"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Input
                id="description"
                placeholder="Promo akhir tahun"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={submitting} data-testid="btn-submit-promo" className="bg-teal-600 hover:bg-teal-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Buat Promo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Promo Code</DialogTitle>
            <DialogDescription>Edit kode promo: {selectedCode?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discount">Diskon (%)</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxUses">Maks. Penggunaan</Label>
                <Input
                  id="edit-maxUses"
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiresAt">Tanggal Expired</Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Aktif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

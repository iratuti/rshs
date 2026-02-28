'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Building, Save, LogOut, CreditCard, HelpCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    ruangan_rs: user?.ruangan_rs || ''
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!user?.status_langganan) return null;
    const status = user.status_langganan;
    const variants: { [key: string]: string } = {
      TRIAL: 'bg-amber-50 text-amber-700 border-amber-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      EXPIRED: 'bg-red-50 text-red-700 border-red-200'
    };
    return (<Badge className={`${variants[status]} border`}>{status}</Badge>);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Profil</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-semibold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            Informasi Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} data-testid="input-name" className="h-12 pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input id="email" value={user?.email || ''} disabled className="h-12 pl-10 bg-slate-50" />
            </div>
            <p className="text-xs text-slate-400">Email tidak dapat diubah</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruangan">Ruangan RS</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input id="ruangan" placeholder="Contoh: ICU, IGD, Rawat Inap" value={formData.ruangan_rs} onChange={(e) => setFormData({...formData, ruangan_rs: e.target.value})} data-testid="input-ruangan" className="h-12 pl-10" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} data-testid="btn-simpan-profil" className="w-full h-12 bg-teal-600 hover:bg-teal-700 rounded-xl">
            {saving ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Menyimpan...</>) : (<><Save className="w-5 h-5 mr-2" />Simpan Perubahan</>)}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-card bg-white cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => router.push('/dashboard/billing')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600"><CreditCard className="w-5 h-5" /></div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Billing</p>
              <p className="text-xs text-slate-500">Kelola langganan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card bg-white cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => router.push('/dashboard/support')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600"><HelpCircle className="w-5 h-5" /></div>
            <div>
              <p className="font-medium text-slate-900 text-sm">Support</p>
              <p className="text-xs text-slate-500">Butuh bantuan?</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" onClick={logout} data-testid="btn-logout" className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 rounded-xl">
        <LogOut className="w-5 h-5 mr-2" />
        Keluar dari Akun
      </Button>
    </div>
  );
}

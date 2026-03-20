'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Users, UserCheck, Clock, MessageSquare, ArrowRight, AlertTriangle, 
  Loader2, Database, Pencil, CalendarIcon, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface UserData {
  user_id: string;
  email: string;
  name: string;
  role: string;
  status_langganan: string;
  berlaku_sampai?: string;
}

interface TicketData {
  ticket_id: string;
  status: string;
}

const SUPER_ADMIN_EMAIL = 'theomahrizal@gmail.com';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === 'ADMIN';

  useEffect(() => {
    fetchUsers();
    fetchTickets();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/admin/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRecoverData = async () => {
    if (!confirm('Apakah Anda yakin ingin memulihkan data iratuti66@gmail.com?\n\nIni akan memindahkan semua data orphan (demo_user_001, demo_196e6ae26d8f, dll) ke akun iratuti66@gmail.com.')) {
      return;
    }

    setRecovering(true);
    try {
      const response = await fetch('/api/admin/recover-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_user_ids: ['demo_user_001', 'demo_196e6ae26d8f'],
          target_email: 'iratuti66@gmail.com',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Data Recovery berhasil! Logbooks: ${data.logbooks_migrated}, Patients: ${data.patients_migrated}, Tickets: ${data.tickets_migrated}`);
        fetchUsers();
      } else {
        const err = await response.json();
        toast.error(`Gagal: ${err.detail || err.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setRecovering(false);
    }
  };

  const handleEditUser = (u: UserData) => {
    setEditingUser(u);
    setEditStatus(u.status_langganan || 'TRIAL');
    setEditDate(u.berlaku_sampai ? new Date(u.berlaku_sampai) : undefined);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { status_langganan: editStatus };
      if (editDate) {
        body.berlaku_sampai = editDate.toISOString();
      }

      const response = await fetch(`/api/admin/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(`Langganan ${editingUser.name || editingUser.email} berhasil diperbarui`);
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(`Gagal: ${err.detail || err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status_langganan === 'ACTIVE').length,
    trial: users.filter(u => u.status_langganan === 'TRIAL').length,
    expired: users.filter(u => u.status_langganan === 'EXPIRED').length,
  };

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN' || t.status === 'Open').length,
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900" data-testid="admin-dashboard-title">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola pengguna dan statistik</p>
      </div>

      {/* RECOVERY BUTTON - Only visible to Super Admin */}
      {isSuperAdmin && (
        <Card data-testid="recovery-card" className="border-2 border-amber-400 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 text-lg">Data Recovery Tool</p>
                  <p className="text-sm text-amber-700">Pulihkan data orphan milik iratuti66@gmail.com dari ID lama</p>
                </div>
              </div>
              <Button
                data-testid="recover-iratuti-btn"
                onClick={handleRecoverData}
                disabled={recovering}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 h-auto text-base shadow-md"
              >
                {recovering ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Memulihkan...</>
                ) : (
                  <><Database className="w-5 h-5 mr-2" />RECOVER IRATUTI PRODUCTION DATA</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card" data-testid="stat-card-total">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{userStats.total}</p>
                <p className="text-xs text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card" data-testid="stat-card-active">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{userStats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card" data-testid="stat-card-trial">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{userStats.trial}</p>
                <p className="text-xs text-slate-500">Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => router.push('/admin/tickets')} data-testid="stat-card-tickets">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ticketStats.open > 0 ? 'bg-red-100' : 'bg-purple-100'}`}>
                <MessageSquare className={`w-5 h-5 ${ticketStats.open > 0 ? 'text-red-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{ticketStats.open}</p>
                <p className="text-xs text-slate-500">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-card bg-gradient-to-br from-teal-50 to-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manajemen Tiket Support</p>
                <p className="text-sm text-slate-500">Lihat dan balas tiket dari pengguna</p>
              </div>
            </div>
            <Button onClick={() => router.push('/admin/tickets')} className="bg-teal-600 hover:bg-teal-700" data-testid="btn-manage-tickets">
              Kelola Tiket <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading">Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Memuat...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Berlaku Sampai</TableHead>
                    <TableHead className="w-20">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id} data-testid={`user-row-${u.user_id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          u.status_langganan === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          u.status_langganan === 'TRIAL' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {u.status_langganan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.berlaku_sampai ? formatDate(u.berlaku_sampai) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditUser(u)} 
                          data-testid={`btn-edit-user-${u.user_id}`}
                          className="h-8 w-8 text-slate-500 hover:text-teal-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Subscription Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          {editingUser && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">Edit Langganan</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {editingUser.name} ({editingUser.email})
                </p>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status Langganan</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="TRIAL">TRIAL</SelectItem>
                      <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Berlaku Sampai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="btn-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDate ? format(editDate, 'dd MMM yyyy', { locale: idLocale }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editDate}
                        onSelect={setEditDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditModal(false)} data-testid="btn-cancel-edit">
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveUser} 
                  disabled={saving} 
                  className="bg-teal-600 hover:bg-teal-700"
                  data-testid="btn-save-user"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Simpan</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

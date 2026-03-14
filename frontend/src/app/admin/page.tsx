'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Clock, MessageSquare, ArrowRight, AlertTriangle, Loader2, Database } from 'lucide-react';

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

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === 'ADMIN';

  useEffect(() => {
    fetchUsers();
    fetchTickets();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
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
      const response = await fetch('/api/tickets?all=true');
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
          source_user_ids: [
            'demo_user_001',
            'demo_196e6ae26d8f',
          ],
          target_email: 'iratuti66@gmail.com',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `DATA RECOVERY BERHASIL!\n\n` +
          `Logbooks dipulihkan: ${data.logbooks_migrated}\n` +
          `Patients dipulihkan: ${data.patients_migrated}\n` +
          `Tickets dipulihkan: ${data.tickets_migrated}\n\n` +
          `Target: ${data.target_email}\n` +
          `User ID: ${data.target_user_id}`
        );
        fetchUsers();
      } else {
        const err = await response.json();
        alert(`GAGAL: ${err.detail || err.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`ERROR: ${error}`);
    } finally {
      setRecovering(false);
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
    open: tickets.filter(t => t.status === 'OPEN').length,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Admin Dashboard</h1>
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
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memulihkan...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    RECOVER IRATUTI PRODUCTION DATA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card">
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
        <Card className="border-0 shadow-card">
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
        <Card className="border-0 shadow-card">
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
        <Card className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => router.push('/admin/tickets')}>
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
            <Button onClick={() => router.push('/admin/tickets')} className="bg-teal-600 hover:bg-teal-700">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
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
                        {u.berlaku_sampai ? new Date(u.berlaku_sampai).toLocaleDateString('id-ID') : '-'}
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

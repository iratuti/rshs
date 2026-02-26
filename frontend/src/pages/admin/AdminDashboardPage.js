import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Users, TrendingUp, Clock, MessageSquare } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_subscribers: 0,
    trial_users: 0,
    open_tickets: 0
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/users`, { credentials: 'include' })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      TRIAL: 'bg-amber-50 text-amber-700 border-amber-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      EXPIRED: 'bg-red-50 text-red-700 border-red-200'
    };
    return <Badge className={`${variants[status] || 'bg-slate-100'} border text-xs`}>{status}</Badge>;
  };

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.total_users, 
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      title: 'Active Subscribers', 
      value: stats.active_subscribers, 
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-600'
    },
    { 
      title: 'Trial Users', 
      value: stats.trial_users, 
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      title: 'Open Tickets', 
      value: stats.open_tickets, 
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600'
    },
  ];

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
        <h1 className="text-2xl font-heading font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview semua data pengguna</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-card bg-white">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-heading font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Semua Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Berlaku Sampai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>{getStatusBadge(user.status_langganan)}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {user.berlaku_sampai 
                        ? new Date(user.berlaku_sampai).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;

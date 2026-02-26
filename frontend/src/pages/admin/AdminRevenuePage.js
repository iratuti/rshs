import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';

const AdminRevenuePage = () => {
  // MOCK data - In production this would come from API
  const mockStats = {
    totalRevenue: 2500000,
    monthlyRevenue: 500000,
    activeSubscribers: 20,
    avgRevenuePerUser: 25000
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(mockStats.totalRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Sejak aplikasi diluncurkan'
    },
    {
      title: 'Revenue Bulan Ini',
      value: formatCurrency(mockStats.monthlyRevenue),
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
      description: 'Januari 2024'
    },
    {
      title: 'Active Subscribers',
      value: mockStats.activeSubscribers,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
      description: 'Pengguna berbayar'
    },
    {
      title: 'ARPU',
      value: formatCurrency(mockStats.avgRevenuePerUser),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600',
      description: 'Average Revenue Per User'
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Revenue</h1>
        <p className="text-slate-500 text-sm mt-1">Statistik pendapatan dan subscriber</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-card bg-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-heading font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Placeholder */}
      <Card className="border-0 shadow-card bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Grafik Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center">
            <div className="text-center text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Grafik revenue akan ditampilkan di sini</p>
              <p className="text-sm">Fitur dalam pengembangan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-0 shadow-card bg-amber-50">
        <CardContent className="p-4">
          <p className="text-sm text-amber-700">
            <strong>Note:</strong> Data di atas adalah MOCK data untuk demonstrasi. 
            Integrasi dengan Midtrans webhook akan mengupdate data ini secara real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenuePage;

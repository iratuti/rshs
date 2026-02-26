import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, AlertTriangle, Clock, Crown, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BillingPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getStatusInfo = () => {
    switch (user?.status_langganan) {
      case 'ACTIVE':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          bgColor: 'from-emerald-50 to-green-50',
          title: 'Langganan Aktif',
          description: 'Anda memiliki akses penuh ke semua fitur'
        };
      case 'TRIAL':
        return {
          icon: <Clock className="w-6 h-6" />,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          bgColor: 'from-amber-50 to-yellow-50',
          title: 'Masa Percobaan',
          description: 'Nikmati 7 hari trial gratis'
        };
      case 'EXPIRED':
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          color: 'bg-red-50 text-red-700 border-red-200',
          bgColor: 'from-red-50 to-orange-50',
          title: 'Langganan Expired',
          description: 'Perpanjang langganan untuk lanjut menggunakan'
        };
      default:
        return {
          icon: <CreditCard className="w-6 h-6" />,
          color: 'bg-slate-50 text-slate-700',
          bgColor: 'from-slate-50 to-gray-50',
          title: 'Status Tidak Diketahui',
          description: 'Silakan hubungi support'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billing/create-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // MOCK: In production, this would open Midtrans Snap
        toast.info('MOCK: Pembayaran akan diarahkan ke Midtrans', {
          description: 'Fitur pembayaran dalam tahap pengembangan'
        });
        console.log('Mock payment data:', data);
      }
    } catch (error) {
      toast.error('Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Billing & Langganan</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola langganan Anda</p>
      </div>

      {/* Status Card */}
      <Card className={`border-0 shadow-card bg-gradient-to-br ${statusInfo.bgColor}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${statusInfo.color} border`}>
              {statusInfo.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-slate-900">
                {statusInfo.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {statusInfo.description}
              </p>
              {user?.berlaku_sampai && (
                <p className="text-sm text-slate-500 mt-2">
                  Berlaku sampai: <span className="font-medium">{formatDate(user.berlaku_sampai)}</span>
                </p>
              )}
            </div>
            <Badge className={`${statusInfo.color} border`}>
              {user?.status_langganan}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      <Card className="border-0 shadow-card bg-white overflow-hidden">
        <CardHeader className="pb-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            <CardTitle className="text-lg font-heading">Paket Premium</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <p className="text-4xl font-heading font-bold text-slate-900">
              Rp 25.000
            </p>
            <p className="text-slate-500">/bulan</p>
          </div>
          
          <ul className="space-y-3 mb-6">
            {[
              'Akses penuh ke semua fitur',
              'Generate laporan unlimited',
              'Simpan data pasien unlimited',
              'Export PDF & CSV',
              'Support prioritas'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {(user?.status_langganan === 'TRIAL' || user?.status_langganan === 'EXPIRED') && (
            <Button
              onClick={handlePayment}
              disabled={loading}
              data-testid="btn-bayar"
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 rounded-xl font-heading font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Bayar Langganan
                </>
              )}
            </Button>
          )}

          {user?.status_langganan === 'ACTIVE' && (
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-emerald-700 font-medium">
                Langganan Anda aktif
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="border-0 shadow-card bg-slate-50">
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold text-slate-900 mb-3">
            Informasi Pembayaran
          </h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Pembayaran melalui Midtrans (QRIS, Transfer Bank, E-Wallet)</p>
            <p>• Langganan akan aktif otomatis setelah pembayaran berhasil</p>
            <p>• Berlaku selama 30 hari sejak tanggal pembayaran</p>
            <p>• Hubungi support jika ada kendala pembayaran</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;

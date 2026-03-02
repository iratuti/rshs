'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Crown, 
  Loader2, 
  Ticket,
  Sparkles,
  Check,
  X
} from 'lucide-react';

// Declare Snap type for TypeScript
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

// Pricing in IDR
const PRICING = {
  monthly: { price: 25000, label: 'Bulanan', period: '30 hari' },
  yearly: { price: 250000, label: 'Tahunan', period: '365 hari', save: '2 bulan gratis!' },
};

export default function BillingPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [snapLoaded, setSnapLoaded] = useState(false);
  
  // Check if user has VIP/lifetime access
  const isPremiumLifetime = session?.user?.isPremium && session?.user?.plan === 'lifetime';
  const userEmail = session?.user?.email || user?.email;
  const userName = session?.user?.name || user?.name;
  const userId = session?.user?.id || user?.user_id;
  
  // Calculate pricing
  const originalPrice = PRICING[selectedPlan].price;
  const discountAmount = Math.floor(originalPrice * (promoDiscount / 100));
  const finalPrice = originalPrice - discountAmount;
  
  const getStatusInfo = () => {
    if (isPremiumLifetime) {
      return {
        icon: <Sparkles className="w-6 h-6" />,
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        bgColor: 'from-purple-50 to-pink-50',
        title: 'VIP Lifetime Access',
        description: 'Anda memiliki akses seumur hidup ke semua fitur premium'
      };
    }
    
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
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Masukkan kode promo');
      return;
    }
    
    setPromoValidating(true);
    setPromoValid(null);
    
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setPromoValid(true);
        setPromoDiscount(data.discountPercentage);
        setPromoMessage(`Diskon ${data.discountPercentage}% berhasil diterapkan!`);
        toast.success(data.description || `Diskon ${data.discountPercentage}%`);
      } else {
        setPromoValid(false);
        setPromoDiscount(0);
        setPromoMessage(data.error || 'Kode promo tidak valid');
        toast.error(data.error || 'Kode promo tidak valid');
      }
    } catch (error) {
      setPromoValid(false);
      setPromoDiscount(0);
      setPromoMessage('Gagal memvalidasi kode promo');
      toast.error('Gagal memvalidasi kode promo');
    } finally {
      setPromoValidating(false);
    }
  };
  
  const clearPromo = () => {
    setPromoCode('');
    setPromoValid(null);
    setPromoDiscount(0);
    setPromoMessage('');
  };
  
  const handlePayment = async () => {
    if (!snapLoaded) {
      toast.error('Sistem pembayaran belum siap. Coba lagi.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/billing/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionType: selectedPlan,
          promoCode: promoValid ? promoCode : null,
          userEmail,
          userName,
          userId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat transaksi');
      }
      
      // Open Midtrans Snap popup
      if (window.snap && data.token) {
        window.snap.pay(data.token, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            toast.success('Pembayaran berhasil! Langganan Anda telah aktif.');
            // Refresh page to update subscription status
            window.location.reload();
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            toast.info('Pembayaran pending. Selesaikan pembayaran Anda.');
          },
          onError: (result) => {
            console.error('Payment error:', result);
            toast.error('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: () => {
            console.log('Payment popup closed');
            setLoading(false);
          },
        });
      } else {
        // Fallback if Snap not available (development/preview)
        toast.info('Pembayaran akan diarahkan ke Midtrans', {
          description: `Order ID: ${data.orderId}`,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memproses pembayaran';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Show VIP status for lifetime users
  if (isPremiumLifetime) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Billing & Langganan</h1>
          <p className="text-slate-500 text-sm mt-1">Status langganan Anda</p>
        </div>
        
        <Card className="border-0 shadow-card bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-slate-900">VIP Lifetime Access</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Selamat! Anda memiliki akses premium seumur hidup ke semua fitur SepulangDinas.
                </p>
                <p className="text-sm text-purple-600 mt-2 font-medium">
                  Tidak perlu pembayaran - akses Anda tidak pernah expired.
                </p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 border">
                LIFETIME
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-card bg-white">
          <CardContent className="p-6 text-center">
            <Crown className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
              Terima Kasih!
            </h3>
            <p className="text-slate-600">
              Anda adalah pengguna VIP istimewa kami. Nikmati semua fitur premium tanpa batas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-slide-in">
      {/* Load Midtrans Snap Script */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' 
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
        onLoad={() => setSnapLoaded(true)}
      />
      
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Billing & Langganan</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola langganan Anda</p>
      </div>
      
      {/* Status Card */}
      <Card className={`border-0 shadow-card bg-gradient-to-br ${statusInfo.bgColor}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${statusInfo.color} border`}>{statusInfo.icon}</div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-slate-900">{statusInfo.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{statusInfo.description}</p>
              {user?.berlaku_sampai && (
                <p className="text-sm text-slate-500 mt-2">
                  Berlaku sampai: <span className="font-medium">{formatDate(user.berlaku_sampai)}</span>
                </p>
              )}
            </div>
            <Badge className={`${statusInfo.color} border`}>{user?.status_langganan}</Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Pricing Cards */}
      {(user?.status_langganan === 'TRIAL' || user?.status_langganan === 'EXPIRED') && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <Card 
              className={`border-2 cursor-pointer transition-all ${
                selectedPlan === 'monthly' 
                  ? 'border-teal-500 shadow-lg' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Bulanan</CardTitle>
                  {selectedPlan === 'monthly' && (
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{formatPrice(PRICING.monthly.price)}</p>
                <p className="text-slate-500 text-sm">per bulan</p>
              </CardContent>
            </Card>
            
            {/* Yearly Plan */}
            <Card 
              className={`border-2 cursor-pointer transition-all relative overflow-hidden ${
                selectedPlan === 'yearly' 
                  ? 'border-teal-500 shadow-lg' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedPlan('yearly')}
            >
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
                HEMAT
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Tahunan</CardTitle>
                  {selectedPlan === 'yearly' && (
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{formatPrice(PRICING.yearly.price)}</p>
                <p className="text-slate-500 text-sm">per tahun</p>
                <p className="text-orange-600 text-sm font-medium mt-1">{PRICING.yearly.save}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Promo Code Input */}
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-slate-700">Kode Promosi</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Masukkan kode promo"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoValid(null);
                      setPromoDiscount(0);
                    }}
                    disabled={promoValid === true}
                    data-testid="input-promo-code"
                    className={`uppercase ${
                      promoValid === true ? 'border-green-500 bg-green-50' :
                      promoValid === false ? 'border-red-500 bg-red-50' : ''
                    }`}
                  />
                  {promoValid === true && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                  )}
                  {promoValid === false && (
                    <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
                  )}
                </div>
                {promoValid === true ? (
                  <Button variant="outline" onClick={clearPromo}>
                    Hapus
                  </Button>
                ) : (
                  <Button 
                    onClick={validatePromoCode} 
                    disabled={promoValidating || !promoCode.trim()}
                    data-testid="btn-apply-promo"
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {promoValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Terapkan'}
                  </Button>
                )}
              </div>
              {promoMessage && (
                <p className={`text-sm mt-2 ${promoValid ? 'text-green-600' : 'text-red-600'}`}>
                  {promoMessage}
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Price Summary */}
          <Card className="border-0 shadow-card bg-slate-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-slate-700 mb-3">Ringkasan Pembayaran</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Paket {PRICING[selectedPlan].label}</span>
                  <span className="text-slate-900">{formatPrice(originalPrice)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Promo ({promoDiscount}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-teal-600 text-lg">{formatPrice(finalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pay Button */}
          <Button 
            onClick={handlePayment} 
            disabled={loading} 
            data-testid="btn-bayar" 
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 rounded-xl font-heading font-semibold text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Bayar {formatPrice(finalPrice)}
              </>
            )}
          </Button>
        </>
      )}
      
      {/* Active Subscription */}
      {user?.status_langganan === 'ACTIVE' && (
        <Card className="border-0 shadow-card bg-white">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
              Langganan Anda Aktif
            </h3>
            <p className="text-slate-600">
              Nikmati akses penuh ke semua fitur SepulangDinas.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Payment Info */}
      <Card className="border-0 shadow-card bg-slate-50">
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold text-slate-900 mb-3">Informasi Pembayaran</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>- Pembayaran melalui Midtrans (QRIS, Transfer Bank, E-Wallet, Kartu Kredit)</p>
            <p>- Langganan akan aktif otomatis setelah pembayaran berhasil</p>
            <p>- Berlaku selama {selectedPlan === 'yearly' ? '365' : '30'} hari sejak tanggal pembayaran</p>
            <p>- Hubungi support jika ada kendala pembayaran</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

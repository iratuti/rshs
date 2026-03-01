'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stethoscope, Shield, Clock, FileText, UserCog, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { demoLogin, loading } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState<'admin' | 'user' | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const features = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Hemat Waktu",
      description: "Otomatis generate laporan e-Kinerja & e-Remunerasi"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Copy-Paste Langsung",
      description: "Hasil laporan siap digunakan tanpa edit"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Aman & Terpercaya",
      description: "Data tersimpan dengan enkripsi"
    }
  ];

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard'
      });
    } catch (error) {
      console.error('Google login failed:', error);
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'admin' | 'user') => {
    setDemoLoading(type);
    try {
      const credentials = type === 'admin' 
        ? { email: 'admin@demo.com', password: 'password' }
        : { email: 'user@demo.com', password: 'password' };
      
      const user = await demoLogin(credentials.email, credentials.password);
      
      // Force immediate navigation
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8 animate-slide-in">
          {/* Logo & Branding */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-float">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold text-slate-900">
                Sepulang<span className="text-teal-600">Dinas</span>
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                Pulang dinas, langsung istirahat
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-card-hover">
            <img 
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=300&fit=crop&crop=faces"
              alt="Healthcare professional"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-sm font-medium">
                Digunakan oleh 500+ perawat di Indonesia
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-float bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-heading font-semibold text-slate-900">
                  Masuk ke Akun Anda
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Gratis 7 hari trial untuk pengguna baru
                </p>
              </div>

              {/* Google Login */}
              <Button 
                onClick={login}
                disabled={loading || !!demoLoading}
                data-testid="login-google-btn"
                className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-all hover:shadow-md active:scale-[0.98]"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Quick Test</span>
                </div>
              </div>

              {/* Demo Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading || !!demoLoading}
                  data-testid="login-demo-admin-btn"
                  variant="outline"
                  className="h-12 border-teal-200 hover:bg-teal-50 hover:border-teal-300 rounded-xl font-medium transition-all"
                >
                  {demoLoading === 'admin' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCog className="w-4 h-4 mr-2 text-teal-600" />
                  )}
                  <span className="text-sm">Demo Admin</span>
                </Button>
                <Button 
                  onClick={() => handleDemoLogin('user')}
                  disabled={loading || !!demoLoading}
                  data-testid="login-demo-user-btn"
                  variant="outline"
                  className="h-12 border-orange-200 hover:bg-orange-50 hover:border-orange-300 rounded-xl font-medium transition-all"
                >
                  {demoLoading === 'user' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <User className="w-4 h-4 mr-2 text-orange-500" />
                  )}
                  <span className="text-sm">Demo User</span>
                </Button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Dengan masuk, Anda menyetujui Syarat & Ketentuan kami
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center p-3 rounded-xl bg-white/60 backdrop-blur-sm"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 text-teal-600 mb-2">
                  {feature.icon}
                </div>
                <h3 className="text-xs font-semibold text-slate-800">{feature.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-slate-400">
        <p>&copy; 2024 SepulangDinas. All rights reserved.</p>
      </footer>
    </div>
  );
}

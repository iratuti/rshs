'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'Konfigurasi Google OAuth belum lengkap. Hubungi administrator.',
    AccessDenied: 'Akses ditolak. Silakan coba lagi.',
    Verification: 'Verifikasi gagal. Silakan coba lagi.',
    OAuthSignin: 'Gagal memulai proses login Google.',
    OAuthCallback: 'Gagal menyelesaikan login Google.',
    OAuthCreateAccount: 'Gagal membuat akun.',
    EmailCreateAccount: 'Gagal membuat akun dengan email.',
    Callback: 'Terjadi kesalahan pada callback.',
    OAuthAccountNotLinked: 'Email sudah terdaftar dengan metode login lain.',
    default: 'Terjadi kesalahan saat login. Silakan coba lagi.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-float bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-bold text-slate-900">
              Gagal Login
            </h1>
            <p className="text-slate-600">
              {errorMessage}
            </p>
            {error === 'Configuration' && (
              <p className="text-sm text-slate-500 mt-4">
                Admin perlu menambahkan Google OAuth credentials (GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET) di file .env.local
              </p>
            )}
          </div>
          
          <Link href="/">
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Halaman Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}

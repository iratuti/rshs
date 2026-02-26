import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Send, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    kategori: 'Teknis',
    subjek: '',
    pesan_user: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subjek || !newTicket.pesan_user) {
      toast.error('Lengkapi semua field yang wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTicket)
      });

      if (response.ok) {
        const ticket = await response.json();
        setTickets([ticket, ...tickets]);
        setShowNewTicket(false);
        setNewTicket({ kategori: 'Teknis', subjek: '', pesan_user: '' });
        toast.success('Tiket berhasil dikirim');
      }
    } catch (error) {
      toast.error('Gagal mengirim tiket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 border">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu
          </Badge>
        );
      case 'Answered':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">
            <MessageSquare className="w-3 h-3 mr-1" />
            Dijawab
          </Badge>
        );
      case 'Closed':
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 border">
            <CheckCircle className="w-3 h-3 mr-1" />
            Selesai
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Support</h1>
          <p className="text-slate-500 text-sm mt-1">Butuh bantuan? Kirim tiket di sini</p>
        </div>
        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogTrigger asChild>
            <Button 
              data-testid="btn-tiket-baru"
              className="bg-teal-600 hover:bg-teal-700 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tiket Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Buat Tiket Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Select 
                  value={newTicket.kategori} 
                  onValueChange={(v) => setNewTicket({...newTicket, kategori: v})}
                >
                  <SelectTrigger id="kategori" data-testid="select-kategori">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teknis">Teknis</SelectItem>
                    <SelectItem value="Finance">Finance/Pembayaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjek">Subjek *</Label>
                <Input
                  id="subjek"
                  placeholder="Tuliskan judul masalah Anda"
                  value={newTicket.subjek}
                  onChange={(e) => setNewTicket({...newTicket, subjek: e.target.value})}
                  data-testid="input-subjek"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pesan">Pesan *</Label>
                <Textarea
                  id="pesan"
                  placeholder="Jelaskan masalah Anda secara detail..."
                  value={newTicket.pesan_user}
                  onChange={(e) => setNewTicket({...newTicket, pesan_user: e.target.value})}
                  data-testid="textarea-pesan"
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTicket(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSubmitTicket}
                disabled={submitting}
                data-testid="btn-kirim-tiket"
                className="bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Tiket
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* FAQ Section */}
      <Card className="border-0 shadow-card bg-gradient-to-br from-teal-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-teal-100 text-teal-700">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-900">
                Butuh bantuan cepat?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Cek FAQ kami atau kirim tiket untuk pertanyaan spesifik
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Tiket Saya ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada tiket</p>
              <p className="text-sm">Klik "Tiket Baru" jika butuh bantuan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ticket.kategori}
                      </Badge>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900">{ticket.subjek}</h4>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {ticket.pesan_user}
                  </p>
                  
                  {/* Admin Reply */}
                  {ticket.balasan_admin && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-teal-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-teal-50 text-teal-700 border-teal-200 border text-xs">
                          Admin
                        </Badge>
                        {ticket.updated_at && (
                          <span className="text-xs text-slate-400">
                            {formatDate(ticket.updated_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{ticket.balasan_admin}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;

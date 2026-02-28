import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { MessageSquare, Send, CheckCircle, Clock, User, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tickets`, {
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

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error('Tulis balasan terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ balasan_admin: replyText })
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTickets(tickets.map(t => 
          t.ticket_id === updatedTicket.ticket_id ? updatedTicket : t
        ));
        setSelectedTicket(null);
        setReplyText('');
        toast.success('Balasan berhasil dikirim');
      }
    } catch (error) {
      toast.error('Gagal mengirim balasan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tickets/${ticketId}/close`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTickets(tickets.map(t => 
          t.ticket_id === updatedTicket.ticket_id ? updatedTicket : t
        ));
        toast.success('Tiket ditutup');
      }
    } catch (error) {
      toast.error('Gagal menutup tiket');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 border">
            <Clock className="w-3 h-3 mr-1" />
            Open
          </Badge>
        );
      case 'Answered':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">
            <MessageSquare className="w-3 h-3 mr-1" />
            Answered
          </Badge>
        );
      case 'Closed':
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 border">
            <CheckCircle className="w-3 h-3 mr-1" />
            Closed
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
        <h1 className="text-2xl font-heading font-bold text-slate-900">Kelola Tiket</h1>
        <p className="text-slate-500 text-sm mt-1">Balas dan kelola tiket support</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-card bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-amber-700">
              {tickets.filter(t => t.status === 'Open').length}
            </p>
            <p className="text-sm text-amber-600">Open</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-blue-700">
              {tickets.filter(t => t.status === 'Answered').length}
            </p>
            <p className="text-sm text-blue-600">Answered</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card bg-slate-100">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-slate-700">
              {tickets.filter(t => t.status === 'Closed').length}
            </p>
            <p className="text-sm text-slate-600">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card className="border-0 shadow-card bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Semua Tiket ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada tiket</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className={`p-4 rounded-xl border ${
                    ticket.status === 'Open' 
                      ? 'bg-amber-50/50 border-amber-100' 
                      : 'bg-slate-50 border-slate-100'
                  }`}
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
                  
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <User className="w-3 h-3" />
                    <span>{ticket.user_name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{ticket.user_email}</span>
                  </div>
                  
                  <p className="text-sm text-slate-600 mt-2">
                    {ticket.pesan_user}
                  </p>
                  
                  {/* Admin Reply */}
                  {ticket.balasan_admin && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-teal-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-teal-50 text-teal-700 border-teal-200 border text-xs">
                          Balasan Admin
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">{ticket.balasan_admin}</p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  {ticket.status !== 'Closed' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setReplyText(ticket.balasan_admin || '');
                        }}
                        data-testid={`btn-reply-${ticket.ticket_id}`}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Balas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseTicket(ticket.ticket_id)}
                        data-testid={`btn-close-${ticket.ticket_id}`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Tutup
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Balas Tiket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-900">{selectedTicket.subjek}</p>
                <p className="text-sm text-slate-600 mt-1">{selectedTicket.pesan_user}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Balasan Admin</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tulis balasan Anda..."
                  data-testid="textarea-reply"
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Batal
            </Button>
            <Button
              onClick={handleReply}
              disabled={submitting}
              data-testid="btn-send-reply"
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
                  Kirim Balasan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTicketsPage;

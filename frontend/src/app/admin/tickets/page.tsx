'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  MessageSquare, Search, Clock, CheckCircle, XCircle, 
  AlertCircle, Send, Loader2, Trash2, Eye, RefreshCw,
  Filter, Inbox
} from 'lucide-react';

interface Ticket {
  ticket_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  kategori: string;
  subjek: string;
  pesan_user: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  balasan_admin?: string;
  created_at: string;
  updated_at?: string;
}

const STATUS_CONFIG = {
  OPEN: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  IN_PROGRESS: { label: 'Diproses', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
  RESOLVED: { label: 'Terjawab', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  CLOSED: { label: 'Ditutup', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Use FastAPI backend endpoint
      const response = await fetch('/api/admin/tickets', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tickets:', data);
        setTickets(data);
      } else {
        console.error('Failed to fetch tickets:', response.status);
        // Fallback: try Next.js API route
        const fallbackResponse = await fetch('/api/tickets?all=true', {
          credentials: 'include',
          cache: 'no-store'
        });
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setTickets(data);
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Gagal memuat tiket');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.balasan_admin || '');
    setShowDetailModal(true);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) {
      toast.error('Masukkan balasan terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      // Use FastAPI backend endpoint for reply
      const response = await fetch(`/api/admin/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          balasan_admin: replyText
        })
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTickets(tickets.map(t => t.ticket_id === updatedTicket.ticket_id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
        toast.success('Balasan berhasil dikirim');
      } else {
        toast.error('Gagal mengirim balasan');
      }
    } catch (error) {
      toast.error('Gagal mengirim balasan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      // For closing a ticket, use the close endpoint
      const endpoint = newStatus === 'CLOSED' 
        ? `/api/admin/tickets/${ticketId}/close`
        : `/api/admin/tickets/${ticketId}/reply`;
      
      const body = newStatus === 'CLOSED' 
        ? {}
        : { balasan_admin: selectedTicket?.balasan_admin || '' };
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTickets(tickets.map(t => t.ticket_id === updatedTicket.ticket_id ? updatedTicket : t));
        if (selectedTicket?.ticket_id === ticketId) {
          setSelectedTicket(updatedTicket);
        }
        toast.success('Status tiket diperbarui');
      }
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('Yakin ingin menghapus tiket ini?')) return;

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setTickets(tickets.filter(t => t.ticket_id !== ticketId));
        setShowDetailModal(false);
        toast.success('Tiket berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus tiket');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter tickets based on search, status, and tab
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subjek.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'open' ? ticket.status === 'OPEN' :
      activeTab === 'resolved' ? (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') :
      true;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  // Stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Manajemen Tiket Support</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan jawab tiket dari pengguna</p>
        </div>
        <Button variant="outline" onClick={fetchTickets} data-testid="btn-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => setActiveTab('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Tiket</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => setActiveTab('open')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.open}</p>
                <p className="text-xs text-slate-500">Menunggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                <p className="text-xs text-slate-500">Diproses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => setActiveTab('resolved')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.resolved}</p>
                <p className="text-xs text-slate-500">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Cari subjek, nama, email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                data-testid="input-search-ticket"
                className="pl-10 h-10" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="OPEN">Menunggu</SelectItem>
                  <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
                  <SelectItem value="RESOLVED">Terjawab</SelectItem>
                  <SelectItem value="CLOSED">Ditutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="border-0 shadow-card bg-white overflow-hidden">
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua ({stats.total})</TabsTrigger>
              <TabsTrigger value="open">Menunggu ({stats.open})</TabsTrigger>
              <TabsTrigger value="resolved">Selesai ({stats.resolved})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada tiket</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const StatusIcon = STATUS_CONFIG[ticket.status].icon;
                    return (
                      <TableRow key={ticket.ticket_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {ticket.ticket_id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{ticket.user_name}</p>
                            <p className="text-xs text-slate-500">{ticket.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.kategori}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate font-medium">{ticket.subjek}</p>
                          <p className="text-xs text-slate-500 truncate">{ticket.pesan_user.substring(0, 50)}...</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_CONFIG[ticket.status].color} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {STATUS_CONFIG[ticket.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(ticket.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => handleViewTicket(ticket)} data-testid={`btn-view-${ticket.ticket_id}`} className="h-8 w-8 text-slate-500 hover:text-teal-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(ticket.ticket_id)} data-testid={`btn-delete-${ticket.ticket_id}`} className="h-8 w-8 text-slate-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="font-heading">{selectedTicket.subjek}</DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      dari {selectedTicket.user_name} ({selectedTicket.user_email})
                    </p>
                  </div>
                  <Badge className={`${STATUS_CONFIG[selectedTicket.status].color} border`}>
                    {STATUS_CONFIG[selectedTicket.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Ticket Info */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>ID: {selectedTicket.ticket_id.slice(-8)}</span>
                  <span>•</span>
                  <Badge variant="outline">{selectedTicket.kategori}</Badge>
                  <span>•</span>
                  <span>{formatDate(selectedTicket.created_at)}</span>
                </div>

                {/* User Message */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-xs text-slate-500 mb-2 block">Pesan Pengguna:</Label>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedTicket.pesan_user}</p>
                </div>

                {/* Previous Admin Reply (if any) */}
                {selectedTicket.balasan_admin && (
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <Label className="text-xs text-teal-600 mb-2 block">Balasan Admin:</Label>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedTicket.balasan_admin}</p>
                    {selectedTicket.updated_at && (
                      <p className="text-xs text-slate-400 mt-2">Dijawab: {formatDate(selectedTicket.updated_at)}</p>
                    )}
                  </div>
                )}

                {/* Reply Section */}
                <div className="space-y-2">
                  <Label htmlFor="reply">Balas Tiket:</Label>
                  <Textarea
                    id="reply"
                    placeholder="Tulis balasan Anda..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    data-testid="textarea-reply"
                    className="min-h-[120px]"
                  />
                </div>

                {/* Status Change */}
                <div className="flex items-center gap-4">
                  <Label>Ubah Status:</Label>
                  <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.ticket_id, v)}>
                    <SelectTrigger className="w-40" data-testid="select-change-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Menunggu</SelectItem>
                      <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
                      <SelectItem value="RESOLVED">Terjawab</SelectItem>
                      <SelectItem value="CLOSED">Ditutup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => handleDelete(selectedTicket.ticket_id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Tutup
                </Button>
                <Button onClick={handleReply} disabled={submitting || !replyText.trim()} data-testid="btn-send-reply" className="bg-teal-600 hover:bg-teal-700">
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Kirim Balasan</>
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

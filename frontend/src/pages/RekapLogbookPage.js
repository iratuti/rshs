import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Calendar, FileDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const RekapLogbookPage = () => {
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedLogbook, setExpandedLogbook] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchLogbooks();
  }, [selectedMonth, selectedYear]);

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/logbooks?month=${selectedMonth}&year=${selectedYear}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setLogbooks(data);
      }
    } catch (error) {
      console.error('Error fetching logbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.info('Fitur export PDF akan segera hadir');
  };

  const handleExportCSV = () => {
    toast.info('Fitur export CSV akan segera hadir');
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getShiftBadgeColor = (shift) => {
    switch (shift) {
      case 'PAGI': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SIANG': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MALAM': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  // Group logbooks by date and add empty rows for visual separation
  const groupedLogbooks = logbooks.reduce((acc, logbook) => {
    const date = logbook.tanggal_dinas;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(logbook);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Rekap Logbook</h1>
          <p className="text-slate-500 text-sm mt-1">Riwayat logbook bulanan</p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="border-0 shadow-card bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              data-testid="btn-prev-month"
              className="shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Calendar className="w-5 h-5 text-teal-600" />
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger data-testid="select-month" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger data-testid="select-year" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              data-testid="btn-next-month"
              className="shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExportPDF}
          data-testid="btn-export-pdf"
          className="rounded-full"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          data-testid="btn-export-csv"
          className="rounded-full"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Data Table */}
      <Card className="border-0 shadow-card bg-white overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Data Logbook - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : logbooks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada data logbook untuk bulan ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-32">Tanggal</TableHead>
                    <TableHead className="w-24">Shift</TableHead>
                    <TableHead className="w-32">Jam Dinas</TableHead>
                    <TableHead>Jumlah Pasien</TableHead>
                    <TableHead className="w-20">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedLogbooks).map(([date, dateLogbooks], dateIdx) => (
                    <React.Fragment key={date}>
                      {dateIdx > 0 && (
                        <TableRow className="h-2 bg-slate-100">
                          <TableCell colSpan={5} className="p-0"></TableCell>
                        </TableRow>
                      )}
                      {dateLogbooks.map((logbook, idx) => (
                        <React.Fragment key={logbook.logbook_id}>
                          <TableRow 
                            className={`hover:bg-slate-50 cursor-pointer ${
                              expandedLogbook === logbook.logbook_id ? 'bg-teal-50' : ''
                            }`}
                            onClick={() => setExpandedLogbook(
                              expandedLogbook === logbook.logbook_id ? null : logbook.logbook_id
                            )}
                          >
                            <TableCell className="font-medium">
                              {new Date(logbook.tanggal_dinas).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getShiftBadgeColor(logbook.shift)} border`}>
                                {logbook.shift}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {logbook.jam_datang} - {logbook.jam_pulang}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-teal-600">
                                {logbook.daftar_tindakan?.length || 0}
                              </span>
                              <span className="text-slate-400 ml-1">pasien</span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`btn-view-${logbook.logbook_id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {/* Expanded Details */}
                          {expandedLogbook === logbook.logbook_id && (
                            <TableRow>
                              <TableCell colSpan={5} className="bg-slate-50 p-4">
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-slate-700">Daftar Pasien:</p>
                                  {logbook.daftar_tindakan?.length > 0 ? (
                                    <ul className="space-y-1">
                                      {logbook.daftar_tindakan.map((t, i) => (
                                        <li key={i} className="text-sm text-slate-600 pl-4 border-l-2 border-teal-200">
                                          {t.nama_pasien} (RM: {t.no_rm})
                                          {t.diagnosa && <span className="text-slate-400"> - {t.diagnosa}</span>}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">Tidak ada data pasien</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {!loading && logbooks.length > 0 && (
        <Card className="border-0 shadow-card bg-gradient-to-br from-teal-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-heading font-bold text-teal-700">
                  {logbooks.length}
                </p>
                <p className="text-sm text-slate-600">Total Shift</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-teal-700">
                  {logbooks.reduce((sum, l) => sum + (l.daftar_tindakan?.length || 0), 0)}
                </p>
                <p className="text-sm text-slate-600">Total Pasien</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-teal-700">
                  {Math.round(logbooks.reduce((sum, l) => sum + (l.daftar_tindakan?.length || 0), 0) / logbooks.length) || 0}
                </p>
                <p className="text-sm text-slate-600">Rata-rata/Shift</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RekapLogbookPage;

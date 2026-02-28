'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, FileDown, Printer, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const TINDAKAN_LABELS: { [key: string]: string } = {
  oksigenasi: 'OKSIGENASI',
  perawatan_luka_sederhana: 'PERAWATAN LUKA SEDERHANA',
  pre_pasca_op: 'PRE / PASCA OP',
  kompres_terbuka: 'KOMPRES TERBUKA',
  memasang_infus_baru: 'MEMASANG INFUS BARU',
  memberikan_cairan_infus: 'MEMBERIKAN CAIRAN INFUS',
  memasang_ngt: 'MEMASANG NGT',
  transfusi_darah: 'TRANSFUSI DARAH',
  nebu: 'NEBU',
  memasang_dc_kateter: 'MEMASANG DC/KATETER',
  koreksi_caglukonas: 'KOREKSI CAGlukonas',
  koreksi_kcl: 'KOREKSI KCL',
  uji_lab: 'UJI LAB',
};

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

const KETERGANTUNGAN_LABELS: { [key: string]: string } = {
  'ADL_SELF_CARE': 'Self Care',
  'ADL_PARTIAL_CARE': 'Partial Care',
  'ADL_TOTAL_CARE': 'Total Care'
};

interface TindakanItem {
  nama_pasien: string;
  no_rm: string;
  no_billing?: string;
  diagnosa?: string;
  ketergantungan?: string;
  keterangan_tindakan?: string[];
  catatan_lainnya?: string;
  [key: string]: unknown;
}

interface Logbook {
  tanggal_dinas: string;
  shift: string;
  daftar_tindakan: TindakanItem[];
}

interface FlattenedRow {
  rowNum: number;
  tanggal: string;
  shift: string;
  isFirstInDate: boolean;
  rowSpan: number;
  nama: string;
  noRM: string;
  noBilling: string;
  diagnosa: string;
  ketergantungan: string;
  keterangan: string;
}

export default function RekapLogbookPage() {
  const [logbooks, setLogbooks] = useState<Logbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const tableRef = useRef<HTMLTableElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchLogbooks();
  }, [selectedMonth, selectedYear]);

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logbooks?month=${selectedMonth}&year=${selectedYear}`);
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

  const buildKeterangan = (tindakan: TindakanItem): string => {
    const parts: string[] = [];
    if (tindakan.keterangan_tindakan?.length) {
      parts.push(...tindakan.keterangan_tindakan);
    }
    Object.keys(TINDAKAN_LABELS).forEach(key => {
      if (tindakan[key]) {
        parts.push(TINDAKAN_LABELS[key]);
      }
    });
    if (tindakan.catatan_lainnya) {
      parts.push(tindakan.catatan_lainnya);
    }
    return parts.join(', ') || '-';
  };

  const flattenedRows: FlattenedRow[] = [];
  let rowNumber = 1;

  logbooks.forEach(logbook => {
    if (logbook.daftar_tindakan?.length > 0) {
      logbook.daftar_tindakan.forEach((tindakan, idx) => {
        flattenedRows.push({
          rowNum: rowNumber++,
          tanggal: logbook.tanggal_dinas,
          shift: logbook.shift,
          isFirstInDate: idx === 0,
          rowSpan: idx === 0 ? logbook.daftar_tindakan.length : 0,
          nama: tindakan.nama_pasien,
          noRM: tindakan.no_rm,
          noBilling: tindakan.no_billing || '-',
          diagnosa: tindakan.diagnosa || '-',
          ketergantungan: KETERGANTUNGAN_LABELS[tindakan.ketergantungan || ''] || tindakan.ketergantungan || '-',
          keterangan: buildKeterangan(tindakan)
        });
      });
    }
  });

  const handleExportCSV = () => {
    if (flattenedRows.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    setExporting(true);
    try {
      const csvData = flattenedRows.map(row => ({
        'No': row.rowNum,
        'Tanggal': new Date(row.tanggal).toLocaleDateString('id-ID'),
        'Shift': row.shift,
        'Nama Pasien': row.nama,
        'No. RM': row.noRM,
        'No. Billing': row.noBilling,
        'Diagnosa': row.diagnosa,
        'Ketergantungan': row.ketergantungan,
        'Keterangan': row.keterangan
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
      saveAs(blob, `rekap-logbook-${monthName}-${selectedYear}.csv`);
      toast.success('Export CSV berhasil!');
    } catch (error) {
      toast.error('Gagal export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (flattenedRows.length === 0) {
      toast.error('Tidak ada data untuk di-export');
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
      
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('REKAP LOGBOOK KEPERAWATAN', doc.internal.pageSize.width / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${monthName} ${selectedYear}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

      // Table data
      const tableData = flattenedRows.map(row => [
        row.rowNum.toString(),
        new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        row.shift,
        row.nama,
        row.noRM,
        row.noBilling,
        row.diagnosa,
        row.ketergantungan,
        row.keterangan.substring(0, 50) + (row.keterangan.length > 50 ? '...' : '')
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['No', 'Tanggal', 'Shift', 'Nama', 'No. RM', 'No. Billing', 'Diagnosa', 'Ketergantungan', 'Keterangan']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 15 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 30 },
          7: { cellWidth: 25 },
          8: { cellWidth: 'auto' }
        }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 15, doc.internal.pageSize.height - 10);
      }

      doc.save(`rekap-logbook-${monthName}-${selectedYear}.pdf`);
      toast.success('Export PDF berhasil!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 md:space-y-4 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">Rekap Logbook</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Tampilan spreadsheet data logbook bulanan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting || flattenedRows.length === 0} data-testid="btn-export-csv" className="rounded-full text-xs md:text-sm h-8 md:h-9">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FileDown className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />}
            <span className="hidden sm:inline">Export</span> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting || flattenedRows.length === 0} data-testid="btn-export-pdf" className="rounded-full text-xs md:text-sm h-8 md:h-9">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FileDown className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="btn-print" className="rounded-full text-xs md:text-sm h-8 md:h-9">
            <Printer className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-card bg-white print:hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} data-testid="btn-prev-month" className="shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Calendar className="w-5 h-5 text-teal-600" />
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger data-testid="select-month" className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger data-testid="select-year" className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} data-testid="btn-next-month" className="shrink-0">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">REKAP LOGBOOK KEPERAWATAN</h1>
        <p>Periode: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-card print:shadow-none">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : flattenedRows.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Tidak ada data logbook untuk bulan ini</p>
          </div>
        ) : (
          <table ref={tableRef} className="w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold w-24">TANGGAL</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold w-16">SHIFT</th>
                <th className="border border-slate-300 px-2 py-2 text-center font-semibold w-10">NO</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold min-w-[150px]">NAMA</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold w-28">NO REKAM MEDIS</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold w-24">NO. BILLING</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold min-w-[120px]">DIAGNOSA</th>
                <th className="border border-slate-300 px-2 py-2 text-center font-semibold w-24">KETERGANTUNGAN</th>
                <th className="border border-slate-300 px-2 py-2 text-left font-semibold min-w-[300px]">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {flattenedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 print:hover:bg-white">
                  {row.isFirstInDate && (
                    <>
                      <td className="border border-slate-300 px-2 py-2 align-top font-medium bg-slate-50" rowSpan={row.rowSpan}>
                        {new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 align-top text-center bg-slate-50" rowSpan={row.rowSpan}>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.shift === 'PAGI' ? 'bg-amber-100 text-amber-700' :
                          row.shift === 'SIANG' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {row.shift}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="border border-slate-300 px-2 py-2 text-center">{row.rowNum}</td>
                  <td className="border border-slate-300 px-2 py-2 font-medium">{row.nama}</td>
                  <td className="border border-slate-300 px-2 py-2 font-mono text-xs">{row.noRM}</td>
                  <td className="border border-slate-300 px-2 py-2 text-slate-600">{row.noBilling}</td>
                  <td className="border border-slate-300 px-2 py-2 text-slate-600">{row.diagnosa}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.ketergantungan === 'Self Care' ? 'bg-emerald-100 text-emerald-700' :
                      row.ketergantungan === 'Total Care' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {row.ketergantungan}
                    </span>
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-slate-600 text-xs leading-relaxed">{row.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && flattenedRows.length > 0 && (
        <div className="text-sm text-slate-500 text-center print:hidden">
          Total: {flattenedRows.length} catatan dari {logbooks.length} hari kerja
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .space-y-4, .space-y-4 * { visibility: visible; }
          .space-y-4 { position: absolute; left: 0; top: 0; width: 100%; }
          table { font-size: 10px !important; }
          th, td { padding: 4px 6px !important; }
        }
      `}</style>
    </div>
  );
}

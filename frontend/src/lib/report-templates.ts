// Default templates and shortcode replacement engine

export interface TemplateItem {
  point: number;
  category: string;
  template: string;
}

export const SHORTCODES = [
  { code: '[NAMES_ALL_PASIEN]', label: 'Nama semua pasien', example: 'Ny. Alice (001), Tn. Budi (002)' },
  { code: '[NAMES_PASIEN_BARU]', label: 'Nama pasien baru', example: 'Ny. Alice (003)' },
  { code: '[NAMES_PASIEN_PULANG]', label: 'Nama pasien pulang', example: 'Tn. Budi (004)' },
  { code: '[NAMES_PASIEN_LAMA]', label: 'Nama pasien lama (semua MINUS pasien baru)', example: 'Tn. Budi (002), Ny. Citra (005)' },
  { code: '[NAMES_PASIEN_TOTAL_CARE]', label: 'Nama pasien ADL Total Care', example: 'Ny. Alice (001), Tn. Budi (003)' },
  { code: '[NAMES_PASIEN_EWS_PER_JAM]', label: 'Nama pasien dengan Observasi EWS per jam (EWS >4)', example: 'Ny. Alice (001)' },
  { code: '[COUNT_ALL_PASIEN]', label: 'Jumlah semua pasien', example: '5' },
  { code: '[COUNT_PASIEN_BARU]', label: 'Jumlah pasien baru', example: '2' },
  { code: '[COUNT_PASIEN_PULANG]', label: 'Jumlah pasien pulang', example: '1' },
  { code: '[NAMA_RUANGAN]', label: 'Nama ruangan perawat', example: 'Ruang Melati' },
  { code: '[SHIFT]', label: 'Shift dinas (pagi/siang/malam)', example: 'pagi' },
  { code: '[JAM_DATANG]', label: 'Jam datang', example: '07:00' },
  { code: '[JAM_PULANG]', label: 'Jam pulang', example: '14:00' },
  { code: '[SHIFT_TIME1]', label: 'Waktu mulai shift', example: '07:00' },
  { code: '[SHIFT_TIME2]', label: 'Waktu +15 menit', example: '07:15' },
  { code: '[SHIFT_TIME3]', label: 'Waktu +30 menit', example: '07:30' },
  { code: '[TINDAKAN_DETAIL]', label: 'Detail tindakan per pasien (khusus Remunerasi poin 4)', example: '1. Memberikan oksigenasi...' },
  { code: '[IF_PASIEN_BARU]...[ELSE]...[ENDIF]', label: 'Kondisional: teks berbeda jika ada/tidak ada pasien baru', example: '[IF_PASIEN_BARU] Ada pasien baru [ELSE] Tidak ada pasien baru [ENDIF]' },
];

export const DEFAULT_EKINERJA_TEMPLATES: TemplateItem[] = [
  { point: 1, category: 'PASIEN_BARU', template: 'Menerima pasien baru [NAMES_PASIEN_BARU]\nMemastikan ketersediaan tempat tidur untuk pasien yang akan masuk rawat inap [NAMES_PASIEN_BARU]' },
  { point: 2, category: 'PASIEN_BARU', template: 'Menyiapkan ruangan dan melakukan verbedent sebelum pasien baru [NAMES_PASIEN_BARU] masuk ke ruangan.' },
  { point: 5, category: 'PASIEN_BARU', template: 'Menerima pasien baru [NAMES_PASIEN_BARU] sesuai dengan pesanan admission' },
  { point: 4, category: 'PASIEN_PULANG', template: 'Melakukan koordinasi dengan DPJP terkait resume pulang dan KOP pulang pasien [NAMES_PASIEN_PULANG] harus ada sebelum pulang atau H-1' },
  { point: 25, category: 'PASIEN_PULANG', template: 'Memastikan kelengkapan administrasi pasien pulang mulai dari RMK, resume, kelengkapan tindakan atau data pelayanaan, laporan operasi dan obat pulang kepada [NAMES_PASIEN_PULANG]' },
  { point: 6, category: 'SEMUA_PASIEN', template: 'Melakukan pengkajian keperawatan lanjutan kepada pasien [NAMES_ALL_PASIEN]\nMelakukan perencanaan keperawatan kepada pasien [NAMES_ALL_PASIEN]\nMelakukan intervensi keperawatan kepada pasien [NAMES_ALL_PASIEN]\nMelakukan implementasi keperawatan kepada pasien [NAMES_ALL_PASIEN]\nMelakukan evaluasi keperawatan kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 7, category: 'SEMUA_PASIEN', template: 'Melakukan visit kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 8, category: 'SEMUA_PASIEN', template: 'Melakukan asuhan keperawatan awal dan lanjutan pada pasien [NAMES_ALL_PASIEN] di EMR\nMelakukan perencanaan keperawatan pada pasien [NAMES_ALL_PASIEN] di EMR\nMelakukan intervensi keperawatan pada pasien [NAMES_ALL_PASIEN] di EMR\nMelakukan implementasi keperawatan pada pasien [NAMES_ALL_PASIEN] di EMR\nMelakukan evaluasi keperawatan pada pasien [NAMES_ALL_PASIEN] di EMR\nMelakukan dokumentasi keperawatan pada pasien [NAMES_ALL_PASIEN] di EMR\nMendokumentasikan segala tindakan yang dilakukan kepada pasien [NAMES_ALL_PASIEN] di EMR' },
  { point: 10, category: 'SEMUA_PASIEN', template: 'Melakukan intervensi keperawatan kepada pasien [NAMES_ALL_PASIEN]\nMelakukan implementasi keperawatan kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 11, category: 'SEMUA_PASIEN', template: 'Melakukan pengisian EMR terhadap pasien [NAMES_ALL_PASIEN], pada setiap melakukan tindakan dan asuhan yang di dokumentasikan di EMR.' },
  { point: 13, category: 'SEMUA_PASIEN', template: 'Melakukan assesmen ulang resiko jatuh kepada pasien [NAMES_ALL_PASIEN]\nMemastikan bed plang pasien [NAMES_ALL_PASIEN]\nMemastikan bahwa lingkungan fisik ruangan aman untuk mencegah terjadinya cedera kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 16, category: 'SEMUA_PASIEN', template: 'Melakukan asuhan keperawatan kepada pasien [NAMES_ALL_PASIEN] sesuai SOP yang berlaku' },
  { point: 17, category: 'SEMUA_PASIEN', template: 'Mendampingi DPJP saat visite kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 18, category: 'SEMUA_PASIEN', template: 'Melakukan tindakan keperawatan secara efektif pada pasien [NAMES_ALL_PASIEN] setiap shift sesuai dengan rencana asuhan terpadu' },
  { point: 22, category: 'SEMUA_PASIEN', template: 'Setiap melakukan pemasangan infus kepada pasien [NAMES_ALL_PASIEN] diberikan tanggal pemasangan dan jam\nMengecek tanggal dilakukan pemasangan infus kepada pasien [NAMES_ALL_PASIEN], jika sudah >3 hari pemasangan infus dipindahkan\nMelakukan pengecekan di area pemasangan infus kepada pasien [NAMES_ALL_PASIEN] apakah terjadi kemerahan, bengkak, terasa nyeri dan panas pada area pemasangan infus' },
  { point: 24, category: 'SEMUA_PASIEN', template: 'Setelah kontak dengan lingkungan pasien [NAMES_ALL_PASIEN] melakukan cuci tangan dengan handrub atau air mengalir\nSetelah kontak dengan pasien [NAMES_ALL_PASIEN] melakukan cuci tangan dengan handrub atau air mengalir\nSetelah terkena cairan tubuh pasien [NAMES_ALL_PASIEN] melakukan cuci tangan dengan handrub atau air mengalir\nSebelum melakukan tindakan aseptik kepada [NAMES_ALL_PASIEN] melakukan cuci tangan terlebih dahulu dengan handrub atau air mengalir\nSebelum kontak dengan pasien [NAMES_ALL_PASIEN] melakukan cuci tangan terlebih dahulu dengan handrub atau air mengalir' },
  { point: 27, category: 'SEMUA_PASIEN', template: 'Setiap melakukan tindakan keperawatan kepada pasien [NAMES_ALL_PASIEN] memakai APD sesuai standar, misalnya membuang urine pasien menggunakan handscone, memakai masker di ruang droplet' },
  { point: 28, category: 'ABSENSI', template: 'Melakukan briefing dan berdoa sebelum jam pelayanan dimulai pukul [SHIFT_TIME1]\nMelakukan dan memulai jam pelayanan pada pukul [SHIFT_TIME2]\nMelakukan operan pada pasien dari dinas [SHIFT]' },
  { point: 29, category: 'ABSENSI', template: 'Melakukan absensi dinas [SHIFT], absensi datang pukul [JAM_DATANG], dan absensi pulang pukul [JAM_PULANG]' },
];

export const DEFAULT_EREMUNERASI_TEMPLATES: TemplateItem[] = [
  { point: 1, category: 'ASESMEN', template: 'Melakukan asesmen awal dan lanjutan serta memberikan edukasi kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 2, category: 'ADVOKASI', template: 'Melaksanakan fungsi advokasi dan kolaborasi dengan mendampingi visite DPJP kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 3, category: 'DOKUMENTASI', template: 'Melakukan dokumentasi asuhan dalam rekam medis dengan tepat dan lengkap sesuai standar kepada pasien [NAMES_ALL_PASIEN]' },
  { point: 4, category: 'TINDAKAN', template: '[TINDAKAN_DETAIL]' },
  { point: 5, category: 'MONITORING', template: 'Melakukan monitoring EWS dan pengelolaan pasien kepada [NAMES_ALL_PASIEN]' },
];

export const EKINERJA_CATEGORIES = [
  { value: 'PASIEN_BARU', label: 'Pasien Baru' },
  { value: 'PASIEN_PULANG', label: 'Pasien Pulang' },
  { value: 'SEMUA_PASIEN', label: 'Semua Pasien' },
  { value: 'ABSENSI', label: 'Absensi' },
];

export const EREMUNERASI_CATEGORIES = [
  { value: 'ASESMEN', label: 'Asesmen' },
  { value: 'ADVOKASI', label: 'Advokasi' },
  { value: 'DOKUMENTASI', label: 'Dokumentasi' },
  { value: 'TINDAKAN', label: 'Tindakan' },
  { value: 'MONITORING', label: 'Monitoring' },
];

export interface ShortcodeData {
  namesAllPasien: string;
  namesPasienBaru: string;
  namesPasienPulang: string;
  namesPasienLama: string;
  namesPasienTotalCare: string;
  namesPasienEwsPerJam: string;
  countAllPasien: number;
  countPasienBaru: number;
  countPasienPulang: number;
  namaRuangan: string;
  shift: string;
  jamDatang: string;
  jamPulang: string;
  shiftTime1: string;
  shiftTime2: string;
  shiftTime3: string;
  tindakanDetail: string;
}

export function replaceShortcodes(template: string, data: ShortcodeData): string {
  // 1. Process conditional blocks: [IF_PASIEN_BARU] text_true [ELSE] text_false [ENDIF]
  let result = template.replace(
    /\[IF_PASIEN_BARU\]([\s\S]*?)\[ELSE\]([\s\S]*?)\[ENDIF\]/g,
    (_match, trueBlock, falseBlock) => {
      return data.countPasienBaru > 0 ? trueBlock.trim() : falseBlock.trim();
    }
  );

  // 2. Replace all shortcodes
  result = result
    .replace(/\[NAMES_ALL_PASIEN\]/g, data.namesAllPasien)
    .replace(/\[NAMES_PASIEN_BARU\]/g, data.namesPasienBaru)
    .replace(/\[NAMES_PASIEN_PULANG\]/g, data.namesPasienPulang)
    .replace(/\[NAMES_PASIEN_LAMA\]/g, data.namesPasienLama)
    .replace(/\[NAMES_PASIEN_TOTAL_CARE\]/g, data.namesPasienTotalCare)
    .replace(/\[NAMES_PASIEN_EWS_PER_JAM\]/g, data.namesPasienEwsPerJam)
    .replace(/\[COUNT_ALL_PASIEN\]/g, String(data.countAllPasien))
    .replace(/\[COUNT_PASIEN_BARU\]/g, String(data.countPasienBaru))
    .replace(/\[COUNT_PASIEN_PULANG\]/g, String(data.countPasienPulang))
    .replace(/\[NAMA_RUANGAN\]/g, data.namaRuangan)
    .replace(/\[SHIFT\]/g, data.shift)
    .replace(/\[JAM_DATANG\]/g, data.jamDatang)
    .replace(/\[JAM_PULANG\]/g, data.jamPulang)
    .replace(/\[SHIFT_TIME1\]/g, data.shiftTime1)
    .replace(/\[SHIFT_TIME2\]/g, data.shiftTime2)
    .replace(/\[SHIFT_TIME3\]/g, data.shiftTime3)
    .replace(/\[TINDAKAN_DETAIL\]/g, data.tindakanDetail);

  return result;
}

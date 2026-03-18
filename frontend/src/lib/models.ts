import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  ruangan_rs?: string;
  role: 'USER' | 'ADMIN';
  status_langganan: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  berlaku_sampai?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  user_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: { type: String },
  ruangan_rs: { type: String },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  status_langganan: { type: String, enum: ['TRIAL', 'ACTIVE', 'EXPIRED'], default: 'TRIAL' },
  berlaku_sampai: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Patient Model
export interface IPatient extends Document {
  patient_id: string;
  user_id: string;
  nama_pasien: string;
  no_rm: string;
  no_billing?: string;
  diagnosa?: string;
  created_at: Date;
}

const PatientSchema = new Schema<IPatient>({
  patient_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  nama_pasien: { type: String, required: true },
  no_rm: { type: String, required: true },
  no_billing: { type: String },
  diagnosa: { type: String },
  created_at: { type: Date, default: Date.now },
});

export const Patient = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

// Logbook Model
export interface ITindakanItem {
  patient_id: string;
  nama_pasien: string;
  no_rm: string;
  no_billing?: string;
  diagnosa?: string;
  jenis_pasien: 'PASIEN_BARU' | 'PASIEN_LAMA' | 'PASIEN_PULANG';
  ketergantungan: 'ADL_SELF_CARE' | 'ADL_PARTIAL_CARE' | 'ADL_TOTAL_CARE';
  keterangan_tindakan: string[];
  catatan_lainnya?: string;
  oksigenasi: boolean;
  perawatan_luka_sederhana: boolean;
  pre_pasca_op: boolean;
  kompres_terbuka: boolean;
  memasang_infus_baru: boolean;
  memberikan_cairan_infus: boolean;
  memasang_ngt: boolean;
  transfusi_darah: boolean;
  nebu: boolean;
  memasang_dc_kateter: boolean;
  koreksi_caglukonas: boolean;
  koreksi_kcl: boolean;
  uji_lab: boolean;
}

export interface ILogbook extends Document {
  logbook_id: string;
  user_id: string;
  tanggal_dinas: string;
  shift: 'PAGI' | 'SIANG' | 'MALAM';
  jam_datang: string;
  jam_pulang: string;
  daftar_tindakan: ITindakanItem[];
  created_at: Date;
  updated_at: Date;
}

const TindakanItemSchema = new Schema<ITindakanItem>({
  patient_id: { type: String, required: true },
  nama_pasien: { type: String, required: true },
  no_rm: { type: String, required: true },
  no_billing: { type: String },
  diagnosa: { type: String },
  jenis_pasien: { type: String, enum: ['PASIEN_BARU', 'PASIEN_LAMA', 'PASIEN_PULANG'], default: 'PASIEN_LAMA' },
  ketergantungan: { type: String, enum: ['ADL_SELF_CARE', 'ADL_PARTIAL_CARE', 'ADL_TOTAL_CARE'], default: 'ADL_PARTIAL_CARE' },
  keterangan_tindakan: [{ type: String }],
  catatan_lainnya: { type: String },
  oksigenasi: { type: Boolean, default: false },
  perawatan_luka_sederhana: { type: Boolean, default: false },
  pre_pasca_op: { type: Boolean, default: false },
  kompres_terbuka: { type: Boolean, default: false },
  memasang_infus_baru: { type: Boolean, default: false },
  memberikan_cairan_infus: { type: Boolean, default: false },
  memasang_ngt: { type: Boolean, default: false },
  transfusi_darah: { type: Boolean, default: false },
  nebu: { type: Boolean, default: false },
  memasang_dc_kateter: { type: Boolean, default: false },
  koreksi_caglukonas: { type: Boolean, default: false },
  koreksi_kcl: { type: Boolean, default: false },
  uji_lab: { type: Boolean, default: false },
}, { _id: false });

const LogbookSchema = new Schema<ILogbook>({
  logbook_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  tanggal_dinas: { type: String, required: true },
  shift: { type: String, enum: ['PAGI', 'SIANG', 'MALAM'], required: true },
  jam_datang: { type: String, required: true },
  jam_pulang: { type: String, required: true },
  daftar_tindakan: [TindakanItemSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Logbook = mongoose.models.Logbook || mongoose.model<ILogbook>('Logbook', LogbookSchema);

// Ticket Model
export interface ITicket extends Document {
  ticket_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  kategori: string;
  subjek: string;
  pesan_user: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  balasan_admin?: string;
  created_at: Date;
  updated_at: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticket_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_email: { type: String, required: true },
  user_name: { type: String, required: true },
  kategori: { type: String, required: true },
  subjek: { type: String, required: true },
  pesan_user: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  balasan_admin: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

// PromoCode Model
export interface IPromoCode extends Document {
  code: string;
  discountPercentage: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
  isActive: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  maxUses: { type: Number, required: true, min: 1 },
  currentUses: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const PromoCode = mongoose.models.PromoCode || mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);

// Payment/Transaction Model
export interface ITransaction extends Document {
  transaction_id: string;
  order_id: string;
  user_id: string;
  user_email: string;
  amount: number;
  discount_amount: number;
  final_amount: number;
  promo_code?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  payment_type?: string;
  midtrans_token?: string;
  subscription_type: 'monthly' | 'yearly';
  created_at: Date;
  updated_at: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  transaction_id: { type: String, required: true, unique: true },
  order_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_email: { type: String, required: true },
  amount: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  promo_code: { type: String },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'], default: 'PENDING' },
  payment_type: { type: String },
  midtrans_token: { type: String },
  subscription_type: { type: String, enum: ['monthly', 'yearly'], required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

// ReportTemplate Model - Per-user dynamic report templates
export interface ITemplateItem {
  point: number;
  category: string;
  template: string;
}

export interface IReportTemplate extends Document {
  user_id: string;
  ekinerja_templates: ITemplateItem[];
  eremunerasi_templates: ITemplateItem[];
  updated_at: Date;
}

const TemplateItemSchema = new Schema<ITemplateItem>({
  point: { type: Number, required: true },
  category: { type: String, required: true },
  template: { type: String, required: true },
}, { _id: false });

const ReportTemplateSchema = new Schema<IReportTemplate>({
  user_id: { type: String, required: true, unique: true },
  ekinerja_templates: [TemplateItemSchema],
  eremunerasi_templates: [TemplateItemSchema],
  updated_at: { type: Date, default: Date.now },
});

export const ReportTemplate = mongoose.models.ReportTemplate || mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema);

// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateField(value: unknown, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    // Required check
    if (rule.required) {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return rule.message;
      }
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) continue;

    const strValue = String(value);

    // Min length check
    if (rule.minLength && strValue.length < rule.minLength) {
      return rule.message;
    }

    // Max length check
    if (rule.maxLength && strValue.length > rule.maxLength) {
      return rule.message;
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(strValue)) {
      return rule.message;
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return rule.message;
    }
  }

  return null;
}

export function validateForm(
  data: Record<string, unknown>,
  schema: Record<string, ValidationRule[]>
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Common validation schemas
export const PatientValidationSchema = {
  nama_pasien: [
    { required: true, message: 'Nama pasien wajib diisi' },
    { minLength: 2, message: 'Nama pasien minimal 2 karakter' },
    { maxLength: 100, message: 'Nama pasien maksimal 100 karakter' },
  ],
  no_rm: [
    { required: true, message: 'Nomor RM wajib diisi' },
    { minLength: 3, message: 'Nomor RM minimal 3 karakter' },
    { maxLength: 50, message: 'Nomor RM maksimal 50 karakter' },
    { pattern: /^[A-Za-z0-9\-\/]+$/, message: 'Nomor RM hanya boleh berisi huruf, angka, strip, dan garis miring' },
  ],
  no_billing: [
    { maxLength: 50, message: 'Nomor billing maksimal 50 karakter' },
  ],
  diagnosa: [
    { maxLength: 500, message: 'Diagnosa maksimal 500 karakter' },
  ],
};

export const TicketValidationSchema = {
  kategori: [
    { required: true, message: 'Kategori wajib dipilih' },
  ],
  subjek: [
    { required: true, message: 'Subjek wajib diisi' },
    { minLength: 5, message: 'Subjek minimal 5 karakter' },
    { maxLength: 200, message: 'Subjek maksimal 200 karakter' },
  ],
  pesan_user: [
    { required: true, message: 'Pesan wajib diisi' },
    { minLength: 10, message: 'Pesan minimal 10 karakter' },
    { maxLength: 2000, message: 'Pesan maksimal 2000 karakter' },
  ],
};

export const LogbookValidationSchema = {
  shift: [
    { required: true, message: 'Shift wajib dipilih' },
  ],
  jam_datang: [
    { required: true, message: 'Jam datang wajib diisi' },
    { pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, message: 'Format jam tidak valid' },
  ],
  jam_pulang: [
    { required: true, message: 'Jam pulang wajib diisi' },
    { pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, message: 'Format jam tidak valid' },
  ],
};

export const TindakanValidationSchema = {
  patient_id: [
    { required: true, message: 'Pasien wajib dipilih' },
  ],
  jenis_pasien: [
    { required: true, message: 'Status pasien wajib dipilih' },
  ],
  ketergantungan: [
    { required: true, message: 'Ketergantungan wajib dipilih' },
  ],
};

export const ProfileValidationSchema = {
  name: [
    { required: true, message: 'Nama wajib diisi' },
    { minLength: 2, message: 'Nama minimal 2 karakter' },
    { maxLength: 100, message: 'Nama maksimal 100 karakter' },
  ],
  ruangan_rs: [
    { maxLength: 100, message: 'Ruangan RS maksimal 100 karakter' },
  ],
};

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Indonesian format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
  return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
}

// Date validation
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Time validation (HH:MM format)
export function isValidTime(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export interface ReachOut {
  id: string;
  location_en: string;
  location_ar: string;
  phone: string;
  hours_en: string;
  hours_ar: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

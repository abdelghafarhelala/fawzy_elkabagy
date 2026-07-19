export interface ReachOut {
  id: string;
  location_en: string;
  location_ar: string;
  phone: string;
  hours_en: string;
  hours_ar: string;
  updated_at: string;
}

export interface LocationBranch {
  id: string;
  name_en: string;
  name_ar: string;
  address_en: string;
  address_ar: string;
  phones: string[];
  map_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
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

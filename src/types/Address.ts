export interface Address {
  city: string;
  created_at: number;
  id: string;
  is_default: boolean;
  location: { lat: number; lng: number };
  nationality: string;
  postal_code: number;
  street: string;
  title: string;
  updated_at: number;
}

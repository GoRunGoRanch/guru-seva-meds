export type UserRole = "servant" | "doctor";
export type DayType = "regular" | "dialysis";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Medication {
  id: string;
  sort_order: number;
  name: string;
  brand: string | null;
  dosage: string;
  frequency_count: number;
  frequency_label: string | null;
  scheduled_times: string[];
  routine: string | null;
  meal_relation: string | null;
  special_note: string | null;
  suggestions: string | null;
  dialysis_dosage: string | null;
  dialysis_scheduled_times: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Administration {
  id: string;
  medication_id: string;
  scheduled_time: string;
  dose_date: string;
  day_type: DayType;
  given_at: string;
  given_by: string;
  given_by_name: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  notes: string | null;
}

export interface DialysisDay {
  dose_date: string;
  is_dialysis: boolean;
  set_by: string | null;
  set_by_name: string | null;
  set_at: string;
}

export type DoseStatus = "given" | "overdue" | "upcoming";

export interface DoseSlot {
  medication: Medication;
  scheduled_time: string;
  dose_index: number;
  total_doses: number;
  effective_dosage: string;
  day_type: DayType;
  status: DoseStatus;
  given_at: string | null;
  given_by_name: string | null;
  minutes_overdue: number;
}

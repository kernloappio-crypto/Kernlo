import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars not set. Using localStorage fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tables = {
  users: {
    id: string;
    email: string;
    trial_start_date: string;
    trial_ended: boolean;
    is_paid: boolean;
    created_at: string;
  };
  kids: {
    id: string;
    user_id: string;
    name: string;
    age: number | null;
    grade: string | null;
    created_at: string;
  };
  activities: {
    id: string;
    user_id: string;
    child_name: string;
    subject: string;
    duration: number;
    platform: string;
    notes: string | null;
    date: string;
    created_at: string;
  };
  goals: {
    id: string;
    user_id: string;
    child_name: string;
    subject: string;
    monthly_hours: number;
    created_at: string;
  };
  reports: {
    id: string;
    user_id: string;
    child_name: string;
    report_type: string;
    generated_date: string;
    subjects: string[];
    report_content: string;
    created_at: string;
  };
  compliance_state: {
    id: string;
    user_id: string;
    state: string;
    created_at: string;
  };
};

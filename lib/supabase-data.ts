import { supabase } from './supabase-client';

/**
 * Supabase Data Layer
 * Replaces all localStorage data operations with Supabase real-time sync
 */

// ============ KIDS ============

export async function addKid(
  userId: string,
  name: string,
  age?: number,
  grade?: string
) {
  const { data, error } = await supabase
    .from('kids')
    .insert({
      user_id: userId,
      name,
      age: age || null,
      grade: grade || null,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getKids(userId: string) {
  const { data, error } = await supabase
    .from('kids')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateKid(
  kidId: string,
  updates: { name?: string; age?: number; grade?: string }
) {
  const { data, error } = await supabase
    .from('kids')
    .update(updates)
    .eq('id', kidId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deleteKid(kidId: string) {
  const { error } = await supabase.from('kids').delete().eq('id', kidId);

  if (error) throw error;
}

// ============ ACTIVITIES ============

export async function addActivity(
  userId: string,
  childName: string,
  subject: string,
  duration: number,
  platform: string,
  date: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      child_name: childName,
      subject,
      duration,
      platform,
      date,
      notes: notes || null,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getActivities(userId: string, childName?: string) {
  let query = supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId);

  if (childName) {
    query = query.eq('child_name', childName);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Sort client-side after RLS passes
  const sorted = data || [];
  sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sorted;
}

export async function deleteActivity(activityId: string) {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
}

// ============ GOALS ============

export async function addGoal(
  userId: string,
  childName: string,
  subject: string,
  monthlyHours: number
) {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      child_name: childName,
      subject,
      monthly_hours: monthlyHours,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getGoals(userId: string, childName?: string) {
  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId);

  if (childName) {
    query = query.eq('child_name', childName);
  }

  const { data, error } = await query.order('created_at', {
    ascending: true,
  });

  if (error) throw error;
  return data || [];
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);

  if (error) throw error;
}

// ============ REPORTS ============

export async function addReport(
  userId: string,
  childName: string,
  reportType: string,
  generatedDate: string,
  subjects: string[],
  reportContent: string
) {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      child_name: childName,
      report_type: reportType,
      generated_date: generatedDate,
      subjects,
      report_content: reportContent,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getReports(userId: string, childName?: string) {
  let query = supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId);

  if (childName) {
    query = query.eq('child_name', childName);
  }

  const { data, error } = await query.order('generated_date', {
    ascending: false,
  });

  if (error) throw error;
  return data || [];
}

export async function deleteReport(reportId: string) {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
}

// ============ COMPLIANCE STATE ============

export async function setComplianceState(userId: string, state: string, childName?: string) {
  // Delete existing state for this kid (or user if no childName)
  if (childName) {
    await supabase
      .from('compliance_state')
      .delete()
      .eq('user_id', userId)
      .eq('child_name', childName);
  } else {
    await supabase
      .from('compliance_state')
      .delete()
      .eq('user_id', userId);
  }

  // Insert new state
  const { data, error } = await supabase
    .from('compliance_state')
    .insert({
      user_id: userId,
      child_name: childName || null,
      state,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getComplianceState(userId: string, childName?: string) {
  let query = supabase
    .from('compliance_state')
    .select('*')
    .eq('user_id', userId);

  if (childName) {
    query = query.eq('child_name', childName);
  } else {
    query = query.is('child_name', null);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is okay
    throw error;
  }

  return data || null;
}

// ============ USER ============

export async function updateUserTrial(userId: string, isPaid: boolean) {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_paid: isPaid,
      trial_ended: isPaid,
    })
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getUserData(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ============ ATTENDANCE ============

/**
 * Get attendance records for a user + kid in a specific year
 */
export async function getAttendanceByYear(userId: string, childName: string, year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('child_name', childName)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get attendance records for a user + kid in current month
 */
export async function getAttendanceByMonth(userId: string, childName: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('child_name', childName)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get last N attendance dates for a kid
 */
export async function getLastAttendanceDates(userId: string, childName: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('attendance')
    .select('date')
    .eq('user_id', userId)
    .eq('child_name', childName)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((d) => d.date);
}

/**
 * Get total attendance days for a kid in a year
 */
export async function getAttendanceDaysYearly(userId: string, childName: string, year: number) {
  const records = await getAttendanceByYear(userId, childName, year);
  // Get unique dates (in case multiple entries per day)
  const uniqueDates = new Set(records.map((r) => r.date));
  return uniqueDates.size;
}

/**
 * Get total attendance days for a kid in current month
 */
export async function getAttendanceDaysMonthly(userId: string, childName: string, year: number, month: number) {
  const records = await getAttendanceByMonth(userId, childName, year, month);
  // Get unique dates (in case multiple entries per day)
  const uniqueDates = new Set(records.map((r) => r.date));
  return uniqueDates.size;
}

/**
 * Log attendance for a kid
 */
export async function logAttendance(userId: string, childName: string, date: string) {
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      child_name: childName,
      date,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Get attendance calendar data for a kid (returns all dates in year with day-of-week)
 */
export async function getAttendanceCalendar(userId: string, childName: string, year: number) {
  const records = await getAttendanceByYear(userId, childName, year);
  const dateMap: { [key: string]: boolean } = {};
  
  records.forEach((record) => {
    dateMap[record.date] = true;
  });

  return dateMap;
}

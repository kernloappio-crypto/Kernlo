import { supabase } from './supabase-client';

/**
 * Ensure auth session is restored on the supabase client
 * This is critical for RLS policies to work (auth.uid() must be set)
 * Called before every sensitive database operation
 */
export async function ensureAuthContext() {
  try {
    if (typeof window === 'undefined') return;
    
    // Try to get current session from client
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession && currentSession.access_token) {
      // Session already set and has token, good to go
      return;
    }
    
    // No valid session on client, try to restore from localStorage
    const sessionStr = localStorage.getItem('kernlo_session');
    if (sessionStr) {
      try {
        const savedSession = JSON.parse(sessionStr);
        
        // Check if saved session has required fields
        if (!savedSession.access_token || !savedSession.refresh_token) {
          console.warn('⚠️ Invalid session format in localStorage');
          return;
        }
        
        // Set the session on the client
        const { data, error } = await supabase.auth.setSession(savedSession);
        
        if (error) {
          console.warn('⚠️ Failed to restore session:', error.message);
          return;
        }
        
        if (data.session) {
          console.log('✅ Auth context restored from localStorage');
        }
      } catch (e) {
        console.warn('⚠️ Could not parse session from localStorage:', e);
      }
    } else {
      // No session in localStorage - user might not be logged in
      // This is okay, RLS will reject the operation
      console.warn('⚠️ No kernlo_session in localStorage - user may not be logged in');
    }
  } catch (err) {
    console.warn('⚠️ ensureAuthContext error:', err);
  }
}

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
  // Ensure auth context for RLS
  await ensureAuthContext();
  
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
    .gte('schooling_date', startDate)
    .lte('schooling_date', endDate)
    .order('schooling_date', { ascending: false });

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
    .gte('schooling_date', startDate)
    .lt('schooling_date', endDate)
    .order('schooling_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get last N attendance dates for a kid
 */
export async function getLastAttendanceDates(userId: string, childName: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('attendance')
    .select('schooling_date')
    .eq('user_id', userId)
    .eq('child_name', childName)
    .order('schooling_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((d) => d.schooling_date);
}

/**
 * Get total attendance days for a kid in a year
 */
export async function getAttendanceDaysYearly(userId: string, childName: string, year: number) {
  const records = await getAttendanceByYear(userId, childName, year);
  // Get unique dates (in case multiple entries per day)
  const uniqueDates = new Set(records.map((r) => r.schooling_date));
  return uniqueDates.size;
}

/**
 * Get total attendance days for a kid in current month
 */
export async function getAttendanceDaysMonthly(userId: string, childName: string, year: number, month: number) {
  const records = await getAttendanceByMonth(userId, childName, year, month);
  // Get unique dates (in case multiple entries per day)
  const uniqueDates = new Set(records.map((r) => r.schooling_date));
  return uniqueDates.size;
}

/**
 * Log attendance for a kid
 * IMPORTANT: Ensures auth context is set before inserting
 * Handles duplicate entries gracefully (idempotent)
 */
export async function logAttendance(userId: string, childName: string, date: string) {
  // Ensure auth session is set on client for RLS policy to work
  await ensureAuthContext();
  
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      child_name: childName,
      schooling_date: date,
    })
    .select();

  if (error) {
    // Check if it's a unique constraint violation (duplicate entry)
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      console.log('Attendance already exists for this date, returning existing record');
      // Fetch and return existing record
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('child_name', childName)
        .eq('schooling_date', date)
        .single();
      return existing;
    }
    
    console.error('logAttendance error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId,
      childName,
      date,
    });
    throw new Error(`Failed to log attendance: ${error.message}`);
  }
  return data?.[0];
}

/**
 * Get attendance calendar data for a kid (returns all dates in year with day-of-week)
 */
export async function getAttendanceCalendar(userId: string, childName: string, year: number) {
  const records = await getAttendanceByYear(userId, childName, year);
  const dateMap: { [key: string]: boolean } = {};
  
  records.forEach((record) => {
    dateMap[record.schooling_date] = true;
  });

  return dateMap;
}

// ============ EXTRACURRICULAR ACTIVITIES ============

export async function addExtracurricularActivity(
  userId: string,
  kidId: string,
  activityName: string,
  date: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('extracurricular_activities')
    .insert({
      user_id: userId,
      kid_id: kidId,
      activity_name: activityName,
      date,
      notes: notes || null,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getExtracurricularActivities(userId: string, kidId?: string) {
  let query = supabase
    .from('extracurricular_activities')
    .select('*')
    .eq('user_id', userId);

  if (kidId) {
    query = query.eq('kid_id', kidId);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteExtracurricularActivity(activityId: string) {
  const { error } = await supabase
    .from('extracurricular_activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
}

export async function updateExtracurricularActivity(
  activityId: string,
  updates: { activity_name?: string; date?: string; notes?: string; is_completed?: boolean }
) {
  const { data, error } = await supabase
    .from('extracurricular_activities')
    .update(updates)
    .eq('id', activityId)
    .select();

  if (error) throw error;
  return data?.[0];
}

// ============ FIELD TRIPS ============

export async function addFieldTrip(
  userId: string,
  kidId: string,
  tripName: string,
  destination: string,
  date: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('field_trips')
    .insert({
      user_id: userId,
      kid_id: kidId,
      trip_name: tripName,
      destination,
      date,
      notes: notes || null,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function getFieldTrips(userId: string, kidId?: string) {
  let query = supabase
    .from('field_trips')
    .select('*')
    .eq('user_id', userId);

  if (kidId) {
    query = query.eq('kid_id', kidId);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteFieldTrip(tripId: string) {
  const { error } = await supabase
    .from('field_trips')
    .delete()
    .eq('id', tripId);

  if (error) throw error;
}

export async function updateFieldTrip(
  tripId: string,
  updates: { trip_name?: string; destination?: string; date?: string; notes?: string; is_completed?: boolean }
) {
  const { data, error } = await supabase
    .from('field_trips')
    .update(updates)
    .eq('id', tripId)
    .select();

  if (error) throw error;
  return data?.[0];
}

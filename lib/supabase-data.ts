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

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data || [];
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

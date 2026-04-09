export interface Subject {
  id: string;
  date: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

export interface Report {
  id: string;
  workspace_id: string;
  kid_id: string;
  child_name: string;
  report_type: "daily" | "weekly";
  generated_date: string;
  subjects: Subject[];
  report_content: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface Kid {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  state?: string;
  created_at: string;
}

export interface ActivityTemplate {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  platform: string;
  created_at: string;
}

export interface Goal {
  id: string;
  workspace_id: string;
  kid_id: string;
  subject: string;
  monthly_hours: number;
  created_at: string;
}

export interface ComplianceSetting {
  id: string;
  workspace_id: string;
  state: string;
  requirements: {
    [subject: string]: number;
  };
  created_at: string;
}

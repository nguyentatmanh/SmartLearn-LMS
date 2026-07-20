export type AdminTab = 'overview' | 'users' | 'teacher-approvals' | 'courses' | 'reports' | 'audit-logs' | 'settings';

export interface StudentProfileSummary {
  enrolled_courses_count: number;
  active_courses_count: number;
  completed_courses_count: number;
  completed_lessons_count: number;
}

export interface TeacherProfileDetail {
  faculty: string;
  department: string;
  specialization: string;
  academic_title?: string | null;
  teacher_code?: string | null;
  bio?: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  total_courses: number;
  published_courses: number;
  total_students: number;
}

export interface AdminProfileSummary {
  admin_level: string;
}

export interface UserActivityItem {
  id: number;
  event_type: string;
  result: string;
  created_at: string;
  ip_address?: string | null;
  description: string;
  activity_category: 'target' | 'actor';
}

export interface DiscriminatedUserProfile {
  type: 'student' | 'teacher' | 'admin';
  student_details?: StudentProfileSummary | null;
  teacher_details?: TeacherProfileDetail | null;
  admin_details?: AdminProfileSummary | null;
}

export interface UserDetailResponse {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  profile?: DiscriminatedUserProfile | null;
  recent_activities: UserActivityItem[];
}

export interface UserItem {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name?: string;
    phone_number?: string;
    date_of_birth?: string;
    avatar_url?: string;
  };
  teacher_profile?: {
    id: number;
    faculty?: string;
    department?: string;
    specialization?: string;
    academic_title?: string;
    teacher_code?: string;
    bio?: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    reviewed_at?: string;
  };
}

export interface CourseItem {
  id: number;
  title: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  cover_display_url?: string;
  category?: string;
  level: string;
  status: 'draft' | 'published' | 'archived';
  review_status: 'not_submitted' | 'pending' | 'approved' | 'changes_requested';
  content_revision: number;
  submitted_revision?: number;
  approved_revision?: number;
  submitted_for_review_at?: string;
  reviewed_at?: string;
  review_note?: string;
  teacher_id: number;
  teacher?: {
    id: number;
    full_name: string;
    email: string;
  };
  chapters_count?: number;
  lessons_count?: number;
  enrollments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: number;
  event_type: string;
  actor_id?: number;
  target_type: string;
  target_id?: string;
  result: 'success' | 'failure';
  sanitized_details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  id: number;
  require_teacher_approval: boolean;
  require_email_verification: boolean;
  require_course_review: boolean;
  updated_at: string;
  updated_by?: number;
}

export interface OverviewMetrics {
  total_users: number;
  active_users: number;
  students: number;
  teachers: number;
  admins: number;
  unverified_users: number;
  published_courses: number;
  draft_courses: number;
  archived_courses: number;
  pending_course_reviews: number;
  pending_teacher_requests: number;
  orphan_teachers: number;
}

export interface AttentionItem {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  count: number;
  action_tab: AdminTab;
}

export interface OverviewData {
  metrics: OverviewMetrics;
  attention_items: AttentionItem[];
  recent_audit_logs: AuditLogItem[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export interface ProjectMember extends User {}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number;
  actualHours: number | null;
  completedAt: string | null;
  assignee_id: number | null;
  assignee?: ProjectMember;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  estimatedHours?: number;
  actualHours?: number | null;
  assignee_id?: number | null;
}

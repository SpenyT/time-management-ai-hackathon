export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  title: string;
  description: string;
  estimatedDuration: number;
  priority: TaskPriority;
  deadline: string | null;       // ISO date string or null
  subject: string;               // category (work, school, errands, etc.)

  difficulty?: 'easy' | 'medium' | 'hard';
}
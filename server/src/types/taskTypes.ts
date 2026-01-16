export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
  task: Task;
  reason: string;
}

export interface ScheduleResponse {
  schedule: TimeBlock[];
  unscheduledTasks: Task[];
  optimizationStrategy: string;
}
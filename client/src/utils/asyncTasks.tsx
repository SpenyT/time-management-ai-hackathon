import axios from 'axios';
import type { Task } from '@/types/taskTypes';

type ExtractTasksResponse = {
  tasks: (Task & { id: string })[];
  extractedCount: number;
};

const apiBaseURL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:3001';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' }
});

export async function extractTasks(params: { text: string; userContext?: string }) {
  const { data } = await api.post<ExtractTasksResponse>('/api/tasks/extract', params);
  return data;
}
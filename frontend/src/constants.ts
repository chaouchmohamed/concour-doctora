import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_NAME = 'ConcoursDoctor';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',
  DASHBOARD: '/dashboard',
  CANDIDATES: '/candidates',
  IMPORT: '/import',
  EXAM_PLANNING: '/planning',
  SUPERVISOR: '/supervisor',
  ANONYMIZATION: '/anonymization',
  CORRECTION: '/correction',
  DISCREPANCIES: '/discrepancies',
  DELIBERATION: '/deliberation',
  RESULTS: '/results',
  REPORTS: '/reports',
  USERS: '/users',
  AUDIT: '/audit',
  SETTINGS: '/settings',
};

export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');


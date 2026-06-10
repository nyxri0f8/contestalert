import { type DeadlineStatus } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get deadline status based on remaining time
 */
export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const hoursLeft = diff / (1000 * 60 * 60);
  const daysLeft = hoursLeft / 24;

  if (daysLeft > 7) return 'safe';
  if (daysLeft > 3) return 'warn';
  if (hoursLeft > 24) return 'urgent';
  return 'critical';
}

/**
 * Format deadline remaining time as human-readable string
 */
export function formatDeadline(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/**
 * Format a date string to a localized display format
 */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Generate a ticket ID format: EVT-YYYY-XXXXXX
 */
export function generateTicketId(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVT-${year}-${random}`;
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    technical: 'Technical',
    non_technical: 'Non-Technical',
    hackathon: 'Hackathon',
    workshop: 'Workshop',
    symposium: 'Symposium',
    placement: 'Placement',
    internship: 'Internship',
    sports: 'Sports',
    cultural: 'Cultural',
  };
  return map[category] || category;
}

/**
 * Get a short department label
 */
export function getDepartmentLabel(department: string): string {
  const map: Record<string, string> = {
    ECE: 'ECE',
    CSE: 'CSE',
    AIDS: 'AI&DS',
    AIML: 'AI&ML',
    CCE: 'CCE',
    Biotechnology: 'BT',
    Mechanical: 'ME',
  };
  return map[department] || department;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Format large numbers (e.g., 1200 -> 1.2K)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

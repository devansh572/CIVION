import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-800 border-red-200',
    assigned: 'bg-orange-100 text-orange-800 border-orange-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || colors.open;
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity] || colors.medium;
}

export function getPriorityColor(score: number): string {
  if (score >= 70) return 'text-red-600 bg-red-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

export function getPriorityLevel(score: number): string {
  if (score >= 70) return 'Critical';
  if (score >= 40) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
}

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const CATEGORY_ICONS: Record<string, string> = {
  pothole: '🕳️',
  garbage: '🗑️',
  broken_streetlight: '💡',
  water_leakage: '💧',
  drainage: '🚰',
  road_damage: '🛣️',
  illegal_dumping: '⚠️',
  other: '📋',
};

export const CATEGORY_COLORS: Record<string, string> = {
  pothole: '#ef4444',
  garbage: '#f59e0b',
  broken_streetlight: '#8b5cf6',
  water_leakage: '#3b82f6',
  drainage: '#06b6d4',
  road_damage: '#f97316',
  illegal_dumping: '#dc2626',
  other: '#6b7280',
};

export const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
export const DEFAULT_ZOOM = 12;

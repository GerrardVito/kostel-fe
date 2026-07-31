import type { Notification } from '../types';

const categoryColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  payment: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  approval: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  room_change: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  warning: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  lease: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
};

function getCategory(type: string): string {
  if (type.includes('payment')) return 'payment';
  if (type.includes('application') || type.includes('room_assigned')) return 'approval';
  if (type.includes('room_change') || type.includes('room_switch')) return 'room_change';
  if (type.includes('warning') || type.includes('eviction')) return 'warning';
  return 'lease';
}

interface NotificationCardProps {
  notification: Notification;
  onAction?: () => void;
  actionLabel?: string;
}

export default function NotificationCard({ notification, onAction, actionLabel }: NotificationCardProps) {
  const cat = categoryColors[getCategory(notification.type)];
  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <div
      className={`${cat.bg} border ${cat.border} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${cat.badge} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
              {notification.type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{timeAgo}</span>
          </div>
          <h4 className={`font-sans font-bold text-sm ${cat.text} leading-snug`}>
            {notification.title}
          </h4>
          <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        </div>
        {onAction && actionLabel && (
          <button
            className={`${cat.text} border border-current hover:bg-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 cursor-pointer transition-colors`}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
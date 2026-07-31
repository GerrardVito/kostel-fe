import NotificationCard from './NotificationCard';
import type { Notification } from '../types';

interface NotificationSectionProps {
  title: string;
  count: number;
  notifications: Notification[];
  category: string;
  onAction?: (notification: Notification) => void;
  actionLabels?: Record<number, string>;
}

export default function NotificationSection({
  title,
  count,
  notifications,
  category,
  onAction,
  actionLabels,
}: NotificationSectionProps) {
  if (notifications.length === 0) return null;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <div
        className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${getSectionBg(category)}`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-slate-900 text-sm">{title}</h3>
          <span className="w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center">
            {count}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.notification_id}
            notification={notification}
            onAction={
              onAction
                ? () => onAction(notification)
                : undefined
            }
            actionLabel={
              actionLabels?.[notification.notification_id]
            }
          />
        ))}
      </div>
    </section>
  );
}

function getSectionBg(category: string): string {
  switch (category) {
    case 'payment': return 'bg-blue-50';
    case 'approval': return 'bg-amber-50';
    case 'room_change': return 'bg-violet-50';
    case 'warning': return 'bg-rose-50';
    case 'lease': return 'bg-emerald-50';
    default: return 'bg-slate-50';
  }
}
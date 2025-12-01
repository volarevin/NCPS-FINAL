import { Bell, CheckCircle2, XCircle, AlertCircle, CheckCheck, Calendar, X } from 'lucide-react';

interface NotificationCardProps {
  notification: {
    notification_id?: number;
    id?: string | number;
    title: string;
    message: string;
    created_at?: string;
    time?: string;
    is_read?: number;
    service_name?: string;
  };
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function NotificationCard({ notification, onClick, onDelete }: NotificationCardProps) {
  const getIcon = () => {
    const title = notification.title || '';
    if (title.includes('Approved')) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (title.includes('Rejected')) return <XCircle className="w-5 h-5 text-red-500" />;
    if (title.includes('Cancelled')) return <AlertCircle className="w-5 h-5 text-orange-500" />;
    if (title.includes('Completed')) return <CheckCheck className="w-5 h-5 text-blue-500" />;
    return <Bell className="w-5 h-5 text-[#4DBDCC]" />;
  };

  const dateStr = notification.created_at || notification.time;

  return (
    <div 
      onClick={onClick}
      className={`relative border-l-4 border-l-[#4DBDCC] bg-white dark:bg-card p-4 rounded-r-lg shadow-sm hover:shadow-md transition-all cursor-pointer mb-3 border border-gray-100 dark:border-border group`}
    >
      {onDelete && (
        <button 
            onClick={onDelete}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
            title="Delete notification"
        >
            <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex gap-3 pr-6">
        <div className="mt-1 flex-shrink-0">
            {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-[#0B4F6C] dark:text-primary text-sm md:text-base truncate pr-2">{notification.title}</h4>
                <span className="text-[10px] text-gray-400 dark:text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {dateStr ? new Date(dateStr).toLocaleDateString() : ''}
                </span>
            </div>
            
            {notification.service_name && (
                <p className="text-xs font-medium text-gray-700 dark:text-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400 dark:text-muted-foreground" />
                    {notification.service_name}
                </p>
            )}
            
            <p className="text-gray-600 dark:text-muted-foreground text-xs md:text-sm mt-1 line-clamp-2">{notification.message}</p>
        </div>
      </div>
    </div>
  );
}

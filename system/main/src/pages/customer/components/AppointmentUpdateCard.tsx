import { Calendar, Clock } from 'lucide-react';

interface AppointmentUpdateCardProps {
  update: {
    service: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    message: string;
  };
  onClick?: () => void;
}

export function AppointmentUpdateCard({ update, onClick }: AppointmentUpdateCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-orange-500',
    confirmed: 'bg-blue-500',
    in_progress: 'bg-blue-600',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div 
      onClick={onClick}
      className={`border border-gray-200 rounded-lg p-3 hover:border-[#4DBDCC] hover:shadow-sm transition-all duration-200 bg-white ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-1.5 md:mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[#0B4F6C] font-medium text-sm md:text-base truncate">{update.service}</h4>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
              <Calendar className="w-3 h-3 text-[#4DBDCC]" />
              <span>{update.date}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
              <Clock className="w-3 h-3 text-[#4DBDCC]" />
              <span>{update.time}</span>
            </div>
          </div>
        </div>
        <span className={`${statusColors[update.status]} text-white px-2 py-0.5 rounded text-[10px] md:text-xs whitespace-nowrap ml-2`}>
          {statusLabels[update.status]}
        </span>
      </div>
      <p className="text-xs md:text-sm text-gray-600 mt-1.5 md:mt-2">{update.message}</p>
    </div>
  );
}

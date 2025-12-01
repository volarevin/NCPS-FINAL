import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "./AppointmentSchedule";

interface ReceptionistCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export function ReceptionistCalendar({ appointments, onAppointmentClick }: ReceptionistCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
        // const aptDate = new Date(apt.date); // Assuming apt.date is a string or Date object that can be parsed
        // If apt.date is a formatted string like "October 10, 2023", new Date() handles it.
        // If it's ISO, it also works.
        // Let's be safe and try to use rawDate if available, or parse the date string.
        const d = apt.createdAt ? new Date(apt.date) : new Date(apt.date); 
        
        return d.getDate() === date.getDate() && 
               d.getMonth() === date.getMonth() && 
               d.getFullYear() === date.getFullYear();
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  // Empty cells for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] bg-gray-50/50 dark:bg-muted/20 border border-gray-100 dark:border-border" />);
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayAppointments = getAppointmentsForDate(date);
    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
    const hasAppointments = dayAppointments.length > 0;

    days.push(
      <div 
        key={day} 
        className={`min-h-[80px] md:min-h-[100px] border border-gray-100 dark:border-border p-2 transition-all cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/40
            ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10 ring-1 ring-inset ring-[#0B4F6C]/20 dark:ring-primary/20' : ''}
        `}
        onClick={() => handleDayClick(day)}
      >
        <div className="flex flex-col h-full justify-between">
            <div className={`font-medium text-sm flex justify-between items-start ${isToday ? 'text-[#0B4F6C] dark:text-primary' : 'text-gray-700 dark:text-foreground'}`}>
                <span className={`
                    ${isToday ? "bg-[#0B4F6C] dark:bg-sky-600 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-sm" : "w-7 h-7 flex items-center justify-center"}
                `}>
                    {day}
                </span>
            </div>
            
            {hasAppointments && (
                <div className="mt-1 space-y-1">
                    <div className="hidden md:block space-y-1">
                        {dayAppointments.slice(0, 2).map((apt, idx) => (
                            <div key={idx} className={`text-[10px] px-1.5 py-0.5 rounded truncate border
                                ${apt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                  apt.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                  'bg-orange-50 text-orange-700 border-orange-100'}
                            `}>
                                {apt.time} - {apt.service}
                            </div>
                        ))}
                        {dayAppointments.length > 2 && (
                            <div className="text-[10px] text-gray-500 pl-1">
                                +{dayAppointments.length - 2} more
                            </div>
                        )}
                    </div>
                    {/* Mobile dot indicator */}
                    <div className="md:hidden flex justify-center gap-0.5">
                        {dayAppointments.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-[#0B4F6C]" />
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-border">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#0B4F6C] dark:text-primary" />
            {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                    {day}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7">
            {days}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>
                    Appointments for {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedDate && getAppointmentsForDate(selectedDate).length > 0 ? (
                    getAppointmentsForDate(selectedDate).map((apt) => (
                        <div 
                            key={apt.id} 
                            className="p-3 rounded-lg border border-gray-100 dark:border-border hover:bg-gray-50 dark:hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                                onAppointmentClick(apt);
                                setIsDialogOpen(false);
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-foreground">{apt.clientName}</h4>
                                <Badge variant="secondary" className={`
                                    ${apt.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      apt.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}
                                `}>
                                    {apt.status}
                                </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-500 dark:text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    {apt.time}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {apt.address}
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    {apt.service}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 dark:text-muted-foreground py-8">No appointments scheduled for this day.</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

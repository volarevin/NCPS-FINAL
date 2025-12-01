import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";

interface TechnicianCalendarProps {
  appointments: any[];
  setSelectedAppointment: (apt: any) => void;
}

export function TechnicianCalendar({ appointments, setSelectedAppointment }: TechnicianCalendarProps) {
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
        const aptDate = new Date(apt.rawDate);
        return aptDate.getDate() === date.getDate() && 
               aptDate.getMonth() === date.getMonth() && 
               aptDate.getFullYear() === date.getFullYear();
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
    days.push(<div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] bg-muted/20 border border-border" />);
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
        className={`min-h-[80px] md:min-h-[100px] border border-border p-2 transition-all cursor-pointer hover:bg-primary/10 active:bg-primary/20
            ${isToday ? 'bg-primary/5 ring-1 ring-inset ring-[#0B4F6C]/20 dark:ring-primary/20' : ''}
        `}
        onClick={() => handleDayClick(day)}
      >
        <div className="flex flex-col h-full justify-between">
            <div className={`font-medium text-sm flex justify-between items-start ${isToday ? 'text-[#0B4F6C] dark:text-primary' : 'text-muted-foreground'}`}>
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
                                ${apt.status === 'Completed' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                  apt.status === 'In Progress' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                  apt.status === 'Cancelled' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                                  'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'}
                            `}>
                                {apt.time} - {apt.service}
                            </div>
                        ))}
                        {dayAppointments.length > 2 && (
                            <div className="text-[10px] text-muted-foreground pl-1">
                                +{dayAppointments.length - 2} more
                            </div>
                        )}
                    </div>
                    {/* Mobile View: Dots */}
                    <div className="md:hidden flex gap-1 justify-center">
                        {dayAppointments.slice(0, 3).map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-[#0B4F6C] dark:bg-primary" />
                        ))}
                        {dayAppointments.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-muted" />}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  const selectedDayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <>
    <Card className="shadow-md border-none bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
        <CardTitle className="text-xl font-bold text-[#0B4F6C] dark:text-primary flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {monthNames[month]} {year}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="hover:bg-[#0B4F6C] hover:text-white dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())} className="text-xs px-3 w-auto">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="hover:bg-[#0B4F6C] hover:text-white dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-muted/50 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center font-semibold text-muted-foreground text-sm py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-white dark:bg-card">
          {days}
        </div>
      </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </DialogTitle>
                <DialogDescription>
                    {selectedDayAppointments.length} appointment{selectedDayAppointments.length !== 1 ? 's' : ''} scheduled
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 mt-4">
                {selectedDayAppointments.length > 0 ? (
                    selectedDayAppointments.map((apt) => (
                        <div 
                            key={apt.id}
                            className="p-3 rounded-lg border border-gray-200 dark:border-border hover:border-[#0B4F6C] dark:hover:border-primary hover:shadow-sm transition-all cursor-pointer bg-white dark:bg-card"
                            onClick={() => {
                                setSelectedAppointment(apt);
                                setIsDialogOpen(false);
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-foreground">{apt.service}</h4>
                                <Badge variant={
                                    apt.status === 'Completed' ? 'default' : 
                                    apt.status === 'In Progress' ? 'secondary' :
                                    apt.status === 'Cancelled' ? 'destructive' : 'outline'
                                } className={`
                                    ${apt.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' :
                                      apt.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50' :
                                      apt.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' :
                                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'} border-none
                                `}>
                                    {apt.status}
                                </Badge>
                            </div>
                            
                            <div className="space-y-1.5 text-sm text-gray-600 dark:text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                                    <span>{apt.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                                    <span>{apt.customerName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                                    <span className="truncate">{apt.address || "No address provided"}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-muted" />
                        <p>No appointments scheduled for this day.</p>
                    </div>
                )}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}

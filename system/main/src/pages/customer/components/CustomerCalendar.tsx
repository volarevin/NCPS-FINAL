import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";

interface CustomerCalendarProps {
  appointments: any[];
  setSelectedAppointment: (apt: any) => void;
  onViewAppointment: (apt: any) => void;
  onCreateAppointment: (date: Date) => void;
}

export function CustomerCalendar({ appointments, setSelectedAppointment, onViewAppointment, onCreateAppointment }: CustomerCalendarProps) {
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
        // Handle both rawDate (YYYY-MM-DD) and date object/string
        const aptDate = apt.rawDate ? new Date(apt.rawDate) : new Date(apt.date);
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
                                  apt.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
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
                    {/* Mobile View: Dots */}
                    <div className="md:hidden flex gap-1 justify-center">
                        {dayAppointments.slice(0, 3).map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-[#0B4F6C]" />
                        ))}
                        {dayAppointments.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
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
    <Card className="shadow-md border-none bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-[#0B4F6C] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {monthNames[month]} {year}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="hover:bg-[#0B4F6C] hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())} className="text-xs px-3 w-auto">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="hover:bg-[#0B4F6C] hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center font-semibold text-gray-500 text-sm py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-white">
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
                            className="p-3 rounded-lg border border-gray-200 hover:border-[#0B4F6C] hover:shadow-sm transition-all cursor-pointer bg-white"
                            onClick={() => {
                                setSelectedAppointment(apt);
                                onViewAppointment(apt);
                                setIsDialogOpen(false);
                            }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900">{apt.service}</h4>
                                <Badge variant={
                                    apt.status === 'completed' ? 'default' : 
                                    apt.status === 'in_progress' ? 'secondary' :
                                    apt.status === 'cancelled' ? 'destructive' : 'outline'
                                } className={`
                                    ${apt.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                      apt.status === 'in_progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                      apt.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                      'bg-orange-100 text-orange-800 hover:bg-orange-200'} border-none
                                `}>
                                    {apt.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            
                            <div className="space-y-1.5 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>{apt.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{apt.technician}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No appointments scheduled for this day.</p>
                    </div>
                )}
            </div>
            
            <DialogFooter className="mt-6">
                {selectedDate && selectedDate >= new Date(new Date().setHours(0,0,0,0)) && (
                    <Button 
                        className="w-full bg-[#3FA9BC] hover:bg-[#2A6570]"
                        onClick={() => {
                            if (selectedDate) {
                                onCreateAppointment(selectedDate);
                                setIsDialogOpen(false);
                            }
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Book Appointment on this Day
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

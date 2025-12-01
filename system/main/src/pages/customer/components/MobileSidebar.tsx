import { useState } from 'react';
import { LayoutDashboard, Calendar, User, LogOut, X, Wrench } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";

type Page = 'dashboard' | 'appointments' | 'profile' | 'services';

interface MobileSidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onClose: () => void;
}

export function MobileSidebar({ currentPage, onNavigate, onClose }: MobileSidebarProps) {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services' as Page, label: 'Services', icon: Wrench },
    { id: 'appointments' as Page, label: 'Appointments', icon: Calendar },
    { id: 'profile' as Page, label: 'My Profile', icon: User },
  ];

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <div className="fixed inset-y-0 left-0 w-64 bg-[#0B4F6C] text-white shadow-2xl z-50 md:hidden animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#145A75]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#4DBDCC] flex items-center justify-center bg-[#4DBDCC] p-1.5 shadow-lg">
              <img 
                src="https://img.icons8.com/?size=100&id=4RpOhIzbPx4i&format=png&color=042D62"
                alt="NCPS Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wide">NCPS</span>
              <span className="text-[10px] font-bold text-[#4DBDCC] tracking-widest">CUSTOMER</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#145A75] rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-[#145A75] text-white shadow-lg'
                    : 'text-[#B5D9D9] hover:bg-[#145A75]/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#145A75] absolute bottom-0 left-0 right-0">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-red-500 hover:bg-red-600">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

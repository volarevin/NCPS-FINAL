import { useState, useEffect } from 'react';
import { Calendar, LogOut, LayoutDashboard, User, X } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ currentPage, onNavigate, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user') || '{}'));

  useEffect(() => {
    const handleProfileUpdate = () => {
      const updatedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      setUser(updatedUser);
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'account', label: 'My Profile', icon: User },
  ];

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

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
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B4F6C] text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header with Logo */}
        <div className="p-6 flex items-center gap-3">
          <Logo size="md" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] lg:text-xs font-medium text-blue-200 uppercase tracking-wider">Receptionist Portal</span>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-white hover:bg-[#145A75] p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 font-medium shadow-sm'
                    : 'hover:bg-white/10 hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#4DBDCC]" : "text-gray-300"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {user.profile_picture ? (
                  <img src={getProfilePictureUrl(user.profile_picture)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-300" />
                )}
             </div>
             <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{user.firstName} {user.lastName}</span>
                <span className="text-xs text-gray-400 truncate">{user.email}</span>
             </div>
          </div>
          <Button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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

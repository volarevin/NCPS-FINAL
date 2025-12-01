import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Wrench, 
  Calendar, 
  Users, 
  FileText, 
  HardHat,
  LogOut,
  X,
  User,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl } from "@/lib/utils";
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
import { Logo } from "@/components/Logo";

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function Sidebar({ currentPage = "Dashboard", onNavigate, mobileMenuOpen = false, setMobileMenuOpen }: SidebarProps) {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user') || '{}'));

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(JSON.parse(sessionStorage.getItem('user') || '{}'));
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Manage Services", icon: Wrench },
    { name: "Appointments", icon: Calendar },
    { name: "Technicians", icon: HardHat },
    { name: "User Account", icon: Users },
    { name: "Reports", icon: FileText },
    { name: "Audit Logs", icon: History },
    { name: "My Profile", icon: User },
  ];

  const handleNavigation = (page: string) => {
    onNavigate?.(page);
    setMobileMenuOpen?.(false);
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
      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}
      
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B4F6C] text-white flex flex-col h-screen shadow-xl transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <Logo size="md" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] lg:text-xs font-medium text-blue-200 uppercase tracking-wider">Admin Portal</span>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen?.(false)}
            className="lg:hidden text-white hover:bg-[#145A75] p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === currentPage;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/20 font-medium shadow-sm"
                    : "hover:bg-white/10 hover:translate-x-1"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#4DBDCC]" : "text-gray-300"}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Log out button */}
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
            className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <LogOut className="w-5 h-5" />
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

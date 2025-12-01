import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Appointments } from "./components/Appointments";
import { Services } from "./components/Services";
import { Technicians } from "./components/Technicians";
import { UserAccounts } from "./components/UserAccounts";
import { Reports } from "./components/Reports";
import { AuditLogs } from "./components/AuditLogs";
import { MobileHeader } from "./components/MobileHeader";
import ProfilePage from "../common/ProfilePage";
import TopBar from "../../components/TopBar";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Admin Dashboard";
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "Appointments":
        return <Appointments />;
      case "Manage Services":
        return <Services />;
      case "Technicians":
        return <Technicians />;
      case "User Account":
        return <UserAccounts />;
      case "Reports":
        return <Reports />;
      case "Audit Logs":
        return <AuditLogs />;
      case "My Profile":
        return <ProfilePage />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar 
        currentPage={activeTab} 
        onNavigate={setActiveTab} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden">
          <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
        </div>
        
        <div className="hidden lg:block">
          <TopBar onProfileClick={() => setActiveTab("My Profile")} />
        </div>
        
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300 ${mobileMenuOpen ? 'lg:brightness-100 brightness-50' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

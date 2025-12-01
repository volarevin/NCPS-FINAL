import { useState, useEffect } from 'react';
import { CustomerSidebar } from './components/CustomerSidebar';
import { CustomerDashboard } from './components/CustomerDashboard';
import { CustomerAppointments } from './components/CustomerAppointments';
import ProfilePage from '../common/ProfilePage';
import { CustomerServices } from './components/CustomerServices';
import { MobileHeader } from './components/MobileHeader';
import { MobileSidebar } from './components/MobileSidebar';
import TopBar from '../../components/TopBar';

export type Page = 'dashboard' | 'appointments' | 'profile' | 'services';

export default function CustomerPage() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Customer Dashboard";
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <CustomerSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <MobileHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          {/* Dimmed Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar */}
          <MobileSidebar 
            currentPage={currentPage} 
            onNavigate={(page) => {
              setCurrentPage(page);
              setIsMobileSidebarOpen(false);
            }}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </>
      )}
      
      <main className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
        <div className="hidden lg:block">
          <TopBar onProfileClick={() => setCurrentPage('profile')} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && <CustomerDashboard />}
          {currentPage === 'services' && <CustomerServices />}
          {currentPage === 'appointments' && <CustomerAppointments />}
          {currentPage === 'profile' && <ProfilePage />}
        </div>
      </main>
    </div>
  );
}

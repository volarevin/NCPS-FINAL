import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NavbarPublic() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check auth
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    const role = user.role?.toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'technician') return '/technician';
    if (role === 'receptionist') return '/receptionist';
    return '/customer';
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm py-3" 
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative h-16 w-16 flex items-center justify-center bg-white/90 rounded-full shadow-sm p-1">
            <img 
              src="http://localhost:5000/uploads/logo/ncps.png" 
              alt="NCPS Logo" 
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          </div>
          <span className={cn(
            "text-2xl font-bold tracking-tight transition-colors",
            isScrolled ? "text-[#0B4F6C] dark:text-primary" : "text-[#0B4F6C] dark:text-white"
          )}>
            NCPS
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('services')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Services
          </button>
          <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Why Us
          </button>
          <button onClick={() => scrollToSection('testimonials')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Testimonials
          </button>
          <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Contact
          </button>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Button onClick={() => navigate(getDashboardPath())} className="bg-[#0B4F6C] hover:bg-[#093e54] text-white gap-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')} className="font-medium">
                Log In
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-[#0B4F6C] hover:bg-[#093e54] text-white">
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
          <button onClick={() => scrollToSection('services')} className="text-left text-lg font-medium py-2 border-b border-border/50">
            Services
          </button>
          <button onClick={() => scrollToSection('features')} className="text-left text-lg font-medium py-2 border-b border-border/50">
            Why Us
          </button>
          <button onClick={() => scrollToSection('testimonials')} className="text-left text-lg font-medium py-2 border-b border-border/50">
            Testimonials
          </button>
          <button onClick={() => scrollToSection('contact')} className="text-left text-lg font-medium py-2 border-b border-border/50">
            Contact
          </button>
          <div className="flex flex-col gap-3 mt-4">
            {user ? (
              <Button onClick={() => navigate(getDashboardPath())} className="w-full justify-center gap-2 bg-[#0B4F6C] hover:bg-[#093e54] text-white">
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full justify-center gap-2">
                  <LogIn className="w-4 h-4" /> Log In
                </Button>
                <Button onClick={() => navigate('/register')} className="w-full justify-center gap-2 bg-[#0B4F6C] hover:bg-[#093e54] text-white">
                  <UserPlus className="w-4 h-4" /> Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

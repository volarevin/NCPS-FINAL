import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, LayoutDashboard } from 'lucide-react';

export function Hero() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    const role = user.role?.toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'technician') return '/technician';
    if (role === 'receptionist') return '/receptionist';
    return '/customer';
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-background">
      {/* Background Gradient - More subtle/neutral */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-background to-background dark:from-blue-900/20 -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Text Content */}
        <div className="flex-1 text-center lg:text-left space-y-8 animate-in slide-in-from-bottom-10 duration-700 fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B4F6C]/10 text-[#0B4F6C] dark:text-primary text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B4F6C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B4F6C]"></span>
            </span>
            Now accepting new service requests
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Professional Care & <br className="hidden lg:block" />
            <span className="text-[#0B4F6C] dark:text-primary">Service, Simplified.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Book trusted technicians, track your service progress in real-time, and get your devices back in top shape without the hassle.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            {user ? (
              <Button 
                size="lg" 
                onClick={() => navigate(getDashboardPath())}
                className="bg-[#0B4F6C] hover:bg-[#093e54] text-white text-lg px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <LayoutDashboard className="mr-2 w-5 h-5" /> Go to Dashboard
              </Button>
            ) : (
              <Button 
                size="lg" 
                onClick={() => navigate('/register')}
                className="bg-[#0B4F6C] hover:bg-[#093e54] text-white text-lg px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 h-12 rounded-full border-2"
            >
              View Services
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Certified Technicians</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Transparent Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Real-time Tracking</span>
            </div>
          </div>
        </div>

        {/* Hero Image / Visual */}
        <div className="flex-1 relative w-full max-w-lg lg:max-w-none animate-in slide-in-from-right-10 duration-1000 fade-in">
          <div className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border bg-card group">
             {/* Hero Image */}
             <div className="absolute inset-0 bg-muted">
                <img 
                  src="http://localhost:5000/uploads/services/hero-server.jpg" 
                  alt="Professional Technician" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581092921461-eab32e97f6d1?w=800&q=80"; // Fallback
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
             </div>
             
             {/* Floating Cards for effect */}
             <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="font-bold text-lg">Expert Server Maintenance</p>
                <p className="text-sm text-gray-200">Ensuring your business stays online 24/7</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavbarPublic } from '@/components/public/NavbarPublic';
import { Hero } from '@/components/public/Hero';
import { ServicesShowcase } from '@/components/public/ServicesShowcase';
import { Testimonials } from '@/components/public/Testimonials';
import { FooterPublic } from '@/components/public/FooterPublic';
import { Shield, Clock, Award, LayoutDashboard, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Homepage() {
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
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-[#0B4F6C]/20">
      <NavbarPublic />
      
      <main>
        <Hero />
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Trusted & Secure</h3>
                <p className="text-muted-foreground">
                  Our technicians are vetted and certified. Your data privacy and device security are our top priorities.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
                <p className="text-muted-foreground">
                  We understand the importance of your devices. Most repairs are completed within 24-48 hours.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Quality Guarantee</h3>
                <p className="text-muted-foreground">
                  All our services come with a warranty. If the issue persists, we'll fix it for free.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ServicesShowcase />

        <Testimonials />

        {/* Contact & Map Section */}
        <section id="contact" className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#0B4F6C] dark:text-primary">Visit Our Office</h2>
                  <p className="text-lg text-muted-foreground">
                    We are conveniently located in Nasugbu, Batangas. Drop by for a consultation or to drop off your device.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0B4F6C] dark:text-primary shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Address</h3>
                      <p className="text-muted-foreground">3JCJ+RJJ, Brias Street</p>
                      <p className="text-muted-foreground">Barangay 3, Nasugbu, Batangas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0B4F6C] dark:text-primary shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Phone</h3>
                      <p className="text-muted-foreground">+63 912 345 6789</p>
                      <p className="text-sm text-muted-foreground">Mon-Sat, 8:00 AM - 6:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#0B4F6C] dark:text-primary shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Email</h3>
                      <p className="text-muted-foreground">support@ncps.com</p>
                      <p className="text-sm text-muted-foreground">24/7 Online Support</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-border bg-muted relative">
                 <iframe 
                  src="https://maps.google.com/maps?q=NCPS%20CCTV%20%26%20Computer%20services%2C%20Nasugbu%2C%20Batangas&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy"
                  title="NCPS Location"
                  className="absolute inset-0"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#0B4F6C] text-white">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to get your device fixed?</h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust NCPS for their technical needs. Sign up today and book your first service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               {user ? (
                 <Button 
                   onClick={() => navigate(getDashboardPath())} 
                   className="inline-flex items-center justify-center px-8 py-6 rounded-full bg-white text-[#0B4F6C] font-bold hover:bg-blue-50 transition-colors text-lg"
                 >
                   <LayoutDashboard className="mr-2 w-5 h-5" /> Go to Dashboard
                 </Button>
               ) : (
                 <>
                   <Button onClick={() => navigate('/register')} className="inline-flex items-center justify-center px-8 py-6 rounded-full bg-white text-[#0B4F6C] font-bold hover:bg-blue-50 transition-colors text-lg">
                     Create Account
                   </Button>
                   <Button variant="outline" onClick={() => navigate('/login')} className="inline-flex items-center justify-center px-8 py-6 rounded-full border-2 border-white text-white font-bold hover:bg-white/10 hover:text-white transition-colors text-lg bg-transparent">
                     Log In
                   </Button>
                 </>
               )}
            </div>
          </div>
        </section>
      </main>

      <FooterPublic />
    </div>
  );
}

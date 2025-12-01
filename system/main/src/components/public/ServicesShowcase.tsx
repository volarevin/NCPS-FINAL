import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Service {
  service_id: number;
  name: string;
  description: string;
  estimated_price: number;
  image: string;
}

export function ServicesShowcase() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
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

    const fetchServices = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/public/services');
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Failed to fetch services', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B4F6C] dark:text-primary">Popular Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We offer a wide range of professional repair and maintenance services tailored to your needs.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[350px] bg-card rounded-xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.service_id} className="group overflow-hidden border-border hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                <div className="relative h-48 overflow-hidden bg-muted">
                  {service.image ? (
                    <img 
                      src={`http://localhost:5000/uploads/services/${service.image}`} 
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center bg-muted ${service.image ? 'hidden' : ''}`}>
                    <Wrench className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-background/80 backdrop-blur text-foreground hover:bg-background">
                      ₱{service.estimated_price?.toLocaleString() || 'TBD'}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl line-clamp-1" title={service.name}>{service.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {service.description || "Professional service with quality guarantee."}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between group-hover:text-[#0B4F6C] dark:group-hover:text-primary"
                    onClick={() => navigate(user ? '/customer' : '/login')}
                  >
                    Book Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" onClick={() => navigate(user ? '/customer' : '/register')}>
            View All Services
          </Button>
        </div>
      </div>
    </section>
  );
}

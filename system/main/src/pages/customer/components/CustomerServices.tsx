import { useState, useEffect } from 'react';
import { Search, Star, ChevronRight, Wrench, Laptop, Smartphone, Wifi, Shield, Camera, Server, Printer, Speaker } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { CreateAppointmentDialog } from './CreateAppointmentDialog';
import { PageHeader } from './PageHeader';

const iconMap: Record<string, any> = {
  'Laptop': Laptop,
  'Smartphone': Smartphone,
  'Wifi': Wifi,
  'Shield': Shield,
  'Camera': Camera,
  'Server': Server,
  'Printer': Printer,
  'Speaker': Speaker,
  'Wrench': Wrench,
};

export function CustomerServices() {
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, selectedCategory, services]);

  const fetchServices = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        
        // Extract unique categories
        const uniqueCategories = ['All', ...Array.from(new Set<string>(
          data.map((s: any) => s.category_name).filter(Boolean) as string[]
        ))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchQuery) {
      filtered = filtered.filter(service => 
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(service => service.category_name === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setIsCreateDialogOpen(true);
  };

  // Get top rated services for "Popular" section
  const popularServices = [...services].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 3);

  return (
    <div className="p-3 md:p-8 animate-fade-in max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Our Services" 
        description="Explore our wide range of professional technical services."
      />

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search services..." 
            className="pl-9 border-border focus:border-[#4DBDCC] focus:ring-[#4DBDCC]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === category 
                  ? 'bg-[#0B4F6C] dark:bg-sky-600 text-white shadow-md' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Services Section */}
      {selectedCategory === 'All' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-xl font-bold text-[#0B4F6C] dark:text-primary">Most Popular</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularServices.map(service => {
               const IconComponent = iconMap[service.category_icon] || Wrench;
               return (
              <div 
                key={service.service_id}
                onClick={() => handleBookService(service)}
                className="bg-gradient-to-br from-[#0B4F6C] to-[#1A5560] rounded-xl p-6 text-white cursor-pointer transform transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <IconComponent className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-none">
                      Top Rated
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{service.service_name}</h3>
                  <p className="text-blue-100 text-sm mb-4 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-bold">₱{service.base_price}</span>
                    <Button size="sm" className="bg-white text-[#0B4F6C] hover:bg-blue-50">
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* All Services Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#0B4F6C] dark:text-primary">
          {selectedCategory === 'All' ? 'All Services' : `${selectedCategory} Services`}
        </h2>
        
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-xl border border-dashed border-border">
            No services found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map(service => {
              const IconComponent = iconMap[service.category_icon] || Wrench;
              return (
                <div 
                  key={service.service_id}
                  onClick={() => handleBookService(service)}
                  className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-blue-500/10 dark:bg-blue-900/20 p-2 rounded-lg text-[#0B4F6C] dark:text-primary group-hover:bg-[#0B4F6C] dark:group-hover:bg-primary group-hover:text-white transition-colors">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {service.rating}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-[10px] font-bold text-[#4DBDCC] dark:text-cyan-400 uppercase tracking-wider">
                        {service.category_name}
                      </span>
                      <h3 className="font-bold text-foreground group-hover:text-[#0B4F6C] dark:group-hover:text-primary transition-colors">
                        {service.service_name}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {service.description || 'Professional service provided by our expert technicians.'}
                    </p>
                  </div>
                  
                  <div className="px-5 py-4 border-t border-border bg-muted/30 rounded-b-xl flex items-center justify-between group-hover:bg-blue-500/10 dark:group-hover:bg-blue-900/20 transition-colors">
                    <span className="font-bold text-[#0B4F6C] dark:text-primary">₱{service.base_price}</span>
                    <div className="flex items-center text-sm font-medium text-[#4DBDCC] dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                      Book <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateAppointmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialServiceId={selectedService?.service_id}
      />
    </div>
  );
}

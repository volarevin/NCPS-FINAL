import { PageHeader } from "./PageHeader";
import { useState, useEffect } from "react";
import { Settings, Plus, Menu, Box } from "lucide-react";
import { EditServiceDialog } from "./EditServiceDialog";
import { CategorySettingsDialog, iconMap } from "./CategorySettingsDialog";
import { useFeedback } from "@/context/FeedbackContext";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  color: string;
  icon?: string;
}

interface Category {
  category_id: number;
  name: string;
  color: string;
  icon: string;
}

export function Services() {
  const { showPromise } = useFeedback();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchCategories = async () => {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://localhost:5000/api/admin/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setCategories(data);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
  };

  const fetchServices = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/admin/services', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Map DB fields to frontend interface
        const mappedServices = data.map((s: any) => ({
          id: s.service_id.toString(),
          name: s.name,
          category: s.category || "Uncategorized", 
          description: s.description,
          price: `₱ ${parseFloat(s.price).toLocaleString('en-US', {minimumFractionDigits: 2})}`,
          color: s.color || "#9CA3AF",
          icon: s.icon || "Box"
        }));
        setServices(mappedServices);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const handleUpdateCategory = async (id: number, color: string, icon: string) => {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const promise = async () => {
        const response = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ color, icon })
        });

        if (!response.ok) throw new Error("Failed to update category");

        // Refresh data
        await fetchCategories();
        await fetchServices();
        return "Category updated successfully";
      };

      showPromise(promise(), {
        loading: 'Updating category...',
        success: (data) => data,
        error: 'Failed to update category',
      });
  };

  const filteredServices =
    selectedCategory === "All"
      ? services
      : services.filter((service) => service.category === selectedCategory);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setDialogOpen(true);
  };

  const handleSaveService = async (service: Service) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const promise = async () => {
      if (selectedService) {
        // Edit existing service
        const response = await fetch(`http://localhost:5000/api/admin/services/${service.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            name: service.name,
            description: service.description,
            price: parseFloat(service.price.replace(/[^0-9.]/g, '')),
            category: service.category
          })
        });
        
        if (!response.ok) throw new Error("Failed to update service");

        // Refresh to get updated category metadata
        fetchServices();
        return "Service updated successfully";
      } else {
        // Add new service
        const response = await fetch('http://localhost:5000/api/admin/services', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            name: service.name,
            description: service.description,
            price: parseFloat(service.price.replace(/[^0-9.]/g, '')),
            category: service.category,
            color: service.color,
            icon: service.icon
          })
        });

        if (!response.ok) throw new Error("Failed to create service");

        fetchServices();
        fetchCategories(); // Also refresh categories as they might have been updated
        return "Service created successfully";
      }
    };

    showPromise(promise(), {
      loading: selectedService ? 'Updating service...' : 'Creating service...',
      success: (data) => data,
      error: selectedService ? 'Failed to update service' : 'Failed to create service',
    });
  };

  const handleDeleteService = async (id: string) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const promise = async () => {
      const response = await fetch(`http://localhost:5000/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Failed to delete service");

      setServices(services.filter((s) => s.id !== id));
      return "Service deleted successfully";
    };

    showPromise(promise(), {
      loading: 'Deleting service...',
      success: (data) => data,
      error: 'Failed to delete service',
    });
  };

  const getCategoryIcon = (iconName: string) => {
      const Icon = iconMap[iconName] || Box;
      return <Icon className="w-full h-full" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Manage Services" 
        description="Create, edit, and organize your service offerings."
        action={
            <div className="flex gap-2">
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>
                <button
                    onClick={handleAddService}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B4F6C] dark:bg-sky-600 text-white hover:bg-[#093e54] dark:hover:bg-sky-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Service</span>
                </button>
            </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {categories.map((cat) => (
            <div 
                key={cat.category_id}
                className="rounded-xl p-4 text-white shadow-sm relative overflow-hidden"
                style={{ backgroundColor: cat.color }}
            >
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    {getCategoryIcon(cat.icon)}
                </div>
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="w-6 h-6 opacity-80">
                        {getCategoryIcon(cat.icon)}
                    </div>
                    <span className="text-xl md:text-2xl font-bold">
                        {services.filter(s => s.category === cat.name).length}
                    </span>
                </div>
                <p className="text-xs md:text-sm opacity-90 font-medium relative z-10">{cat.name}</p>
            </div>
        ))}
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Menu className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
            <span className="text-xl md:text-2xl font-bold">{services.length}</span>
          </div>
          <p className="text-xs md:text-sm opacity-90 font-medium">Total Services</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white dark:bg-card rounded-xl p-3 md:p-4 mb-6 shadow-sm border-2 border-gray-200 dark:border-border">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-muted-foreground">Filter by:</span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <button
                onClick={() => setSelectedCategory("All")}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-xs md:text-sm shadow-sm ${
                  selectedCategory === "All"
                    ? "bg-[#0B4F6C] dark:bg-sky-600 text-white shadow-md scale-105"
                    : "bg-gray-100 dark:bg-muted text-gray-700 dark:text-foreground hover:bg-gray-200 dark:hover:bg-muted/80"
                }`}
            >
                <Menu className="w-4 h-4" />
                <span>All</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.category_id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-xs md:text-sm shadow-sm ${
                  selectedCategory === category.name
                    ? "bg-[#0B4F6C] dark:bg-sky-600 text-white shadow-md scale-105"
                    : "bg-gray-100 dark:bg-muted text-gray-700 dark:text-foreground hover:bg-gray-200 dark:hover:bg-muted/80"
                }`}
              >
                <span className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                  {getCategoryIcon(category.icon)}
                </span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            onClick={() => handleServiceClick(service)}
            className="group bg-white dark:bg-card rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent dark:border-border hover:border-[#0B4F6C] dark:hover:border-primary transform hover:-translate-y-1"
          >
            {/* Service Icon */}
            <div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-4 text-white shadow-md group-hover:scale-110 transition-transform"
              style={{ backgroundColor: service.color }}
            >
               <div className="w-8 h-8">
                   {getCategoryIcon(service.icon || "Box")}
               </div>
            </div>

            {/* Service Name */}
            <h3 className="text-base md:text-lg text-gray-800 dark:text-foreground mb-2 group-hover:text-[#0B4F6C] dark:group-hover:text-primary transition-colors">
              {service.name}
            </h3>

            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span 
                className="text-xs px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: service.color }}
              >
                {service.category}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs md:text-sm text-gray-600 dark:text-muted-foreground mb-4 line-clamp-2">
              {service.description}
            </p>

            {/* Price */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-border">
              <span className="text-lg md:text-xl text-[#0B4F6C] dark:text-primary">
                {service.price}
              </span>
              <span className="text-xs text-gray-500 dark:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Click to edit →
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-card rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-gray-100 dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Menu className="w-10 h-10 text-gray-400 dark:text-muted-foreground" />
          </div>
          <p className="text-gray-500 dark:text-muted-foreground text-lg mb-2">No services found</p>
          <p className="text-gray-400 dark:text-muted-foreground/70 text-sm">Try selecting a different category or add a new service</p>
        </div>
      )}

      <EditServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={selectedService}
        onSave={handleSaveService}
        onDelete={handleDeleteService}
        categories={categories}
      />

      <CategorySettingsDialog 
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        categories={categories}
        onUpdateCategory={handleUpdateCategory}
      />
    </div>
  );
}

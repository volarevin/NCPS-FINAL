import { useState, useEffect } from 'react';
import { Star, ShieldCheck, Award, ThumbsUp } from 'lucide-react';

interface Service {
  service_id: number;
  service_name: string;
  description: string;
  base_price: number;
  category_name: string;
  category_icon: string;
  rating: string;
  reviewCount: number;
}

interface ServiceBannerProps {
  services: Service[];
}

export function ServiceBanner({ services }: ServiceBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (services.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % services.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [services.length]);

  if (services.length === 0) return null;

  const currentService = services[currentIndex];

  return (
    <div className="relative w-full h-[200px] md:h-[250px] rounded-2xl overflow-hidden shadow-lg mb-6 group">
      {/* Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B4F6C] via-[#1A5560] to-[#4DBDCC] opacity-90 transition-all duration-500" />
      
      {/* Decorative Circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#4DBDCC]/20 rounded-full blur-3xl" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-center px-8 md:px-16 text-white z-10">
        
        {/* Quality Badge */}
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <div className="bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 px-3 py-1 rounded-full flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-100 tracking-wide uppercase">Premium Service Quality</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span className="text-sm font-bold">{currentService.rating}</span>
          </div>
        </div>

        {/* Service Info */}
        <div className="space-y-2 max-w-2xl animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
            {currentService.service_name}
          </h2>
          <p className="text-blue-100 text-sm md:text-base line-clamp-2 max-w-xl">
            {currentService.description || 'Experience top-tier technical support and maintenance services tailored to your needs.'}
          </p>
        </div>

        {/* Features/Tags */}
        <div className="flex gap-4 mt-6 animate-fade-in delay-100">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck className="w-4 h-4 text-[#4DBDCC]" />
            <span>Verified Technicians</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <ThumbsUp className="w-4 h-4 text-[#4DBDCC]" />
            <span>Satisfaction Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {services.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

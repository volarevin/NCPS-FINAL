import { useState, useEffect } from 'react';
import { Star, User, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Testimonial {
  rating: number;
  feedback_text: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  service_name: string;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/testimonials')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTestimonials(data);
        }
      })
      .catch(err => console.error('Failed to fetch testimonials:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="testimonials" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-12 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B4F6C] dark:text-primary mb-4">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about their experience with NCPS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-primary" />
              </div>
              
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} 
                    />
                  ))}
                </div>

                <p className="text-muted-foreground text-sm mb-6 flex-grow italic relative z-10">
                  "{testimonial.feedback_text}"
                </p>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage 
                      src={testimonial.profile_picture ? `http://localhost:5000${testimonial.profile_picture}` : undefined} 
                      alt={`${testimonial.first_name} ${testimonial.last_name}`} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm truncate max-w-[120px]">
                      {testimonial.first_name} {testimonial.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {testimonial.service_name}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

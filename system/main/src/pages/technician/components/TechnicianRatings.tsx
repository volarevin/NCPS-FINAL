import { useState, useMemo } from "react";
import { Star, User, Calendar, MessageSquare, Filter, ArrowUpDown, ThumbsUp, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { PageHeader } from "./PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";

interface Rating {
  id: string;
  customerName: string;
  service: string;
  rating: number;
  feedback: string;
  date: string;
  rawDate: Date;
}

interface TechnicianRatingsProps {
  ratings: Rating[];
  renderStars: (rating: number) => JSX.Element[];
}

export function TechnicianRatings({ ratings, renderStars }: TechnicianRatingsProps) {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [filterStar, setFilterStar] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Calculate Statistics
  const stats = useMemo(() => {
    const total = ratings.length;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const average = total > 0 ? sum / total : 0;
    
    const distribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: ratings.filter(r => Math.round(r.rating) === star).length,
      percentage: total > 0 ? (ratings.filter(r => Math.round(r.rating) === star).length / total) * 100 : 0
    }));

    return { total, average, distribution };
  }, [ratings]);

  // Filter and Sort
  const filteredRatings = useMemo(() => {
    let result = [...ratings];

    if (filterStar !== "all") {
      result = result.filter(r => Math.round(r.rating) === parseInt(filterStar));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
        case "oldest":
          return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return result;
  }, [ratings, filterStar, sortBy]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-10">
      <PageHeader 
        title="My Ratings"
        description="Track your performance and view customer feedback."
      />

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-gradient-to-br from-[#0B4F6C] to-[#145A75] dark:from-primary dark:to-primary/80 text-white dark:text-primary-foreground border-none shadow-lg">
          <CardContent className="flex flex-col items-center justify-center h-full py-8 space-y-2">
            <div className="text-6xl font-bold tracking-tighter">
              {stats.average.toFixed(1)}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 ${star <= Math.round(stats.average) ? "fill-yellow-400 text-yellow-400" : "fill-gray-400 text-gray-400 dark:fill-muted dark:text-muted"}`} 
                />
              ))}
            </div>
            <p className="text-blue-100 dark:text-primary-foreground/80 font-medium mt-2">Based on {stats.total} reviews</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-gray-700 dark:text-foreground">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.distribution.map((item) => (
              <div key={item.star} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16 shrink-0">
                  <span className="font-bold text-muted-foreground">{item.star}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0B4F6C] dark:bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm text-muted-foreground">
                  {item.count}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <Button 
              variant={filterStar === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStar("all")}
              className={filterStar === "all" ? "bg-[#0B4F6C] dark:bg-primary" : ""}
            >
              All
            </Button>
            {[5, 4, 3, 2, 1].map(star => (
              <Button
                key={star}
                variant={filterStar === star.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStar(star.toString())}
                className={`gap-1 ${filterStar === star.toString() ? "bg-[#0B4F6C] dark:bg-primary" : ""}`}
              >
                {star} <Star className="w-3 h-3 fill-current" />
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ratings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRatings.length > 0 ? (
          filteredRatings.map((rating) => (
            <Card 
              key={rating.id} 
              className="group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer border-t-4 overflow-hidden bg-card"
              style={{ 
                borderTopColor: rating.rating >= 4 ? '#22c55e' : rating.rating >= 3 ? '#eab308' : '#ef4444' 
              }}
              onClick={() => setSelectedRating(rating)}
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-0.5">
                    {renderStars(rating.rating)}
                  </div>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                    {rating.date}
                  </Badge>
                </div>

                <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-[#0B4F6C] dark:group-hover:text-primary transition-colors">
                  {rating.service}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <User className="w-4 h-4" />
                  <span>{rating.customerName}</span>
                </div>

                <div className="relative bg-muted/50 p-4 rounded-xl mt-auto">
                  <Quote className="absolute top-2 left-2 w-4 h-4 text-muted -scale-x-100" />
                  <p className="text-gray-600 dark:text-muted-foreground text-sm italic line-clamp-3 pl-4">
                    "{rating.feedback}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 dark:text-muted-foreground bg-white dark:bg-card rounded-xl border border-dashed border-gray-200 dark:border-border">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-300 dark:text-muted" />
            <p className="text-lg font-medium">No ratings found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRating} onOpenChange={(open) => !open && setSelectedRating(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0B4F6C] dark:text-primary flex items-center gap-2 text-xl">
              <ThumbsUp className="w-5 h-5" />
              Feedback Details
            </DialogTitle>
            <DialogDescription>
              Detailed review from your customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedRating && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-muted/50 rounded-xl border border-gray-100 dark:border-border">
                <div className="flex gap-1 mb-2">
                  {renderStars(selectedRating.rating)}
                </div>
                <span className="text-3xl font-bold text-gray-900 dark:text-foreground">{selectedRating.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500 dark:text-muted-foreground">out of 5.0</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Service</label>
                    <p className="font-medium text-gray-900 dark:text-foreground">{selectedRating.service}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Date</label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-foreground">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                      <span className="font-medium">{selectedRating.date}</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Customer</label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-foreground">
                      <User className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                      <span className="font-medium">{selectedRating.customerName}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Customer Feedback</label>
                  <div className="bg-blue-50/50 dark:bg-primary/10 p-4 rounded-xl border border-blue-100 dark:border-primary/20">
                    <p className="text-gray-700 dark:text-foreground italic leading-relaxed">"{selectedRating.feedback}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

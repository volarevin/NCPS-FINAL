import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Star } from 'lucide-react';
import { useFeedback } from "@/context/FeedbackContext";

interface RateTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

export function RateTechnicianDialog({ open, onOpenChange, appointment }: RateTechnicianDialogProps) {
  const { showPromise } = useFeedback();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting] = useState(false);

  const handleSubmit = async () => {
    const promise = async () => {
      if (rating === 0) {
        throw new Error('Please select a rating');
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in');
      }

      const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          feedback
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }

      onOpenChange(false);
      setRating(0);
      setHoveredRating(0);
      setFeedback('');
      return 'Thank you for your feedback!';
    };

    showPromise(promise(), {
      loading: 'Submitting rating...',
      success: (data) => data,
      error: (err) => err instanceof Error ? err.message : 'Failed to submit rating',
    });
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#1A5560]">Rate Your Service</DialogTitle>
          <DialogDescription>
            How was your experience with {appointment.technician}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#1A5560]/60 mb-1">Service</p>
            <p className="text-[#1A5560]">{appointment.service}</p>
            <p className="text-sm text-[#1A5560]/60 mt-2 mb-1">Date</p>
            <p className="text-[#1A5560]">{appointment.date}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1A5560]">Rating *</Label>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-[#1A5560]/60">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-[#1A5560]">
              Feedback (Optional)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with us..."
              className="border-[#1A5560]/20 focus:border-[#3FA9BC] min-h-[100px]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setRating(0);
                setHoveredRating(0);
                setFeedback('');
              }}
              className="flex-1 border-[#1A5560] text-[#1A5560] hover:bg-[#1A5560]/10"
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 bg-[#3FA9BC] hover:bg-[#2A6570] text-white transition-colors duration-200"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

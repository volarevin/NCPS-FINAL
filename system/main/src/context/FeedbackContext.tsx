import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type FeedbackStatus = 'idle' | 'loading' | 'success' | 'error';

interface FeedbackContextType {
  showPromise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: (data: T) => string;
      error: string | ((error: any) => string);
    }
  ) => Promise<T>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<FeedbackStatus>('idle');
  const [message, setMessage] = useState('');

  const showPromise = useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: (data: T) => string;
      error: string | ((error: any) => string);
    }
  ) => {
    setIsOpen(true);
    setStatus('loading');
    setMessage(messages.loading);

    try {
      const result = await promise;
      setStatus('success');
      setMessage(messages.success(result));
      
      // Keep success message visible for 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setStatus('idle'), 300); // Reset after close animation
      }, 2000); 
      
      return result;
    } catch (error) {
      setStatus('error');
      setMessage(typeof messages.error === 'function' ? messages.error(error) : messages.error);
      
      // Keep error message visible for 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setStatus('idle'), 300);
      }, 3000);
      
      throw error;
    }
  }, []);

  return (
    <FeedbackContext.Provider value={{ showPromise }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevent closing by clicking outside or escape during loading
        if (!open && status !== 'loading') {
            setIsOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[400px] flex flex-col items-center justify-center p-10 text-center [&>button]:hidden outline-none border-none shadow-2xl">
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <Loader2 className="h-20 w-20 text-[#0B4F6C] animate-spin" />
                    <p className="text-xl font-bold text-[#0B4F6C]">{message}</p>
                </div>
            )}
            {status === 'success' && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle className="h-20 w-20 text-green-600 animate-bounce" />
                    </div>
                    <p className="text-xl font-bold text-green-700">{message}</p>
                </div>
            )}
            {status === 'error' && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="rounded-full bg-red-100 p-4">
                        <XCircle className="h-20 w-20 text-red-600 animate-pulse" />
                    </div>
                    <p className="text-xl font-bold text-red-700">{message}</p>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

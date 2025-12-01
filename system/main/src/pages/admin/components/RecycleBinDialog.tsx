import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, X } from "lucide-react";
import { useFeedback } from "@/context/FeedbackContext";

// interface DeletedAppointment {
//   appointment_id: number;
//   customer_first: string;
//   customer_last: string;
//   service_name: string;
//   appointment_date: string;
//   deletion_marked_at: string;
//   marked_by_first: string;
//   marked_by_last: string;
// }

interface RecycleBinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecycleBinDialog({ open, onOpenChange }: RecycleBinDialogProps) {
  const { showPromise } = useFeedback();
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeletedItems = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/admin/appointments/marked-deletion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDeletedItems(data);
      } else {
        console.error("Received non-array data:", data);
        setDeletedItems([]);
      }
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDeletedItems();
    }
  }, [open]);

  const handleRestore = async (id: number) => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const response = await fetch(`http://localhost:5000/api/admin/appointments/${id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to restore item');
      
      fetchDeletedItems();
      return "Appointment restored";
    };

    showPromise(promise(), {
      loading: 'Restoring appointment...',
      success: (data) => data,
      error: 'Failed to restore item',
    });
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const response = await fetch(`http://localhost:5000/api/admin/appointments/${id}/permanent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete item');
      
      fetchDeletedItems();
      return "Appointment permanently deleted";
    };

    showPromise(promise(), {
      loading: 'Deleting appointment permanently...',
      success: (data) => data,
      error: 'Failed to delete item',
    });
  };

  const handleEmptyBin = async () => {
    if (!confirm('Are you sure you want to empty the recycle bin? All items will be permanently lost.')) return;

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const response = await fetch('http://localhost:5000/api/admin/appointments/recycle-bin', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to empty bin');
      
      fetchDeletedItems();
      return "Recycle bin emptied";
    };

    showPromise(promise(), {
      loading: 'Emptying recycle bin...',
      success: (data) => data,
      error: 'Failed to empty bin',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white dark:bg-card dark:text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-foreground">
            <Trash2 className="w-5 h-5 text-red-500" />
            Recycle Bin
          </DialogTitle>
          <DialogDescription className="dark:text-muted-foreground">
            Manage deleted appointments. Items here can be restored or permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {deletedItems.length > 0 && (
            <div className="flex justify-end mb-4">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleEmptyBin}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Empty Bin
              </Button>
            </div>
          )}

          <div className="border dark:border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-muted/50 text-gray-700 dark:text-muted-foreground font-medium">
                <tr>
                  <th className="p-3">Details</th>
                  <th className="p-3">Deleted Info</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : deletedItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 dark:text-muted-foreground">
                      Recycle bin is empty
                    </td>
                  </tr>
                ) : (
                  deletedItems.map((item) => (
                    <tr key={item.appointment_id} className="hover:bg-gray-50 dark:hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium text-gray-900 dark:text-foreground">
                            {item.customer_first} {item.customer_last}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">
                            {item.service_name} • {new Date(item.appointment_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-muted-foreground">
                        <div>{new Date(item.deletion_marked_at).toLocaleString()}</div>
                        <div className="text-xs text-gray-400 dark:text-muted-foreground/70">
                            by {item.marked_by_first ? `${item.marked_by_first} ${item.marked_by_last}` : 'Unknown'}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(item.appointment_id)}
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900/50 dark:hover:bg-green-900/20"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePermanentDelete(item.appointment_id)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

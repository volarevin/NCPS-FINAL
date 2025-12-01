import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Wrench,
  Sparkles,
  Box,
  Menu,
  Zap,
  Cpu,
  Monitor,
  Smartphone,
  Wifi,
  Database,
  Server,
  Cloud,
  Lock,
  Shield,
  Globe,
  Mail,
  Phone,
  Camera,
  Printer,
  Speaker,
  Tv,
  Watch,
  Headphones,
  Mic,
  Music,
  Video,
  Image,
  FileText,
  Folder,
  // Trash2,
  Edit,
  Save,
  X
} from "lucide-react";

// Map of icon names to components
export const iconMap: Record<string, any> = {
  Settings,
  Wrench,
  Sparkles,
  Box,
  Menu,
  Zap,
  Tool: Wrench, // Alias
  Cpu,
  Monitor,
  Smartphone,
  Wifi,
  Database,
  Server,
  Cloud,
  Lock,
  Shield,
  Globe,
  Mail,
  Phone,
  Camera,
  Printer,
  Speaker,
  Tv,
  Watch,
  Headphones,
  Mic,
  Music,
  Video,
  Image,
  FileText,
  Folder,
};

interface Category {
  category_id: number;
  name: string;
  color: string;
  icon: string;
}

interface CategorySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onUpdateCategory: (id: number, color: string, icon: string) => void;
}

export function CategorySettingsDialog({
  open,
  onOpenChange,
  categories,
  onUpdateCategory,
}: CategorySettingsDialogProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const handleEdit = (cat: Category) => {
    setEditingId(cat.category_id);
    setEditColor(cat.color);
    setEditIcon(cat.icon);
  };

  const handleSave = (id: number) => {
    onUpdateCategory(id, editColor, editIcon);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-card dark:text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0B4F6C] dark:text-primary">
            Category Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-500 dark:text-muted-foreground border-b dark:border-border pb-2">
            <div className="col-span-4">Category Name</div>
            <div className="col-span-3">Color</div>
            <div className="col-span-3">Icon</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {categories.map((cat) => (
            <div key={cat.category_id} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 font-medium text-gray-800 dark:text-foreground">
                {cat.name}
              </div>

              {editingId === cat.category_id ? (
                <>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={editColor} 
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-xs text-gray-500 dark:text-muted-foreground">{editColor}</span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Select 
                        value={editIcon} 
                        onValueChange={setEditIcon}
                    >
                        <SelectTrigger className="h-8 bg-white dark:bg-background dark:text-foreground dark:border-input">
                            <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] bg-white dark:bg-popover dark:text-popover-foreground">
                            {Object.keys(iconMap).sort().map((iconName) => {
                                const Icon = iconMap[iconName] || Box;
                                return (
                                    <SelectItem key={iconName} value={iconName}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" />
                                            <span>{iconName}</span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => handleSave(cat.category_id)} className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 p-1 rounded">
                        <Save className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancel} className="text-gray-500 hover:bg-gray-100 dark:text-muted-foreground dark:hover:bg-muted/50 p-1 rounded">
                        <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-3 flex items-center gap-2">
                    <div 
                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" 
                        style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">{cat.color}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    {(() => {
                        const Icon = iconMap[cat.icon] || Box;
                        return <Icon className="w-5 h-5 text-gray-600 dark:text-muted-foreground" />;
                    })()}
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">{cat.icon}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button 
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-1 rounded transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

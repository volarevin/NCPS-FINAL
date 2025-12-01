import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iconMap } from "./CategorySettingsDialog";
import { Box } from "lucide-react";

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

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSave: (service: Service) => void;
  onDelete: (id: string) => void;
  categories: Category[];
}

export function EditServiceDialog({
  open,
  onOpenChange,
  service,
  onSave,
  onDelete,
  categories,
}: EditServiceDialogProps) {
  const [formData, setFormData] = useState<Service>({
    id: "",
    name: "",
    category: "",
    description: "",
    price: "",
    color: "",
    icon: "",
  });

  useEffect(() => {
    if (service) {
      setFormData(service);
    } else {
      // Default to first category if available
      const defaultCategory = categories.length > 0 ? categories[0] : null;
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        category: defaultCategory ? defaultCategory.name : "",
        description: "",
        price: "",
        color: defaultCategory ? defaultCategory.color : "#9CA3AF",
        icon: defaultCategory ? defaultCategory.icon : "Box",
      });
    }
  }, [service, open, categories]);

  // Update color and icon when category changes
  const handleCategoryChange = (value: string) => {
    const selectedCat = categories.find((c) => c.name === value);
    const newColor = selectedCat ? selectedCat.color : "#9CA3AF";
    const newIcon = selectedCat ? selectedCat.icon : "Box";
    setFormData({ ...formData, category: value, color: newColor, icon: newIcon });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this service?")) {
      onDelete(formData.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-card dark:text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0B4F6C] dark:text-primary">
            {service ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-foreground">
              Service Name
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Laptop Repair"
              className="bg-white dark:bg-background dark:border-input dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-foreground">
              Category
            </label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="bg-white dark:bg-background dark:border-input dark:text-foreground">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-popover dark:text-popover-foreground">
                {categories.map((cat) => (
                  <SelectItem key={cat.category_id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-foreground">
              Description
            </label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Service description..."
              className="h-24 bg-white dark:bg-background dark:border-input dark:text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`space-y-2 ${service ? "col-span-2" : ""}`}>
              <label className="text-sm font-medium text-gray-700 dark:text-foreground">Estimated Price</label>
              <Input
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="e.g. ₱ 2,500.00"
                className="bg-white dark:bg-background dark:border-input dark:text-foreground"
              />
            </div>
            
            {!service && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-foreground">
                    Color Theme
                  </label>
                  <div className="flex gap-2 mt-2">
                    {["#5B8FFF", "#FF9B66", "#5DD37C", "#FF6B6B"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          formData.color === color
                            ? "ring-2 ring-offset-2 ring-[#0B4F6C] scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-foreground">Icon</label>
                    <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
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
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            {service && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium mr-auto"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0B4F6C] text-white rounded-lg hover:bg-[#093e54] transition-colors font-medium"
            >
              {service ? "Save Changes" : "Create Service"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

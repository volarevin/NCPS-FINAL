import { Activity, Wrench, ArrowUpCircle } from "lucide-react";

interface ServiceCardProps {
  id: string;
  name: string;
  category: string;
  color: string;
  onClick: () => void;
}

export function ServiceCard({ name, category, color, onClick }: ServiceCardProps) {
  // Get icon based on category
  const getIcon = () => {
    if (name.toLowerCase().includes("laptop")) return <Activity className="w-12 h-12" />;
    if (name.toLowerCase().includes("cctv") && category === "Repair") return <Wrench className="w-12 h-12" />;
    if (name.toLowerCase().includes("upgrade")) return <ArrowUpCircle className="w-12 h-12" />;
    if (name.toLowerCase().includes("lcd")) return <Activity className="w-12 h-12" />;
    return <Wrench className="w-12 h-12" />;
  };

  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] hover:opacity-90 transition-opacity border border-transparent dark:border-border"
      style={{ backgroundColor: color }}
    >
      <div className="text-white drop-shadow-md">{getIcon()}</div>
      <span className="text-white text-center font-medium drop-shadow-md">{name}</span>
    </button>
  );
}

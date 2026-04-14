import { ReactNode } from "react";

interface InsightCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  variant?: "success" | "danger" | "neutral";
}

const InsightCard = ({ icon, label, value, variant = "neutral" }: InsightCardProps) => {
  const variantClasses = {
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    neutral: "bg-accent text-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${variantClasses[variant]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
};

export default InsightCard;

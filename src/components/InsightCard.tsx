import { ReactNode } from "react";

interface InsightCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  description?: string;
  variant?: "success" | "danger" | "neutral";
}

const InsightCard = ({ icon, label, value, description, variant = "neutral" }: InsightCardProps) => {
  const variantClasses = {
    success: "bg-success-muted text-success",
    danger: "bg-danger-muted text-danger",
    neutral: "bg-primary/10 text-primary",
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${variantClasses[variant]}`}>
          {icon}
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

export default InsightCard;

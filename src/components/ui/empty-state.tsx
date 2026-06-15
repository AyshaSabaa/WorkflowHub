import { LucideIcon } from "lucide-react";
import { Button } from "./button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && actionLabel && (
        <Button className="mt-4" onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}

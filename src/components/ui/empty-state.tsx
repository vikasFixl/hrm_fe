import { Inbox, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "There are no items to display yet.",
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

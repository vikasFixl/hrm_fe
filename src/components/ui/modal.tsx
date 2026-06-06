import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

export function Modal({
  title,
  open,
  onClose,
  children,
  size = "normal",
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "normal" | "wide" | "xl";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className={`modal${size === "wide" ? " modal-wide" : size === "xl" ? " modal-xl" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <Button variant="ghost" size="sm" iconOnly icon={<X size={16} />} onClick={onClose} aria-label="Close" />
        </header>
        {children}
      </section>
    </div>
  );
}

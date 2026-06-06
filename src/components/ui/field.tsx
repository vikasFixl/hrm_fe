import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export function Field({
  label,
  error,
  description,
  required,
  children,
}: {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className={clsx(required && "field-required")}>{label}</span>
      {children}
      {description && <small className="field-description">{description}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} className={clsx("input", props.className)} {...props} />
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => <select ref={ref} className={clsx("input", props.className)} {...props} />
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  (props, ref) => <textarea ref={ref} className={clsx("input textarea", props.className)} {...props} />
);
Textarea.displayName = "Textarea";

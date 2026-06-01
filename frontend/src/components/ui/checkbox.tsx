import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

/** Checkbox nativo estilizado, com label clicável opcional. */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const input = (
      <input
        type="checkbox"
        ref={ref}
        id={id}
        className={cn(
          "h-4 w-4 shrink-0 rounded border-input bg-transparent text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      />
    )
    if (!label) return input
    return (
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
        {input}
        {label}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        // Semânticas (estilo "soft" — fundo tingido + texto claro, ideal no dark)
        success: "border-emerald-500/25 bg-emerald-500/15 text-emerald-300",
        warning: "border-amber-500/25 bg-amber-500/15 text-amber-300",
        danger: "border-red-500/25 bg-red-500/15 text-red-300",
        destructive: "border-red-500/25 bg-red-500/15 text-red-300",
        info: "border-sky-500/25 bg-sky-500/15 text-sky-300",
        // Origens de projeto
        blue: "border-blue-500/25 bg-blue-500/15 text-blue-300",
        purple: "border-violet-500/25 bg-violet-500/15 text-violet-300",
        green: "border-emerald-500/25 bg-emerald-500/15 text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

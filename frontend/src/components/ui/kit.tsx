import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import { origemMeta, statusMeta } from "@/lib/domain"
import { Icon, type IconName } from "./Icon"

function cls(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ")
}

/* ---------- Button ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger"
  size?: "sm"
  icon?: IconName
  iconRight?: IconName
}

export function Button({ variant, size, icon, iconRight, children, className, ...rest }: ButtonProps) {
  const iconSize = size === "sm" ? 15 : 16
  return (
    <button className={cls("btn", variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}

/* ---------- IconButton ---------- */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  name: IconName
  size?: number
}

export function IconButton({ name, size = 18, className, ...rest }: IconButtonProps) {
  return (
    <button className={cls("iconbtn", className)} type="button" {...rest}>
      <Icon name={name} size={size} />
    </button>
  )
}

/* ---------- Field / inputs ---------- */
export function Field({ label, hint, children }: { label?: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cls("input", props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cls("textarea", props.className)} />
}

export function Select({ children, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cls("select", className)}>
      {children}
    </select>
  )
}

/* ---------- Check ---------- */
export function Check({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={cls("check", on && "on")} onClick={onClick}>
      <Icon name="check" size={12} />
    </button>
  )
}

/* ---------- Progress ---------- */
export function Progress({ pct }: { pct: number }) {
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${pct || 0}%` }} />
    </div>
  )
}

/* ---------- Tag / Pill ---------- */
export function OriginTag({ origin }: { origin: string | null | undefined }) {
  const o = origemMeta(origin)
  return (
    <span className={cls("tag", o.cls)}>
      <span className="dot" />
      {o.label}
    </span>
  )
}

export function StatusPill({ status, late }: { status: string; late?: boolean }) {
  if (late) {
    return (
      <span className="pill pill-late">
        <Icon name="alert" size={12} /> Vencida
      </span>
    )
  }
  const s = statusMeta(status)
  return (
    <span className={cls("pill", s.cls)}>
      <span className="dot" />
      {s.label}
    </span>
  )
}

/* ---------- Empty state ---------- */
export function Empty({
  icon = "inbox",
  title,
  children,
  action,
}: {
  icon?: IconName
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="ic">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

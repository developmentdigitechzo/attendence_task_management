import React from "react";
import { Loader2 } from "lucide-react";

export interface AntdCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  children?: React.ReactNode;
}

export function AntdCard({
  title,
  extra,
  bordered = true,
  hoverable = true,
  children,
  className = "",
  ...props
}: AntdCardProps) {
  return (
    <div
      className={`bg-white rounded-lg transition-all duration-200 ${
        bordered ? "border border-[#f0f0f0]" : ""
      } ${
        hoverable ? "hover:border-[#e5e7eb] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]" : "shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      } ${className}`}
      {...props}
    >
      {(title || extra) && (
        <div className="min-h-[48px] px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
          <div className="font-semibold text-sm text-slate-800">{title}</div>
          {extra && <div className="text-xs text-slate-500">{extra}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export interface AntdFormItemProps {
  label?: React.ReactNode;
  required?: boolean;
  help?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AntdFormItem({
  label,
  required,
  help,
  children,
  className = "",
}: AntdFormItemProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="flex items-center gap-1 text-[13px] font-normal text-slate-700 mb-1.5 leading-tight">
          {required && <span className="text-[#ff4d4f] font-mono">*</span>}
          <span>{label}</span>
        </label>
      )}
      {children}
      {help && <p className="text-[11px] text-slate-400 mt-1">{help}</p>}
    </div>
  );
}

export interface AntdInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  prefix?: React.ReactNode;
}

export function AntdInput({
  prefix,
  className = "",
  ...props
}: AntdInputProps) {
  if (prefix) {
    return (
      <div className="relative flex items-center w-full">
        <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          {prefix}
        </span>
        <input
          className={`w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-[#d9d9d9] rounded-md transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/70 hover:border-brand-400 outline-none text-slate-800 placeholder:text-slate-400 ${className}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={`w-full h-9 px-3 text-[13px] bg-white border border-[#d9d9d9] rounded-md transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/70 hover:border-brand-400 outline-none text-slate-800 placeholder:text-slate-400 ${className}`}
      {...props}
    />
  );
}

export interface AntdTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function AntdTextarea({ className = "", ...props }: AntdTextareaProps) {
  return (
    <textarea
      className={`w-full p-2.5 text-[13px] bg-white border border-[#d9d9d9] rounded-md transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/70 hover:border-brand-400 outline-none text-slate-800 placeholder:text-slate-400 resize-y ${className}`}
      {...props}
    />
  );
}

export interface AntdSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { label: string; value: string | number }[];
}

export function AntdSelect({
  options,
  children,
  className = "",
  ...props
}: AntdSelectProps) {
  return (
    <select
      className={`w-full h-9 px-3 text-[13px] bg-white border border-[#d9d9d9] rounded-md transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/70 hover:border-brand-400 outline-none text-slate-800 cursor-pointer ${className}`}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
}

export interface AntdButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type?: "primary" | "default" | "danger";
  htmlType?: "button" | "submit" | "reset";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function AntdButton({
  type = "default",
  htmlType = "button",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: AntdButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 h-9 px-4 text-[13px] font-medium rounded-md transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs";

  let variant =
    "bg-white border border-[#d9d9d9] text-slate-700 hover:border-brand-500 hover:text-brand-600 active:border-brand-600 active:text-brand-700";
  if (type === "primary") {
    variant =
      "bg-brand-600 border border-brand-600 text-white hover:bg-brand-500 hover:border-brand-500 active:bg-brand-700 active:border-brand-700 shadow-sm";
  } else if (type === "danger") {
    variant =
      "bg-rose-600 border border-rose-600 text-white hover:bg-rose-500 hover:border-rose-500 active:bg-rose-700 active:border-rose-700 shadow-sm";
  }

  return (
    <button
      type={htmlType}
      className={`${base} ${variant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

import * as React from "react"
import { LucideIcon } from "lucide-react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, type, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-slate-700 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={`
              block w-full pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 
              placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 
              transition-all outline-none text-sm
              ${Icon ? 'pl-11' : 'pl-4'}
              ${error ? 'border-red-500' : 'border-slate-200'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

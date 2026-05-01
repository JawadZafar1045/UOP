import * as React from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-slate-700 ml-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 
            focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 
            transition-all outline-none text-sm appearance-none cursor-pointer
            ${error ? 'border-red-500' : 'border-slate-200'}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

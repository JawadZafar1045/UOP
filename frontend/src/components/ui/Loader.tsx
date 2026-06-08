import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const textClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export default function Loader({ size = "md", text, fullScreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={`absolute inset-0 rounded-full blur-md opacity-40 bg-blue-500 animate-pulse ${sizeClasses[size]}`}></div>
        <Loader2 className={`animate-spin text-blue-600 relative z-10 ${sizeClasses[size]}`} />
      </div>
      {text && (
        <p className={`font-medium text-slate-500 animate-pulse ${textClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/80 backdrop-blur-sm fixed inset-0 z-50">
        {content}
      </div>
    );
  }

  return content;
}

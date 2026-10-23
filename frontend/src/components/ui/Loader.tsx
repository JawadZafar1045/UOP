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
        <Loader2 className={`animate-spin text-[#0E8696] ${sizeClasses[size]}`} />
      </div>
      {text && (
        <p className={`font-medium text-[#4d6477] animate-pulse ${textClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f8fb]/80 backdrop-blur-sm fixed inset-0 z-50">
        {content}
      </div>
    );
  }

  return content;
}

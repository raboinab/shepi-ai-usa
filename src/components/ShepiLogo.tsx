import { cn } from "@/lib/utils";

interface ShepiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}

export const ShepiLogo = ({ 
  className, 
  size = "md",
  variant = "dark"
}: ShepiLogoProps) => {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const textColor = variant === "light" ? "text-shepi-cream" : "text-shepi-blue";

  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("font-serif font-bold lowercase", sizes[size], textColor)}>
        shepi
      </span>
    </div>
  );
};

export default ShepiLogo;

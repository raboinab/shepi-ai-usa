import { cn } from "@/lib/utils";
import shepiDog from "@/assets/shepi-dog.svg";

interface ShepiLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}

export const ShepiLogo = ({ 
  className, 
  showText = true, 
  size = "md",
  variant = "dark"
}: ShepiLogoProps) => {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-xl" },
    md: { icon: "w-10 h-10", text: "text-2xl" },
    lg: { icon: "w-14 h-14", text: "text-4xl" },
  };

  const textColor = variant === "light" ? "text-shepi-cream" : "text-shepi-blue";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={shepiDog} 
        alt="Shepi logo" 
        className={cn(sizes[size].icon)}
      />
      {showText && (
        <span className={cn("font-serif font-bold lowercase", sizes[size].text, textColor)}>
          shepi
        </span>
      )}
    </div>
  );
};

export default ShepiLogo;

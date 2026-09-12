import { ShoppingCart, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onShowcase?: () => void;
  onCart?: () => void;
  onProfile?: () => void;
  activeTab?: string;
}

export function BottomNav({ onShowcase, onCart, onProfile, activeTab }: BottomNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-20 border-b border-border/40 bg-white backdrop-blur-xl flex items-center justify-between px-6 z-20">
      {/* Shopping Cart - Left */}
      <button
        onClick={onCart}
        className={cn(
          "flex flex-col items-center gap-1 transition-colors",
          activeTab === "cart" 
            ? "text-blue-600" 
            : "text-muted-foreground hover:text-primary"
        )}
        data-testid="button-cart"
      >
        <ShoppingCart className="w-6 h-6" />
        <span className={cn("font-normal text-[15px]", activeTab === "cart" ? "text-blue-600" : "text-[#000000]")}>سبد خرید</span>
      </button>
      {/* Profile - Center */}
      <button
        onClick={onProfile}
        className={cn(
          "rounded-full h-24 w-24 overflow-hidden border-4 border-white hover:border-white/90",
          "transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20",
          "absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        data-testid="button-profile"
      >
        <Avatar className="h-full w-full border-0">
          <AvatarImage
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Profile"
          />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
            U
          </AvatarFallback>
        </Avatar>
      </button>
      {/* Showcase - Right */}
      <button
        onClick={onShowcase}
        className={cn(
          "flex flex-col items-center gap-1 transition-colors",
          activeTab === "showcase" 
            ? "text-blue-600" 
            : "text-muted-foreground hover:text-primary"
        )}
        data-testid="button-showcase"
      >
        <Home className="w-6 h-6" />
        <span className={cn("text-[15px] font-normal", activeTab === "showcase" ? "text-blue-600" : "text-[#000000]")}>ویترین</span>
      </button>
    </nav>
  );
}

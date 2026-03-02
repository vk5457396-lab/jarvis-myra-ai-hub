import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-display tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon-cyan hover:shadow-neon-cyan/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-neon-purple",
        ghost: "hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        neonCyan: "bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background font-bold shadow-neon-cyan hover:shadow-[0_0_30px_hsl(185_100%_50%/0.6),0_0_60px_hsl(185_100%_50%/0.3)] hover:scale-105 border border-neon-cyan/30",
        neonPurple: "bg-gradient-to-r from-neon-purple to-neon-purple/80 text-background font-bold shadow-neon-purple hover:shadow-[0_0_30px_hsl(265_100%_65%/0.6),0_0_60px_hsl(265_100%_65%/0.3)] hover:scale-105 border border-neon-purple/30",
        neonPink: "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6),0_0_60px_rgba(236,72,153,0.3)] hover:scale-105 border border-pink-400/30",
        glass: "glass text-foreground hover:bg-white/10 border border-white/20",
        hero: "bg-gradient-neon text-background font-bold shadow-neon-cyan hover:shadow-[0_0_40px_hsl(185_100%_50%/0.5),0_0_80px_hsl(265_100%_65%/0.3)] hover:scale-105 border border-white/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-inter text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:bg-disabled disabled:text-muted-foreground disabled:opacity-100",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-hover",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary-ink underline-offset-4 hover:underline",
        adminPrimary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:bg-disabled disabled:text-muted-foreground disabled:opacity-100",
        adminSecondary:
          "border-[1.5px] border-primary-ink bg-transparent text-primary-ink hover:bg-secondary hover:text-foreground focus-visible:ring-ring",
        adminEdit:
          "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active disabled:bg-disabled disabled:text-muted-foreground disabled:opacity-100",
        adminView:
          "bg-secondary text-foreground hover:bg-secondary-hover focus-visible:ring-ring",
        adminDanger:
          "bg-[#B42318] text-white hover:bg-[#912018] focus-visible:ring-[#B42318]/30",
        adminNeutral:
          "bg-foreground text-white hover:bg-[color-mix(in_srgb,var(--foreground)_85%,var(--background))] focus-visible:ring-foreground/30",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
        admin: "min-h-[44px] rounded-lg px-4 py-3 has-[>svg]:px-4",
        adminCompact: "min-h-[36px] rounded-lg px-3 py-1.5 has-[>svg]:px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };




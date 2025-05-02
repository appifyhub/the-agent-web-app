import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "glass-static animate-pulse rounded-2xl w-full sm:w-xs",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

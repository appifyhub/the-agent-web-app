import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPageSkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-4 w-full">
    <Skeleton className="h-10 w-full sm:w-md" />
    <Skeleton className="h-20 w-full sm:w-md" />
    <Skeleton className="h-10 w-full sm:w-md" />
    <Skeleton className="h-20 w-full sm:w-md" />
  </div>
);

export default SettingsPageSkeleton;

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-10" />
    <Skeleton className="h-20" />
    <Skeleton className="h-10" />
    <Skeleton className="h-20" />
  </div>
);

export default SettingsPageSkeleton;

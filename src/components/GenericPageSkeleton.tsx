import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const GenericPageSkeleton: React.FC = () => (
  <>
    <Skeleton className="h-[70px]" />
    <Skeleton className="h-[200px]" />
    <Skeleton className="h-[40px]" />
    <Skeleton className="h-[40px]" />
  </>
);

export default GenericPageSkeleton;

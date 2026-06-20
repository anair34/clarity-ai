import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReflectPageClient } from "@/components/reflect/reflect-page-client";

function ReflectFallback() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function ReflectPage() {
  return (
    <Suspense fallback={<ReflectFallback />}>
      <ReflectPageClient />
    </Suspense>
  );
}

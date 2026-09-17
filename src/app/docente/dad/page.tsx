import { Suspense } from "react";
import DocenteDadClient from "./DocenteDadClient";

export default function DocenteDadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        </div>
      }
    >
      <DocenteDadClient />
    </Suspense>
  );
}

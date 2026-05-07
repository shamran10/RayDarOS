import { ResponseStudioScreen } from "@/screens/response-studio-screen";
import { Suspense } from "react";

export default function ResponseStudioPage() {
  return (
    <Suspense fallback={null}>
      <ResponseStudioScreen />
    </Suspense>
  );
}

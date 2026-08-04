import { Suspense } from "react";
import SignupPage from "@/components/pages/SignupPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignupPage />
    </Suspense>
  );
}

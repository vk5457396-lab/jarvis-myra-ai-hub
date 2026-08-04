import { Suspense } from "react";
import ResetPasswordPage from "@/components/pages/ResetPasswordPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}

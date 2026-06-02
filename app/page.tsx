import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

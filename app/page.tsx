import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

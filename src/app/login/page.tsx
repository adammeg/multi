import Link from "next/link";
import { LoginForm } from "@/components/auth/auth-forms";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <LoginForm />
      <p className="mt-4 text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-violet-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <RegisterForm />
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

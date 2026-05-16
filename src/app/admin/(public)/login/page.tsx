import { LoginForm } from "@/features/auth/components/login-form";
import { getStudioInfo } from "@/features/landing/queries";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const studio = await getStudioInfo();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] bg-background">
      <LoginForm studioName={studio.name} />
    </div>
  );
}

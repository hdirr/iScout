import { redirect } from "next/navigation";
import SignUpForm from "@/components/sign-up-form";
import { getCurrentUser } from "@/lib/dal";

export const metadata = { title: "Criar conta" };

export default async function RegistrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/jogadores");

  const { next } = await searchParams;

  return (
    <>
      <h1 className="mb-1 text-xl font-bold tracking-tight">Criar conta</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Comece a monitorar jogadores dos mercados emergentes.
      </p>
      <SignUpForm next={next} />
    </>
  );
}
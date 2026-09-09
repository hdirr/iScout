import { redirect } from "next/navigation";
import SignInForm from "@/components/sign-in-form";
import { getCurrentUser } from "@/lib/dal";

export const metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/jogadores");

  const { next } = await searchParams;

  return (
    <>
      <h1 className="mb-1 text-xl font-bold tracking-tight">Entrar</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Acesse sua conta para gerenciar o scouting.
      </p>
      <SignInForm next={next} />
    </>
  );
}
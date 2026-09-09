"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  erro?: string;
  aviso?: string;
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function entrar(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formValue(formData, "email").trim();
  const senha = formValue(formData, "senha");
  const next = formValue(formData, "next") || "/jogadores";

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    const mensagem = error.message.toLowerCase().includes("confirm")
      ? "E-mail ainda não confirmado. Verifique sua caixa de entrada."
      : "E-mail ou senha inválidos.";
    return { erro: mensagem };
  }

  redirect(next);
}

export async function registrar(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formValue(formData, "email").trim();
  const senha = formValue(formData, "senha");
  const confirmacao = formValue(formData, "confirmacao");
  const next = formValue(formData, "next") || "/jogadores";

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }
  if (senha.length < 8) {
    return { erro: "A senha deve ter pelo menos 8 caracteres." };
  }
  if (senha !== confirmacao) {
    return { erro: "As senhas não conferem." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: new URL(next, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").toString(),
    },
  });

  if (error) {
    return { erro: error.message };
  }

  if (data.session) {
    redirect(next);
  }

  return {
    aviso: "Conta criada. Confirme seu e-mail para ativar o acesso.",
  };
}

export async function sair(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
import { NextResponse } from "next/server";

// ============================================================
// MODO DEMONSTRAÇÃO — acesso aberto (sem exigir login).
// Após apresentar ao clube, restaurar o proxy protegido:
//
//   import { updateSession } from "@/lib/supabase/proxy";
//
//   export async function proxy(request: NextRequest) {
//     return updateSession(request);
//   }
//
//   export const config = {
//     matcher: ["/jogadores/:path*", "/entrar/:path*", "/registrar/:path*"],
//   };
//
// (versão original no git: commit 8ee2d68)
// ============================================================

export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
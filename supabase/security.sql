-- =====================================================
-- iScout — Segurança: RLS restrito a usuários autenticados
-- Rodar no SQL Editor após o schema.sql
-- =====================================================

-- Remove as policies abertas de desenvolvimento
drop policy if exists "players acesso dev" on public.players;
drop policy if exists "stats acesso dev" on public.season_stats;
drop policy if exists "lesoes acesso dev" on public.player_injuries;
drop policy if exists "avaliacoes acesso dev" on public.player_evaluations;

-- Acesso concedido apenas à role authenticated
create policy "players autenticados leem"
  on public.players for select to authenticated using (true);
create policy "players autenticados escrevem"
  on public.players for insert to authenticated with check (true);
create policy "players autenticados atualizam"
  on public.players for update to authenticated using (true) with check (true);
create policy "players autenticados excluem"
  on public.players for delete to authenticated using (true);

create policy "stats autenticados leem"
  on public.season_stats for select to authenticated using (true);
create policy "stats autenticados escrevem"
  on public.season_stats for insert to authenticated with check (true);
create policy "stats autenticados atualizam"
  on public.season_stats for update to authenticated using (true) with check (true);
create policy "stats autenticados excluem"
  on public.season_stats for delete to authenticated using (true);

create policy "lesoes autenticados leem"
  on public.player_injuries for select to authenticated using (true);
create policy "lesoes autenticados escrevem"
  on public.player_injuries for insert to authenticated with check (true);
create policy "lesoes autenticados atualizam"
  on public.player_injuries for update to authenticated using (true) with check (true);
create policy "lesoes autenticados excluem"
  on public.player_injuries for delete to authenticated using (true);

create policy "avaliacoes autenticados leem"
  on public.player_evaluations for select to authenticated using (true);
create policy "avaliacoes autenticados escrevem"
  on public.player_evaluations for insert to authenticated with check (true);
create policy "avaliacoes autenticados atualizam"
  on public.player_evaluations for update to authenticated using (true) with check (true);
create policy "avaliacoes autenticados excluem"
  on public.player_evaluations for delete to authenticated using (true);
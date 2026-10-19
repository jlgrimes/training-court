-- Computed preview records. Invoker security preserves table RLS; auth.uid()
-- also scopes both tournaments and rounds to the authenticated account.
create or replace function public.get_tournament_previews_v1(
  game text default 'ptcg', preview_limit integer default 26
) returns setof jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  tournament_table text;
  round_table text;
begin
  if game = 'ptcg' then
    tournament_table := 'tournaments';
    round_table := 'tournament rounds';
  elsif game = 'pocket' then
    tournament_table := 'pocket_tournaments';
    round_table := 'pocket_tournament_rounds';
  else
    raise exception 'Unsupported tournament game';
  end if;
  return query execute format($query$
    with previews as (
      select t.* from public.%I t
      where t."user" = (select auth.uid())
      order by t.date_from desc, t.id
      limit greatest(1, coalesce($1, 26))
    )
    select to_jsonb(t) || summary.record
    from previews t
    cross join lateral (
      select jsonb_build_object(
        'wins', count(*) filter (where r.outcome = 'W'),
        'losses', count(*) filter (where r.outcome = 'L'),
        'ties', count(*) filter (where r.outcome = 'T')
      ) as record
      from (
        select case
          when cardinality(result) = 1 then result[1]
          when cardinality(result) = 2 and result[1] = result[2] then result[1]
          when cardinality(result) = 3 then result[3]
          else 'T'
        end as outcome
        from public.%I
        where tournament = t.id and "user" = (select auth.uid())
      ) r
    ) summary
    order by t.date_from desc, t.id
  $query$, tournament_table, round_table) using preview_limit;
end;
$$;
revoke all on function public.get_tournament_previews_v1(text, integer) from public;
grant execute on function public.get_tournament_previews_v1(text, integer) to authenticated;

-- Associate battle logs with saved decklists (similar to tournaments.decklist_id)

alter table public.logs
add column if not exists decklist_id uuid null;

do $$
begin
  alter table public.logs
    add constraint logs_decklist_id_fkey
    foreign key (decklist_id)
    references public.decklists(id)
    on delete set null;
exception
  when duplicate_object then
    null;
end $$;

create index if not exists logs_user_decklist_id_idx
  on public.logs ("user", decklist_id);

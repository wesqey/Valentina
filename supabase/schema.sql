-- ============================================================
-- VALENTINA ARCHITECTURE ARCHIVE — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable PostGIS for geo queries
create extension if not exists postgis;

-- ============================================================
-- BUILDINGS
-- ============================================================
create table if not exists buildings (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  address         text not null,
  city            text not null,
  country         text not null default 'US',
  lat             double precision not null,
  lng             double precision not null,
  geom            geometry(Point, 4326) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)) stored,

  -- Architectural data
  year_built      integer,
  year_demolished integer,
  architect       text,
  firm            text,
  style           text,
  height_m        numeric(8, 2),
  floors          integer,
  use_type        text,   -- residential, commercial, civic, religious, industrial, cultural, etc.
  materials       text[], -- e.g. ARRAY['concrete', 'glass', 'steel']
  description     text,

  -- External IDs
  osm_id          text unique,
  wikidata_id     text unique,

  -- Meta
  verified        boolean not null default false,
  images          jsonb,    -- [{url, caption, credit}]
  sources         jsonb,    -- [{label, url}]

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Spatial index for nearby queries
create index if not exists buildings_geom_idx on buildings using gist(geom);

-- Text search index
create index if not exists buildings_search_idx on buildings
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || address || ' ' || city || ' ' || coalesce(architect,'') || ' ' || coalesce(style,'')));

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger buildings_updated_at
  before update on buildings
  for each row execute function set_updated_at();

-- ============================================================
-- CONTRIBUTIONS (edit history)
-- ============================================================
create table if not exists contributions (
  id                  uuid primary key default gen_random_uuid(),
  building_id         uuid references buildings(id) on delete cascade,
  contributor_id      uuid,        -- nullable = anonymous
  contributor_username text,
  field_name          text not null,
  old_value           text,
  new_value           text not null,
  note                text,
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by         uuid,
  created_at          timestamptz not null default now(),
  reviewed_at         timestamptz
);

create index if not exists contributions_building_idx on contributions(building_id);
create index if not exists contributions_status_idx on contributions(status);

-- ============================================================
-- SAMPLE DATA — a few seed buildings
-- ============================================================
insert into buildings (name, address, city, country, lat, lng, year_built, architect, firm, style, height_m, floors, use_type, materials, description, verified)
values
  (
    'Seagram Building',
    '375 Park Avenue',
    'New York',
    'US',
    40.7583, -73.9728,
    1958,
    'Ludwig Mies van der Rohe',
    'Mies van der Rohe & Philip Johnson',
    'International Style',
    156.7, 38, 'commercial',
    ARRAY['bronze', 'glass', 'travertine'],
    'A landmark of the International Style, the Seagram Building set the standard for corporate skyscrapers with its bronze-clad curtain wall and open plaza.',
    true
  ),
  (
    'Fallingwater',
    '1491 Mill Run Road',
    'Mill Run',
    'US',
    39.9066, -79.4680,
    1939,
    'Frank Lloyd Wright',
    'Taliesin Fellowship',
    'Organic Architecture',
    null, 3, 'residential',
    ARRAY['reinforced concrete', 'sandstone', 'steel'],
    'Wright''s masterpiece of organic architecture, Fallingwater integrates with the natural waterfall below it through cantilevered terraces.',
    true
  ),
  (
    'Neue Nationalgalerie',
    'Potsdamer Straße 50',
    'Berlin',
    'DE',
    52.5044, 13.3686,
    1968,
    'Ludwig Mies van der Rohe',
    null,
    'International Style',
    8.4, 2, 'cultural',
    ARRAY['steel', 'glass'],
    'A single large steel roof supported by just eight columns, creating an unobstructed glass-enclosed hall. Mies''s last major building.',
    true
  )
on conflict do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table buildings enable row level security;
alter table contributions enable row level security;

-- Buildings: public read
create policy "buildings_public_read" on buildings
  for select using (true);

-- Contributions: public read of approved, insert for all
create policy "contributions_public_read" on contributions
  for select using (status = 'approved');

create policy "contributions_insert_all" on contributions
  for insert with check (true);

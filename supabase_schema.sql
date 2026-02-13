-- Deathmatch GG용 Supabase 기본 스키마
-- Supabase 콘솔 → SQL 탭에 이 내용을 그대로 붙여 넣고 실행하면 됩니다.

-- 친구 실명 정보
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  real_name text not null,
  memo text,
  created_at timestamptz not null default now()
);

-- 한 판 게임 정보
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz not null default now(), -- 실제 경기 시각
  duration_seconds integer not null,            -- 게임 시간(초 단위)
  season text,                                  -- 예: '2025'
  screenshot_url text,                          -- 스크린샷 위치 (Supabase Storage 경로)
  created_at timestamptz not null default now()
);

-- 한 판에서 한 플레이어의 전적
create table if not exists player_matches (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  friend_id uuid references friends(id) on delete set null,
  ingame_nickname text not null,
  team text not null check (team in ('BLUE', 'RED')),
  champion_name text not null,
  lane text check (lane in ('TOP','JUNGLE','MID','ADC','SUPPORT')),
  level integer,
  kills integer not null default 0,
  deaths integer not null default 0,
  assists integer not null default 0,
  damage integer,
  gold integer,
  cs integer,
  win boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_friends_real_name on friends(real_name);
create index if not exists idx_player_matches_friend on player_matches(friend_id);
create index if not exists idx_player_matches_match on player_matches(match_id);
create index if not exists idx_matches_season on matches(season);

-- ===============================
-- Storage: 스크린샷용 버킷 생성 (선택)
-- ===============================
-- 아래 쿼리는 한 번만 실행하면 됩니다.
-- 이미 'screenshots' 버킷이 있다면 오류가 날 수 있으니,
-- 존재하면 건너뛰어도 괜찮습니다.

-- 스크린샷을 저장할 공개 버킷 생성
-- (Supabase 콘솔의 Storage UI에서 수동으로 만들어도 됩니다.)
-- select storage.create_bucket('screenshots', public => true);

-- screenshots 버킷에 대해
-- - 누구나 읽기(select)
-- - 익명 사용자의 업로드(insert)를 허용하는 정책 예시입니다.
-- 필요에 따라 더 엄격하게 조정할 수 있습니다.

-- create policy "Public read screenshots"
--   on storage.objects
--   for select
--   using (bucket_id = 'screenshots');

-- create policy "Anyone upload screenshots"
--   on storage.objects
--   for insert
--   with check (bucket_id = 'screenshots');

-- ===============================
-- RLS (Row Level Security) 정책
-- ===============================
-- Supabase는 기본적으로 RLS가 활성화되어 있어서,
-- 익명 사용자가 insert/select를 하려면 정책을 추가해야 합니다.

-- friends 테이블: 누구나 읽기/쓰기 허용 (우리 친구들만 사용하는 사이트라서)
alter table friends enable row level security;

create policy "Anyone can read friends"
  on friends
  for select
  to public
  using (true);

create policy "Anyone can insert friends"
  on friends
  for insert
  to public
  with check (true);

-- matches 테이블: 누구나 읽기/쓰기 허용
alter table matches enable row level security;

create policy "Anyone can read matches"
  on matches
  for select
  to public
  using (true);

create policy "Anyone can insert matches"
  on matches
  for insert
  to public
  with check (true);

-- player_matches 테이블: 누구나 읽기/쓰기 허용
alter table player_matches enable row level security;

create policy "Anyone can read player_matches"
  on player_matches
  for select
  to public
  using (true);

create policy "Anyone can insert player_matches"
  on player_matches
  for insert
  to public
  with check (true);




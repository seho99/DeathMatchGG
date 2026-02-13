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



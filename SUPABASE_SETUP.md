# Supabase로 로또 번호 저장하기

## 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 로그인 후 **New project** 클릭
2. Organization 선택, **Project name** 입력 (예: `lotto`), 비밀번호 설정 후 **Create new project** 클릭
3. 프로젝트가 준비될 때까지 1~2분 대기

---

## 2. 테이블 만들기

1. 왼쪽 메뉴 **Table Editor** → **New table**
2. **Name**: `lotto_results` (또는 원하는 이름)
3. **Columns**는 아래처럼 추가 (또는 SQL로 한 번에 생성)

| Column name | Type | Default value | 체크 |
|-------------|------|---------------|------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `numbers` | `int4[]` (array) | - | - |
| `bonus` | `int4` | - | - |
| `created_at` | `timestamptz` | `now()` | - |

**SQL로 만들기 (추천):** 왼쪽 **SQL Editor**에서 아래 실행:

```sql
create table public.lotto_results (
  id uuid primary key default gen_random_uuid(),
  numbers int4[] not null,
  bonus int4 not null,
  created_at timestamptz default now()
);

-- 익명 사용자도 insert 가능 (웹에서 바로 저장)
alter table public.lotto_results enable row level security;

create policy "Allow anonymous insert"
  on public.lotto_results
  for insert
  to anon
  with check (true);

-- 본인만 보려면 select 정책 추가 (선택)
-- create policy "Allow anonymous select"
--   on public.lotto_results for select to anon using (true);
```

---

## 3. API 키 복사하기

1. 왼쪽 **Project Settings** (톱니바퀴) → **API**
2. **Project URL** 복사 (예: `https://xxxxx.supabase.co`)
3. **Project API keys**에서 **anon public** 키 복사

---

## 4. 웹에 키 넣기

### Vercel 배포 시 (권장)

1. [Vercel 대시보드](https://vercel.com/dashboard) → 해당 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 아래 두 개 추가:

| Name | Value | Environment |
|------|--------|--------------|
| `SUPABASE_URL` | Supabase **Project URL** (예: `https://xxxxx.supabase.co`) | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Supabase **anon public** 키 | Production, Preview, Development |

4. 저장 후 **Redeploy** 한 번 하면 적용됩니다.

배포된 사이트는 `/api/supabase-config` 를 통해 위 값만 안전하게 받아와서 사용합니다. 코드에 키를 넣을 필요 없습니다.

### 로컬에서 테스트할 때

- **방법 A:** 터미널에서 `vercel dev` 로 실행하고, 프로젝트 루트에 `.env` 파일 생성 후 아래 추가:
  ```
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=your_anon_key
  ```
- **방법 B:** `index.html` 에 아래 스크립트를 Supabase CDN 스크립트 **위에** 넣고, 값을 채운 뒤 로컬에서만 사용:
  ```html
  <script>
    window.SUPABASE_URL = 'https://xxxxx.supabase.co';
    window.SUPABASE_ANON_KEY = 'your_anon_key';
  </script>
  ```

저장한 뒤 **번호 추천받기**를 누르면 Supabase `lotto_results` 테이블에 자동으로 저장됩니다.

---

## 5. 저장되는 데이터 형태

추천 1세트당 **한 행**이 저장됩니다.

| id (자동) | numbers | bonus | created_at (자동) |
|-----------|---------|-------|--------------------|
| uuid | [3, 7, 12, 25, 33, 41] | 18 | 2026-03-11 14:00:00 |

- 5세트 추천 시 → 5행 저장
- Table Editor에서 **lotto_results** 테이블을 열어 확인할 수 있습니다.

---

## 보안 참고

- **anon** 키는 프론트에 노출돼도 되고, RLS로 insert만 허용해 두었습니다.
- 나중에 사용자별로 구분하려면 Supabase Auth를 켜고 `user_id` 컬럼을 추가한 뒤 정책을 바꾸면 됩니다.

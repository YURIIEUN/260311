# 로또 번호 추천

1~45 중 6개 번호와 보너스 1개를 추천하는 웹 서비스입니다.  
Supabase에 추천 결과를 저장할 수 있고, Vercel로 배포해 사용할 수 있습니다.

## 사용 방법

1. `index.html`을 브라우저에서 열거나, Vercel에 배포된 URL로 접속합니다.
2. (선택) 오른쪽 위 ☀/🌙 버튼으로 밝은/어두운 테마를 바꿀 수 있습니다.
3. 추천 세트 수를 선택한 뒤 **번호 추천받기** 버튼을 클릭합니다.
4. 결과 카드에서 번호를 확인합니다.  
   Vercel 환경 변수로 Supabase를 설정해 두었다면 추천 번호가 자동으로 Supabase에 저장됩니다.

## 파일 구성

| 파일/폴더 | 설명 |
|-----------|------|
| `index.html` | 페이지 구조 |
| `style.css` | 스타일 (밝은/어두운 테마) |
| `script.js` | 추천 로직, Supabase 저장, 테마 전환 |
| `api/supabase-config.js` | Vercel Serverless: Supabase URL/키를 환경 변수에서 전달 |
| `SUPABASE_SETUP.md` | Supabase 테이블 생성 및 Vercel 환경 변수 설정 가이드 |
| `push.bat` | 로컬에서 Git 커밋·푸시 한 번에 실행 (Windows) |
| `Git푸시방법.txt` | Git 설치 후 push.bat 사용 방법 안내 |

## 배포 (Vercel)

- 저장소를 Vercel에 연결한 뒤 배포하면 됩니다.
- Supabase에 저장하려면 Vercel **Environment Variables**에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 설정한 후 Redeploy 하세요.  
  자세한 단계는 **SUPABASE_SETUP.md**를 참고하세요.

## 참고

참고용이며, 당첨을 보장하지 않습니다. 재미로만 이용해 주세요.

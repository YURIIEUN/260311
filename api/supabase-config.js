/**
 * Vercel Serverless Function
 * 환경 변수 SUPABASE_URL, SUPABASE_ANON_KEY 를 클라이언트에 전달합니다.
 * Vercel 대시보드 → Project → Settings → Environment Variables 에서 설정하세요.
 */
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  });
}

/**
 * Vercel Serverless Function (Web Standard)
 * 환경 변수 SUPABASE_URL, SUPABASE_ANON_KEY 를 클라이언트에 전달합니다.
 */
export default {
  fetch(request) {
    const body = JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    });
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "s-maxage=60, stale-while-revalidate",
      },
    });
  },
};

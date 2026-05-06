import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SESSIONS = 50;

export async function POST(req: Request) {
  try {
    const { familyCode, session } = (await req.json()) as {
      familyCode: string;
      session: unknown;
    };
    if (!familyCode || !session) {
      return Response.json({ error: "missing fields" }, { status: 400 });
    }
    const key = `family:${familyCode.toUpperCase()}`;
    await kv.lpush(key, JSON.stringify(session));
    await kv.ltrim(key, 0, MAX_SESSIONS - 1);
    await kv.expire(key, 60 * 60 * 24 * 180); // 180日保持
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("code");
    if (!code) return Response.json({ error: "missing code" }, { status: 400 });
    const raw = await kv.lrange(`family:${code.toUpperCase()}`, 0, MAX_SESSIONS - 1);
    const sessions = raw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );
    return Response.json({ sessions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}

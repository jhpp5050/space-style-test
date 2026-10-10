// 관리자: 비밀번호 확인 → 신청 목록 / 상태 바꾸기 / 대기 중인 메일 보내기
const crypto = require('node:crypto');
const { mailReady, sendMail } = require('./_mail.js');

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});
const same = (a, b) => {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
};
const STATUSES = ['새 문의', '연락함', '완료'];
const patchRow = (id, body) => fetch(`${SB_URL}/rest/v1/inquiries?id=eq.${id}`, {
  method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(body),
});

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.status(500).json({ error: 'Vercel 환경변수에 ADMIN_PASSWORD를 넣고 Redeploy 해 주세요.' });
  if (!same(req.headers['x-admin-password'] || '', pass)) return res.status(401).json({ error: '비밀번호가 맞지 않아요.' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase 연결 정보가 없어요.' });

  if (req.method === 'GET') {
    const r = await fetch(`${SB_URL}/rest/v1/inquiries?select=*&order=created_at.desc&limit=500`, { headers: sbHeaders() });
    if (!r.ok) return res.status(500).json({ error: '불러오지 못했어요.' });
    return res.status(200).json({ rows: await r.json(), mailReady: mailReady() });
  }

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const id = Number(b.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 요청이에요.' });

  if (req.method === 'PATCH') {
    if (!STATUSES.includes(b.status)) return res.status(400).json({ error: '잘못된 요청이에요.' });
    const r = await patchRow(id, { status: b.status, updated_at: new Date().toISOString() });
    if (!r.ok) return res.status(500).json({ error: '바꾸지 못했어요.' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST' && b.action === 'send') {
    if (!mailReady()) return res.status(400).json({ error: '메일 설정(RESEND_API_KEY, MAIL_FROM)이 아직 없어요.' });
    const r = await fetch(`${SB_URL}/rest/v1/inquiries?id=eq.${id}&select=email,style,mail_sent_at`, { headers: sbHeaders() });
    const [row] = r.ok ? await r.json() : [];
    if (!row) return res.status(404).json({ error: '신청을 찾지 못했어요.' });
    if (row.mail_sent_at) return res.status(200).json({ ok: true });
    try {
      await sendMail(row.email, row.style, `https://${req.headers.host}`);
      await patchRow(id, { mail_sent_at: new Date().toISOString(), mail_error: null });
      return res.status(200).json({ ok: true });
    } catch (e) {
      await patchRow(id, { mail_error: String(e.message).slice(0, 300) });
      return res.status(502).json({ error: '메일을 보내지 못했어요. 메일 설정을 확인해 주세요.' });
    }
  }
  return res.status(405).json({ error: '지원하지 않는 요청이에요.' });
};

// 결과 화면의 이메일 신청을 저장하고, 메일 설정이 있으면 추천 아이템 메일을 보낸다.
const { STYLES } = require('../assets/data.js');
const { mailReady, sendMail } = require('./_mail.js');

const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: '아직 저장 준비가 안 됐어요. 잠시 뒤 다시 시도해 주세요.' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // 스팸 함정 칸(사람에게는 안 보임)

  const row = {
    email: clip(b.email, 200).toLowerCase(),
    style: clip(b.style, 20),
    consent: b.consent === true,
    mail_consent: b.mailConsent === true,
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return res.status(400).json({ error: '이메일 주소를 확인해 주세요.' });
  if (!STYLES[row.style]) return res.status(400).json({ error: '테스트를 먼저 끝내 주세요.' });
  if (!row.consent) return res.status(400).json({ error: '개인정보 수집·이용에 동의해 주세요.' });
  if (!row.mail_consent) return res.status(400).json({ error: '추천 아이템 메일 받기에 동의해 주세요.' });

  const r = await fetch(`${SB_URL}/rest/v1/inquiries?select=id`, {
    method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=representation' }, body: JSON.stringify(row),
  });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
  const [{ id }] = await r.json();

  // 메일 설정(RESEND_API_KEY, MAIL_FROM)이 없으면 저장만 하고, 관리자 화면에 '발송 대기'로 남는다.
  if (!mailReady()) return res.status(200).json({ ok: true, mailed: false });

  const site = req.headers.host ? `https://${req.headers.host}` : '';
  let patch;
  try {
    await sendMail(row.email, row.style, site);
    patch = { mail_sent_at: new Date().toISOString(), mail_error: null };
  } catch (e) {
    patch = { mail_error: String(e.message).slice(0, 300) };
  }
  await fetch(`${SB_URL}/rest/v1/inquiries?id=eq.${id}`, {
    method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(patch),
  }).catch(() => {});
  return res.status(200).json({ ok: true, mailed: !!patch.mail_sent_at });
};

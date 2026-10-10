// 추천 아이템 메일 (Resend). /api/inquiry 와 /api/admin 이 같이 쓴다. 키는 환경변수로만 읽는다.
const { STYLES } = require('../assets/data.js');

const RESEND_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM; // 예: 공간 스타일 진단 <hello@내도메인>
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mailReady = () => !!(RESEND_KEY && MAIL_FROM);

function mailHtml(style, site) {
  const s = STYLES[style];
  const items = s.items.map(([name, why]) =>
    `<tr><td style="padding:14px 0;border-top:1px solid #e4ded6"><b style="font-size:16px">${esc(name)}</b><br><span style="color:#6f655c">${esc(why)}</span></td></tr>`).join('');
  return `<div style="background:#faf8f5;padding:32px 20px;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#2e2723">
  <div style="max-width:520px;margin:0 auto">
    <p style="margin:0 0 6px;color:#6f655c">내 공간 스타일은</p>
    <h1 style="margin:0 0 8px;font-size:30px;letter-spacing:-1px">${esc(s.name)}</h1>
    <p style="margin:0 0 24px;font-weight:700">${esc(s.line)}</p>
    <p style="margin:0 0 8px;font-weight:700">추천 아이템 다섯 가지</p>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <p style="margin:24px 0 0;padding:16px;background:#eee9e2;border-radius:12px"><b>오늘 해 볼 첫걸음</b><br>${esc(s.firstStep)}</p>
    <p style="margin:28px 0 0;font-size:13px;color:#6f655c">공간 스타일 진단에서 추천 아이템 받기를 신청하셔서 한 번 보내 드리는 메일이에요.${site ? ` <a href="${esc(site)}/result?s=${style}" style="color:#6f655c">내 결과 다시 보기</a>` : ''}</p>
  </div></div>`;
}

async function sendMail(to, style, site) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      subject: `내 공간 스타일은 ${STYLES[style].name} — 추천 아이템 다섯 가지`,
      html: mailHtml(style, site),
    }),
  });
  if (!r.ok) throw new Error(`메일 발송 실패 (${r.status}) ${(await r.text()).slice(0, 150)}`);
}

module.exports = { mailReady, sendMail };

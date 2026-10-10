// 세 스타일을 상징하는 선 그림. 색은 currentColor를 따른다.
(function (root) {
  const svg = (body) =>
    `<svg viewBox="0 0 120 160" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  root.STYLE_ART = {
    // 아크 플로어 램프
    minimal: svg(`
      <path d="M46 150h30"/>
      <path d="M61 150V62c0-20 10-30 30-30"/>
      <path d="M80 32h24l-5 15H85z"/>
      <path d="M92 47v5" stroke-dasharray="1 4"/>`),
    // 큰 잎 화분
    natural: svg(`
      <path d="M44 116h34l-5 34H49z"/>
      <path d="M61 116c0-18-4-34-18-46"/>
      <path d="M43 70c-12-4-16-16-10-24 12 0 16 12 10 24z"/>
      <path d="M61 116c0-24 6-44 20-56"/>
      <path d="M81 60c2-12 14-18 22-14-2 12-12 18-22 14z"/>
      <path d="M61 104c-8-6-20-8-28-4 6 8 18 10 28 4z"/>`),
    // 가는 다리 라운지 체어 + 버섯 램프
    vintage: svg(`
      <path d="M30 70c-2 22 2 38 12 44h36c6 0 9-3 9-8H48c-6 0-8-4-8-10l2-26c0-4-2-6-6-6z"/>
      <path d="M44 114l-6 36M76 114l6 36"/>
      <path d="M92 78c0-10 7-16 12-16s12 6 12 16z"/>
      <path d="M104 78v24M98 102h12"/>`),
  };
})(window);

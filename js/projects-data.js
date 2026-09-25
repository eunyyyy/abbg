// AI WEB portfolio hub — canonical project list
//
// This is the single source of truth for the 17 shipped projects. It is used:
//  1. As the fallback the public site (js/main.js) renders from when Firestore
//     is unreachable or js/firebase-config.js is still on the placeholder config.
//  2. As the payload the admin Project tab's "시드 데이터 불러오기" button writes
//     into the Firestore `projects` collection (one document per entry, doc id
//     = the zero-padded `number` field) the first time a real Firebase project
//     is wired up.
//
// Schema (kept 1:1 with what the site already renders per project):
//   number   — 2-digit string, e.g. "01" (also used as the projects/{number} doc id)
//   name     — display name
//   category — one of the 7 industry categories used across the site
//   url      — absolute live URL of the deployed landing page
//   cover    — relative path to the marquee cover image (may be '' for a
//              project added later that has no cover shot yet)
export const PROJECTS_FALLBACK = [
  { number: '01', name: 'NEXFORGE', category: '테크·제조', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%ED%85%8C%ED%81%AC%C2%B7%EC%A0%9C%EC%A1%B0/nexforge/', cover: 'img/covers/nexforge.jpg' },
  { number: '02', name: 'AERIUM', category: 'IT·마케팅', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/IT%C2%B7%EB%A7%88%EC%BC%80%ED%8C%85/aerium/', cover: 'img/covers/aerium.jpg' },
  { number: '03', name: 'Mobilion', category: '모빌리티', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%AA%A8%EB%B9%8C%EB%A6%AC%ED%8B%B0/%EB%AA%A8%EB%B9%8C%EB%A6%AC%EC%98%A8/', cover: 'img/covers/mobilion.jpg' },
  { number: '04', name: 'VELOCORE', category: '테크·제조', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%ED%85%8C%ED%81%AC%C2%B7%EC%A0%9C%EC%A1%B0/%EB%B2%A8%EB%A1%9C%EC%BD%94%EC%96%B4/', cover: 'img/covers/velocore.jpg' },
  { number: '05', name: 'OBLIQ', category: 'IT·마케팅', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/IT%C2%B7%EB%A7%88%EC%BC%80%ED%8C%85/%EC%98%A4%EB%B8%94%EB%A6%AC%ED%81%AC/', cover: 'img/covers/obliq.jpg' },
  { number: '06', name: 'OSMERE', category: '라이프스타일', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC/%EC%98%A4%EC%8A%A4%EB%A9%94%EC%96%B4/', cover: 'img/covers/osmere.jpg' },
  { number: '07', name: 'AUBERON', category: '라이프스타일', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC/%EC%98%A4%EB%B2%A0%EB%A1%A0/', cover: 'img/covers/auberon.jpg' },
  { number: '08', name: 'VESTIA', category: '라이프스타일', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC/%EB%B2%A0%EC%8A%A4%ED%8B%B0%EC%95%84/', cover: 'img/covers/vestia.jpg' },
  { number: '09', name: 'kadence', category: '라이프스타일', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC/%EC%B9%B4%EB%8D%B4%EC%8A%A4/', cover: 'img/covers/kadence.jpg' },
  { number: '10', name: 'WEFT', category: '라이프스타일', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC/%EC%9B%A8%ED%94%84%ED%8A%B8/', cover: 'img/covers/weft.jpg' },
  { number: '11', name: 'EMBERIC', category: '라이프스타일', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%9D%BC%EC%9D%B4%ED%94%84%EC%8A%A4%ED%83%80%EC%9D%BC/%EC%97%A0%EB%B2%84%EB%A6%AD/', cover: 'img/covers/emberic.jpg' },
  { number: '12', name: 'NOM Burger & Wings', category: 'F&B', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/F%26B/NOM%EB%B2%84%EA%B1%B0%EC%95%A4%EC%9C%99%EC%8A%A4/', cover: 'img/covers/nom-burger-wings.jpg' },
  { number: '13', name: 'HALCYON', category: 'IT·마케팅', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/IT%C2%B7%EB%A7%88%EC%BC%80%ED%8C%85/halcyon/', cover: 'img/covers/halcyon.jpg' },
  { number: '14', name: 'AGRINOVA', category: '농축수산업', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%86%8D%EC%B6%95%EC%88%98%EC%82%B0%EC%97%85/20.AGRINOVA/', cover: 'img/covers/agrinova.jpg' },
  { number: '15', name: 'VERAHYDE', category: '바이오·헬스케어', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EB%B0%94%EC%9D%B4%EC%98%A4%C2%B7%ED%97%AC%EC%8A%A4%EC%BC%80%EC%96%B4/21.VERAHYDE/', cover: 'img/covers/verahyde.jpg' },
  { number: '16', name: 'COGNOVA', category: 'IT·마케팅', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/IT%C2%B7%EB%A7%88%EC%BC%80%ED%8C%85/22.COGNOVA/', cover: 'img/covers/cognova.jpg' },
  { number: '17', name: 'LUMOLAB', category: '교육·미디어', url: 'https://eunyyyy.github.io/abbg/ai-landingpage/%EA%B5%90%EC%9C%A1%C2%B7%EB%AF%B8%EB%94%94%EC%96%B4/23.LUMOLAB/', cover: 'img/covers/lumolab.jpg' }
];

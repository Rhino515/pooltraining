/**
 * Billiard-ball badges (SVG): the BALL is the level. Solids 1–8, stripes 9–15, standard colors shared with the
 * table renderer (tableDiagram.js BALL_COLORS). Champion (MAX RANK) = gold-ringed cue ball with a crown.
 */
import { BALL_COLORS } from '../tableDiagram.js';

let uid = 0;
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** ballSVG(7) → a real-looking 7-ball. opts: { size (px), cls, title } */
export function ballSVG(n, opts = {}) {
  const size = opts.size || 56;
  const id = `bb${++uid}`;
  const num = Math.max(1, Math.min(15, Math.round(Number(n) || 1)));
  const col = BALL_COLORS[num] || '#94a3b8';
  const stripe = num >= 9;
  const body = stripe
    ? `<circle cx="50" cy="50" r="46" fill="#f8fafc"/><path d="M8 32 H92 A46 46 0 0 1 92 68 H8 A46 46 0 0 1 8 32 Z" fill="${col}"/>`
    : `<circle cx="50" cy="50" r="46" fill="${col}"/>`;
  return `<svg class="ballBadge ${opts.cls || ''}" data-ball="${num}" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(opts.title || `${num}-ball`)}"><defs><radialGradient id="${id}s" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>${body}<circle cx="50" cy="50" r="21" fill="#f8fafc"/><text x="50" y="${num >= 10 ? 58 : 59}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="${num >= 10 ? 23 : 26}" fill="#05111b">${num}</text><circle cx="50" cy="50" r="46" fill="url(#${id}s)"/><circle cx="50" cy="50" r="46" fill="none" stroke="#050b10" stroke-width="2"/></svg>`;
}
/** MAX RANK badge (Champion): cue ball, gold ring, crown */
export function championSVG(opts = {}) {
  const size = opts.size || 56;
  const id = `bc${++uid}`;
  return `<svg class="ballBadge champ ${opts.cls || ''}" data-ball="max" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(opts.title || 'Max rank')}"><defs><radialGradient id="${id}s" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="none" stroke="#ffc75b" stroke-width="5"/><circle cx="50" cy="50" r="41" fill="#f5f7fa"/><path d="M30 60 L33 38 L42 49 L50 33 L58 49 L67 38 L70 60 Z" fill="#ffc75b" stroke="#8a6a12" stroke-width="2" stroke-linejoin="round"/><rect x="30" y="61" width="40" height="7" rx="2" fill="#ffc75b" stroke="#8a6a12" stroke-width="2"/><circle cx="50" cy="50" r="41" fill="url(#${id}s)"/></svg>`;
}
/**
 * Career rank emblem: the same crowned-8 artwork, one ball per rank.
 * Rookie is the 1-ball through Champion the 10-ball. Balls 1–7 have no crown.
 * Balls 8, 9, and 10 keep that crown. This is the rank, not the level ball inside it.
 */
const CAREER_EMBLEM_NAMES = ['Rookie', 'Club Player', 'Shooter', 'Competitor', 'Advanced', 'Expert', 'Master', 'Elite', 'Pro', 'Champion'];
export function careerEmblemBall(status) {
  if (!status) return null;
  if (status.rankIndex != null && status.rankIndex !== '') {
    const idx = Number(status.rankIndex);
    if (Number.isInteger(idx) && idx >= 0 && idx < CAREER_EMBLEM_NAMES.length) return idx + 1;
  }
  const blob = `${status.name || ''} ${status.rank_name || ''} ${status.title || ''}`;
  const ordered = CAREER_EMBLEM_NAMES.map((name, i) => [name, i + 1]).sort((a, b) => b[0].length - a[0].length);
  for (const [name, ball] of ordered) {
    const re = new RegExp(`(?:^|[^A-Za-z])${name.replace(/ /g, '\\s+')}(?:[^A-Za-z]|$)`);
    if (re.test(blob)) return ball;
  }
  return null;
}
export function rankBadgeSVG(status, opts = {}) {
  const size = opts.size || 56;
  const ball = careerEmblemBall(status);
  const title = status?.champion ? (status.title || 'Max rank') : (status?.title || 'Career rank');
  const h = Math.round(size * (334 / 344));
  const src = ball ? `./icons/rank-career-${ball}.png` : './icons/rank-career.png';
  const dataBall = ball != null ? String(ball) : (status?.champion ? 'max' : (status?.ball ?? ''));
  return `<img class="rankEmblem ${opts.cls || ''}" data-ball="${dataBall}" src="${src}" width="${size}" height="${h}" alt="${esc(title)}" style="width:${size}px;height:auto"/>`;
}
/**
 * Rank #9 drill emblem: an original cube of green billiard chalk (the familiar Master-chalk shape and color).
 * No brand name and no logo. Same isometric badge frame as the other drill ranks.
 */
export function masterChalkSVG(number, opts = {}) {
  const size = opts.size || 56;
  const id = `mc${++uid}`;
  const n = esc(number ?? 9);
  return `<svg class="drillBadge chalkCube ${opts.cls || ''}" data-drillrank="9" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(opts.title || 'Drill rank 9, chalk')}">
    <defs>
      <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d8f62"/><stop offset="1" stop-color="#2a6b48"/></linearGradient>
      <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f6a45"/><stop offset="1" stop-color="#145536"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0e3d28"/><stop offset="1" stop-color="#187048"/></linearGradient>
    </defs>
    <path d="M50 8 L88 28 L50 48 L12 28 Z" fill="url(#${id}t)" stroke="#0c2e1e" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 28 L50 48 L50 90 L12 70 Z" fill="url(#${id}f)" stroke="#0c2e1e" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M50 48 L88 28 L88 70 L50 90 Z" fill="url(#${id}s)" stroke="#0c2e1e" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M22 40 L46 53 L46 78 L22 65 Z" fill="#f3ecdc" stroke="#c9b89a" stroke-width="0.8"/>
    <path d="M24 44 H44 M24 48 H44 M24 52 H40" stroke="#d9cbb3" stroke-width="0.7"/>
    <path d="M16 32 l4 2 M78 34 l-3 2 M20 62 l3 4" stroke="#8fd0a8" stroke-width="0.6" opacity=".45"/>
    <text x="62" y="74" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="22" fill="#f4efe2">${n}</text>
  </svg>`;
}
/** Drill Rank emblem: the mockup chalk cube. The number is the real drill rank, drawn over the face. */
export function drillBadgeSVG(number, opts = {}) {
  const size = opts.size || 56;
  const n = esc(number ?? '');
  const h = Math.round(size * (206 / 211));
  const fs = Math.max(9, Math.round(size * 0.28));
  return `<span class="drillEmblem ${opts.cls || ''}" data-drillrank="${n}" style="width:${size}px;font-size:${fs}px" role="img" aria-label="${esc(opts.title || `Drill rank ${number}`)}"><img src="./icons/rank-drill.png" width="${size}" height="${h}" alt=""/><b>${n}</b></span>`;
}
/** Default avatar: a ball with the player's initials; color from the name */
export function initialsAvatarSVG(name = '', opts = {}) {
  const size = opts.size || 56;
  const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
  const ini = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = (h % 15) + 1;
  const col = BALL_COLORS[n === 8 ? 2 : n];
  const stripe = n >= 9;
  const body = stripe ? `<circle cx="50" cy="50" r="46" fill="#f8fafc"/><path d="M8 32 H92 A46 46 0 0 1 92 68 H8 A46 46 0 0 1 8 32 Z" fill="${col}"/>` : `<circle cx="50" cy="50" r="46" fill="${col}"/>`;
  return `<svg class="avatarSvg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${esc(name || 'Player')}">${body}<circle cx="50" cy="50" r="27" fill="#f8fafc"/><text x="50" y="59" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="${ini.length > 1 ? 24 : 28}" fill="#05111b">${esc(ini)}</text><circle cx="50" cy="50" r="46" fill="none" stroke="#050b10" stroke-width="2"/></svg>`;
}
/** Avatar: photo data URL (validated) or initials ball */
export function avatarHTML(p = {}, size = 56, cls = '') {
  const src = typeof p.avatar === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.avatar) ? p.avatar : null;
  return `<span class="avatar ${cls}" style="width:${size}px;height:${size}px" data-avatar="${src ? 'photo' : 'initials'}">${src ? `<img src="${src}" alt="${esc(p.name || p.displayName || 'Player')}" width="${size}" height="${size}"/>` : initialsAvatarSVG(p.name || p.displayName || '', { size })}</span>`;
}

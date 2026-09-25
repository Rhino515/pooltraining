/**
 * Career ranks — concrete achievements read from saved results only.
 * Requirement types: gameLevel {game, level}, ghost {balls, race}, stars {total}, pb {game, key, value}, boss {rank}.
 * When every non-boss requirement for the next rank is met, that rank's Boss Battle unlocks.
 * Beating the boss promotes. XP never promotes. rankFloor preserves ranks earned before V4.
 */
import { RANK_NAMES } from './storage.js';
import { gameLevel, ghostBeaten, totalStars, gameState, nextOpenStage, isGameUnlocked, unlockLabel } from './games/engine.js';
import { getGame, bossForRank, stageSpecs } from './games/registry.js';

export { RANK_NAMES };

const L = (game, level) => ({ type: 'gameLevel', game, level });
const GH = (balls, race) => ({ type: 'ghost', balls, race });
const BOSS = (rank) => ({ type: 'boss', rank });

export const RANK_REQUIREMENTS = [
  { rank: 0, name: 'Rookie', requirements: [] },
  { rank: 1, name: 'Club Player', requirements: [L('landing', 2), L('sniper', 2), L('speed', 2), GH(3, 3), BOSS(1)] },
  { rank: 2, name: 'Shooter', requirements: [L('landing', 3), L('stun', 2), L('draw', 2), L('follow', 2), L('sniper', 3), L('bank', 1), GH(3, 5), BOSS(2)] },
  { rank: 3, name: 'Competitor', requirements: [L('landing', 4), L('draw', 3), L('follow', 3), L('stun', 3), L('speed', 4), L('bank', 3), L('kick', 2), GH(4, 3), BOSS(3)] },
  { rank: 4, name: 'Advanced', requirements: [L('landing', 5), L('draw', 4), L('follow', 4), L('stun', 4), L('bank', 4), L('kick', 3), L('train', 3), L('safety', 2), L('sniper', 5), GH(4, 5), BOSS(4)] },
  { rank: 5, name: 'Expert', requirements: [GH(5, 5), L('bank', 6), L('kick', 5), L('landing', 7), L('draw', 6), L('follow', 6), L('stun', 6), L('train', 7), L('safety', 5), BOSS(5)] },
  { rank: 6, name: 'Master', requirements: [GH(6, 5), L('landing', 8), L('draw', 7), L('follow', 7), L('stun', 7), L('speed', 7), L('bank', 7), L('kick', 6), L('train', 7), L('carom', 4), L('pattern', 3), L('rail', 3), BOSS(6)] },
  { rank: 7, name: 'Elite', requirements: [GH(7, 7), L('landing', 9), L('draw', 8), L('follow', 8), L('stun', 8), L('speed', 8), L('bank', 8), L('kick', 7), L('train', 8), L('safety', 6), L('carom', 5), L('pattern', 4), L('rail', 4), L('sniper', 7), BOSS(7)] },
  { rank: 8, name: 'Pro', requirements: [GH(8, 7), L('landing', 10), L('draw', 9), L('stun', 9), L('speed', 9), L('kick', 8), L('carom', 6), L('pattern', 5), L('rail', 5), L('sniper', 8), { type: 'pb', game: 'bank', key: 'endlessBest', value: 1000, label: 'Bank Vault Endless: 1,000 points' }, BOSS(8)] },
  { rank: 9, name: 'Champion', requirements: [GH(9, 9), L('kick', 9), L('carom', 7), L('rail', 6), { type: 'pb', game: 'train', key: 'perfectRuns', value: 3, label: 'Position Train: 3 perfect runs' }, { type: 'stars', total: 240, label: 'Earn 240 Arcade stars' }, BOSS(9)] }
];

export function ghostWins(state, balls = null) {
  return (state.ghostMatches || []).filter((m) => m.won && (balls == null || m.balls === balls)).length;
}

export function requirementLabel(req) {
  if (req.label) return req.label;
  if (req.type === 'gameLevel') return `${getGame(req.game)?.name || req.game} Level ${req.level}`;
  if (req.type === 'ghost') return `Defeat the ${req.balls}-Ball Ghost (race to ${req.race})`;
  if (req.type === 'boss') return `Boss Battle: beat ${bossForRank(req.rank)?.name || 'the boss'}`;
  if (req.type === 'stars') return `Earn ${req.total} Arcade stars`;
  return 'Requirement';
}

export function requirementProgress(req, state) {
  if (req.type === 'gameLevel') return { have: gameLevel(state, req.game), need: req.level };
  if (req.type === 'ghost') return { have: ghostBeaten(state, req.balls, req.race) ? 1 : 0, need: 1 };
  if (req.type === 'boss') return { have: state.bosses?.[bossForRank(req.rank)?.id]?.passed ? 1 : 0, need: 1 };
  if (req.type === 'stars') return { have: totalStars(state), need: req.total };
  if (req.type === 'pb') return { have: gameState(state, req.game).pb?.[req.key] || 0, need: req.value };
  return { have: 0, need: 1 };
}

export function checkRequirement(req, state) {
  const p = requirementProgress(req, state);
  return p.have >= p.need;
}

/** Where the player should go to work on a requirement */
export function requirementLink(req, state) {
  if (req.type === 'gameLevel') {
    if (!isGameUnlocked(state, req.game)) {
      const u = getGame(req.game)?.unlock;
      if (u?.game) {
        const st = nextOpenStage(state, u.game);
        return { href: st ? `#play/${u.game}/${st.id}` : `#game/${u.game}`, text: `Unlock via ${unlockLabel(req.game)}` };
      }
      return { href: '#arcade', text: 'Unlock in Arcade' };
    }
    const st = nextOpenStage(state, req.game);
    return st ? { href: `#play/${req.game}/${st.id}`, text: `${getGame(req.game).name} · ${st.name}` } : { href: `#game/${req.game}`, text: getGame(req.game).name };
  }
  if (req.type === 'ghost') return { href: `#ghost/${req.balls}/${req.race}`, text: `${req.balls}-Ball Ghost · race to ${req.race}` };
  if (req.type === 'boss') {
    const b = bossForRank(req.rank);
    return { href: `#boss/${b.id}`, text: b.name };
  }
  if (req.type === 'pb') return { href: req.game === 'bank' ? '#play/bank/endless' : `#game/${req.game}`, text: getGame(req.game)?.name };
  return { href: '#arcade', text: 'Arcade' };
}

export function requirementChecklist(rankIndex, state) {
  const def = RANK_REQUIREMENTS[rankIndex];
  if (!def) return [];
  return def.requirements.map((r) => ({ ...r, label: requirementLabel(r), met: checkRequirement(r, state), progress: requirementProgress(r, state), link: requirementLink(r, state) }));
}

export function nonBossMet(rankIndex, state) {
  const def = RANK_REQUIREMENTS[rankIndex];
  if (!def) return false;
  return def.requirements.filter((r) => r.type !== 'boss').every((r) => checkRequirement(r, state));
}

export function requirementsMet(rankIndex, state) {
  const def = RANK_REQUIREMENTS[rankIndex];
  return !!def && def.requirements.every((r) => checkRequirement(r, state));
}

/** Boss for rank r is playable when you hold rank r-1 and every other requirement is met */
export function isBossUnlocked(state, boss) {
  return (state.rankIndex || 0) === boss.rank - 1 && nonBossMet(boss.rank, state);
}

/** Highest rank earned: starts at rankFloor, then climbs while each rank's boss has been beaten. */
export function computeEarnedRankIndex(state) {
  let earned = Math.max(0, Math.min(9, state.rankFloor || 0));
  for (let i = earned + 1; i < RANK_REQUIREMENTS.length; i++) {
    if (requirementsMet(i, state)) earned = i;
    else break;
  }
  return earned;
}

export function syncRank(state) {
  return { ...state, rankIndex: computeEarnedRankIndex(state) };
}

export function nextRankInfo(state) {
  const idx = state.rankIndex || 0;
  if (idx >= 9) return { current: RANK_NAMES[9], next: null, checklist: [], progress: 1 };
  const checklist = requirementChecklist(idx + 1, state);
  const met = checklist.filter((c) => c.met).length;
  return { current: RANK_NAMES[idx], next: RANK_NAMES[idx + 1], checklist, progress: checklist.length ? met / checklist.length : 1 };
}

/** The single next thing to do on the Career path */
export function nextUp(state) {
  const info = nextRankInfo(state);
  if (!info.next) return { done: true, title: 'Champion', text: 'Every rank earned. Replay the Arcade for personal bests.', href: '#arcade' };
  const open = info.checklist.filter((c) => !c.met);
  const nonBoss = open.filter((c) => c.type !== 'boss');
  const item = nonBoss[0] || open[0];
  if (!item) return { done: true, title: info.next, text: 'Promotion ready.', href: '#career' };
  if (item.type === 'boss') {
    const b = bossForRank(item.rank);
    return { title: `Boss Battle unlocked: ${b.name}`, text: `Every requirement for ${info.next} is met. Beat the boss to promote.`, href: `#boss/${b.id}`, req: item, rank: info.next };
  }
  const p = item.progress;
  let detail = '';
  if (item.type === 'gameLevel') {
    const st = nextOpenStage(state, item.game);
    detail = st ? `Next stage: ${st.name} (level ${p.have + 1} of ${stageSpecs(item.game).length}).` : '';
    if (!isGameUnlocked(state, item.game)) detail = `${getGame(item.game).name} is locked — ${unlockLabel(item.game)} opens it.`;
  } else if (item.type === 'ghost') detail = 'Start the match from the Ghost screen; the race length must be at least this long.';
  else if (item.type === 'stars' || item.type === 'pb') detail = `${p.have} / ${p.need}`;
  return { title: item.label, text: detail, href: item.link.href, linkText: item.link.text, req: item, rank: info.next, remaining: open.length };
}

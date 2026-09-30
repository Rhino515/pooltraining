/**
 * Learn pages. No invented lessons.
 * Rules text is a short paraphrase of /workspace/research/RULES_SOURCES.md,
 * rules-sources.json, the WPA Rules of Play PDF (effective 2025-09-15),
 * the APA Game Rules Booklet LY 2026/27–2028/29, the CSI rulebook dated 08/12/2025,
 * and the Ultimate Pool USA league manual v5.0 fetched 2026-09-30 from
 * https://league.ultimatepoolusa.com/docs/uplmanual.pdf.
 * Bar is Pool IQ's own preset, not an official book.
 */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const back = (href, label) => `<button type="button" class="linkish back" data-action="go" data-href="${href}">‹ ${esc(label)}</button>`;

function page(title, body, href = '#learn', label = 'Learn') {
  return `<div class="title learnPage" data-page-learn><div>${back(href, label)}</div><h1>${esc(title)}</h1>${body}</div>`;
}

function src(name, url) {
  return `<p class="learnSrc"><b>Source:</b> ${esc(name)}<br><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a></p>`;
}

function bullets(lines) {
  return `<ul class="learnRules">${lines.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
}

function list(items) {
  return `<div class="learnList">${items.map(([href, name, sub]) => `<button type="button" class="card learnRow" data-action="go" data-href="${href}"><b>${esc(name)}</b><small>${esc(sub)}</small></button>`).join('')}</div>`;
}

const WPA_URL = 'https://wpapool.com/wp-content/uploads/2026/01/2026.01.02-WPA-Rules.pdf';
const APA_URL = 'http://media.poolplayers.com/TMRB/Rules-Booklet-English.pdf';
const CSI_URL = 'https://www.playcsipool.com/uploads/7/3/5/9/7359673/official_rules_of_csi__08122025.pdf';
const BCA_URL = 'https://bca-pool.com/?page=54';
const UPL_URL = 'https://league.ultimatepoolusa.com/docs/uplmanual.pdf';
const WPA_RULES_PAGE = 'https://wpapool.com/rules/';

const WPA_SRC = 'WPA Rules of Play, effective 2025-09-15 (file dated 2026.01.02). Short paraphrase, not the full rulebook.';
const APA_SRC = 'APA Game Rules Booklet (English), league years 2026/27, 2027/28 and 2028/29. Short paraphrase, not the full booklet.';
const CSI_SRC = 'Official Rules of CueSports International, file dated 08/12/2025, as used by the BCA Pool League and the USA Pool League. Short paraphrase, not the full book.';
const UPL_SRC = 'Ultimate Pool USA, UPL League Manual, version 5.0. Read from that file on 30 Sep 2026. Short paraphrase, not the whole manual.';

const BCA_NOTE = 'This how-to is from the CSI book, which is what a bar or league player usually means by “BCA rules.” The Billiard Congress of America rules page does not publish a separate book. It tells readers to use the WPA world-standardized rules.';

const BODIES = {
  wpa: 'WPA',
  apa: 'APA',
  bca: 'BCA',
  bar: 'Bar',
  upusa: 'Ultimate Pool USA'
};

const GAMES = [
  ['eight', '8-Ball', 'Solids or stripes, then the 8.'],
  ['nine', '9-Ball', 'Rotation. The 9 wins the rack.'],
  ['ten', '10-Ball', 'Call-shot rotation. The 10 wins.'],
  ['straight', '14.1 Continuous', 'Straight pool. Called balls to a point score.'],
  ['blackball', 'Blackball', 'Two groups, then the black ball. Shots are not called.'],
  ['heyball', 'Heyball', 'Named in the WPA book. The how-to is not printed in this file.'],
  ['pyramid', 'Pyramid', 'Named in the WPA book. The how-to is not printed in this file.'],
  ['artistic', 'Artistic Pool', 'Named in the WPA book. The how-to is not printed in this file.'],
  ['onepocket', 'One-Pocket', 'Eight balls in your foot pocket.'],
  ['bank', 'Bank Pool', 'Called banks to a score.'],
  ['iepf', 'IEPF International 8-Ball', 'Named in the WPA book. Those rules are not printed in this file.']
];

const BODY_GAMES = {
  wpa: ['eight', 'nine', 'ten', 'straight', 'blackball', 'heyball', 'pyramid', 'artistic', 'onepocket', 'bank', 'iepf'],
  apa: ['eight', 'nine'],
  bca: ['eight', 'nine', 'ten', 'straight', 'onepocket', 'bank'],
  bar: ['eight'],
  upusa: ['eight', 'ten']
};

const BODY_ORDER = ['wpa', 'apa', 'bca', 'bar', 'upusa'];

function game(id) { return GAMES.find((g) => g[0] === id); }
function gameName(id) { return game(id)?.[1] || 'That game'; }

const MISSING = {
  'wpa:heyball': 'The WPA Rules of Play say the Rules of Heyball are under review and Chapter 9 will be published later. This file does not contain the how-to. It points readers to the WPA rules page.',
  'wpa:pyramid': 'The WPA Rules of Play say the Rules of Pyramid are under review and Chapter 10 will be published later. This file does not contain the how-to. It points readers to the WPA rules page.',
  'wpa:artistic': 'The WPA Rules of Play say the Rules of Artistic Pool are under review and Chapter 11 will be published later. This file does not contain the how-to. It points readers to the WPA rules page.',
  'wpa:iepf': 'The WPA book says a version of 8-ball called International Rules was developed by the International Eightball Pool Federation. This file does not contain those rules. It points readers to the WPA rules page.'
};

const HOW = {
  'wpa:eight': [
    'Played with fifteen numbered object balls and the cue ball. Your group is the 1–7 or the 9–15. Clear that group, then pocket the 8 to win the rack. Shots are called.',
    'The table stays open after the break. Groups are set when a player legally pockets a called ball after the break. While the table is open, the cue ball may hit any object ball except the 8.',
    'Pocketing the 8 on the break is not a win and not a loss. On a legal break the breaker may spot the 8 and continue, or re-break. If the breaker also fouled, the opponent may spot the 8 and take ball in hand behind the head string, or re-break.',
    'A scratch on the break is a foul. The opponent may play the table as it lies, or take cue ball in hand behind the head string.',
    'After a standard foul, ball in hand is anywhere on the table. Pocketing the 8 before your group is cleared loses the rack, except on the break. Pocketing the 8 on a foul loses the rack.'
  ],
  'wpa:nine': [
    'Played with balls 1 through 9 and the cue ball, in ascending order. Legally pocketing the 9 wins the rack.',
    'The rack is a diamond. The 1 is at the apex toward the head of the table. The 9 is in the middle, on the foot spot.',
    'The cue ball starts above the head string. If the break pockets nothing, at least four object balls must be driven to a rail or it is a foul. If nothing is pocketed and three balls do not cross the head string, the book calls it an illegal break and points to Regulation 16. This page does not restate that regulation.',
    'After a legal break the shooter may call a push out. Wrong-ball-first and no-rail-after-contact are suspended for that shot. If the push out is not a foul, the other player chooses who shoots next.',
    'The cue ball must hit the lowest numbered ball first. A standard foul is ball in hand anywhere. Three fouls in one rack loses the rack. The 9 is spotted if it is pocketed on a foul or a push out, or driven off the table. No other object ball is spotted.'
  ],
  'wpa:ten': [
    'A call-shot game with balls 1 through 10, played in ascending order. The rack is won by legally pocketing the 10 on a called shot when it is the only object ball left.',
    'The rack is a triangle. The 1 is at the apex on the foot spot. The 10 is in the middle. The other balls have no set pattern.',
    'The cue ball starts above the head string. If the break pockets nothing, at least four object balls must be driven to a rail or it is a foul. After a legal break the shooter may push out, the same way as in 9-ball. There is no safety call in 10-ball.',
    'On every shot except the break, call the ball and the pocket (standard call shot). If a ball is pocketed but the called shot is missed, and there is no foul, the other player chooses who shoots next.',
    'The 10 is spotted if it leaves the table or is pocketed on anything other than the winning shot. Other object balls are not spotted. A standard foul is ball in hand anywhere. Three fouls in one rack loses the rack.'
  ],
  'wpa:straight': [
    'Also called straight pool. Fifteen numbered balls and the cue ball. Each ball pocketed on a legal called shot counts one point. The first player to the required score wins the match.',
    'It is continuous. After fourteen balls are pocketed they are re-racked and the shooter continues. On a re-rack the apex ball is left out if only fourteen balls are racked.',
    'The opening break starts with the cue ball above the head string. If no called ball is pocketed, the cue ball and two object balls must each be driven to a rail, or it is a breaking foul. That foul subtracts two points. The incoming player may accept the table or require another opening break.'
  ],
  'wpa:blackball': [
    'Played with fifteen colored object balls: two groups of seven, plus the black ball (or a black 8). Pocket your group and legally pocket the black ball. Shots are not called.',
    'The cue ball starts in baulk, the area inside the baulk line, one fifth of the table from the head cushion. Pocket at least one ball, or drive at least two object balls across the center string, or the break is a foul. If the black ball is pocketed on the break, the balls are re-racked and the same player breaks again.',
    'The table stays open until a player pockets balls from only one group on a legal shot that is not the break and not a free shot. That group becomes theirs.',
    'After a foul the incoming player gets a free shot. Wrong-ball-first is suspended, and the cue ball may be played where it lies or in hand in baulk. Causing the cue ball to jump over a ball is a foul.',
    'The rack is lost if the black ball is pocketed on an illegal shot, or on a shot that leaves any of your group on the table, or if wrong-ball-first is intentional, or if the shooter does not try to hit a ball that is on.'
  ],
  'wpa:onepocket': [
    'Played with fifteen object balls and the cue ball. Each player is assigned a foot pocket. The first to score eight object balls in their pocket wins the rack.',
    'The breaker chooses a pocket. If they do not say which one, they get the foot pocket opposite the side where the cue ball is placed. The cue ball starts above the head string. The book states no special break requirements.',
    'The turn continues until the shooter misses their pocket, fouls, or someone reaches eight. Balls pocketed in a side or head pocket, on a foul, or driven off the table are spotted.',
    'A standard foul costs one point. A scratch leaves the cue ball in hand above the head string. Three fouls in a row loses the rack.'
  ],
  'wpa:bank': [
    'Played with nine object balls (short rack, first to five) or fifteen (full rack, first to eight), plus the cue ball. Points come from called bank shots. A match is to a given number of racks.',
    'Call the object ball, the cushions in order, and the pocket. The cue ball must hit the called ball before any other ball or any rail. The called ball must not hit another object ball or the cue ball again, and it must not hit a rail that was not called. Incidental contact on the two rail sections next to the pocket does not count.',
    'The cue ball starts above the head string. If the break pockets nothing, at least four object balls must reach a rail or the break is illegal. The opponent may take the table or make the breaker break again. A ball pocketed on a legal break continues the turn.',
    'Only a valid bank scores. Any extra ball pocketed on that shot does not count and is spotted. A standard foul costs one point. A scratch leaves the cue ball in hand above the head string. Three fouls in a row loses the rack.'
  ],
  'apa:eight': [
    'Played with a cue ball and fifteen object balls. Pocket the solids (1–7) or the stripes (9–15), then legally pocket the 8. In league play the 8 pocket is marked. In Masters it may be called instead.',
    'If the breaker pockets balls from only one category on the break, that category is theirs. The table stays open only if both solids and stripes were made, or nothing was made.',
    'The 8 on the break wins the game, unless the breaker fouls the cue ball (for example a scratch), in which case they lose.',
    'In the 2026–29 booklet, any foul on a legal 8-ball break is ball in hand behind the head string, and the cue ball must contact an object ball outside the head string. If the break was also illegal, the balls are re-racked and the opponent breaks.',
    'After a foul that is not that break exception, the opponent may place the cue ball anywhere. Pocketing the 8 before your category is finished, or on the same shot as your last ball, loses. The 8 must be pocketed on its own shot. Scratching or knocking the cue ball off the table while playing the 8 loses even if the 8 does not go in. Ordinary shots are not called.'
  ],
  'apa:nine': [
    'Played with a cue ball and balls 1 through 9. It is rotation: the cue ball must hit the lowest numbered ball first. You keep the turn if you legally pocket any ball, not only the lowest. The game ends when the 9 is legally pocketed. Hitting the lowest ball into the 9, and pocketing the 9, wins.',
    'In league play, balls 1 through 8 are one point each and the 9 is two points. Masters does not use ball count. There, a game is won by legally pocketing the 9.',
    'A foul on a legal break is ball in hand anywhere. Pocketed balls stay down except the 9, which is spotted. The 9 on the break is a win unless the breaker scratches. Then the 9 is spotted and the turn passes.',
    'Push-outs are not allowed in APA handicapped play. Masters is not handicapped and follows U.S. Amateur Championship rules, so a push-out is allowed, and any ball pocketed on a push-out is spotted.',
    '10-ball is not in this booklet.'
  ],
  'bca:eight': [
    'Call-shot 8-ball, played by two players or two teams. Your group is solids 1–7 or stripes 9–15. Pocket your group, then legally pocket the 8.',
    'The table is open after the break even if balls were made. Groups are set by the first ball legally pocketed on a shot after the break, not on a safety.',
    'The 8 on the break is not a win or a loss. Without a foul, the breaker may spot the 8 and continue, or re-rack and break again. With a foul, the opponent may spot the 8 and take ball in hand anywhere, or re-rack and break.',
    'A foul, including a foul on a legal break, is ball in hand anywhere. Only the break itself starts from behind the head string. If the 8 goes in on a shot where you foul, you lose. If you foul while shooting the 8 and it stays up, it is only a foul.',
    'The rules notes did not find a separate CSI clause for an 8 that falls on an otherwise legal shot while your group is still on the table. That case is not stated here.'
  ],
  'bca:nine': [
    'Played with a cue ball and balls 1 through 9, by two players or two teams. Shoot in ascending order and continue as long as any ball is legally pocketed. The object is to pocket the 9 on any legal shot.',
    'The rack is a diamond. The 1 is the apex ball on the foot spot. The 9 is in the middle. The rest are random.',
    'The break starts with ball in hand behind the head string. The cue ball must hit the 1 before any other ball or cushion. Pocket a ball, or drive at least four object balls to a cushion, or it is a foul.',
    'Jumped object balls other than the 9 are not returned to the table. The 9 is returned.'
  ],
  'bca:ten': [
    'A call-shot game with a cue ball and balls 1 through 10, played by two players or two teams. Shoot in ascending numerical order. The object is to pocket the 10 on any legal shot after the break.',
    'The rack is a triangle. The 1 is the apex ball on the foot spot. The 10 is in the middle of the row of three. The 2 and the 3 are on the two ends of the last row. The rest are random.',
    'Fouls, the push-out, and the full break rules for this game are in the CSI book and are not copied on this short page.'
  ],
  'bca:straight': [
    'Also called straight pool. A call-shot game with fifteen object balls, played by two players or two teams. You may pocket the first fourteen balls. Before the fifteenth, those fourteen are re-racked with the apex space vacant, and you continue by pocketing the fifteenth and breaking balls out of the rack.',
    'The object is to reach a predetermined point total before your opponent.',
    'The opening break starts with the cue ball in hand behind the head string. Pocket a called ball in a called pocket, or contact an object ball and then drive the cue ball and at least two object balls to a cushion.',
    'On the opening rack the 1-ball is on the rear corner to the breaker’s right and the 5-ball is on the rear corner to the left. The other balls are random.'
  ],
  'bca:onepocket': [
    'Played with a cue ball and fifteen object balls, by two players or two teams. Only the two foot pockets score. Pocket object balls in your pocket. Eight balls before your opponent wins the game.',
    'Before each opening break, the breaker chooses one foot corner pocket. The opponent gets the other foot corner.',
    'The rest of the break requirements and foul penalties are in the CSI book and are not copied on this short page.'
  ],
  'bca:bank': [
    'Also called banks. A call-shot game. The long rack uses fifteen object balls. The short rack uses any nine. Two players may play either rack. For three, four, or five players the book suggests the long rack.',
    'Every score must be a bank. The object is to reach a predetermined number of balls before the opponent. The book does not print one fixed winning number on the page these notes used, so none is stated here.',
    'The break starts with the cue ball in hand behind the head string. No particular object ball has to be hit first. At least four object balls must reach a cushion or the break is illegal. The opponent may accept the table or re-rack and break. Balls pocketed on the break do not score and are spotted when the inning ends.',
    'A scored ball is pocketed as a bank, only the called number of cushions count, it is not the result of a kiss or carom, and the cue ball does not hit it more than once. An extra ball pocketed on the same shot does not count.'
  ],
  'bar:eight': [
    'Pool IQ Bar Rules is this app’s casual 8-ball preset. It is not an official rulebook, and it is not WPA, APA, BCA, or CSI.',
    'The group made on the break sets solids or stripes.',
    'After a foul or a scratch, the incoming player shoots from behind the head string, and the ball must pass it.',
    'Anything else people call bar rules is not confirmed here. Dr. Dave’s notes, saved with the rules research, say bar rules vary by room and are not one official set.'
  ],
  'upusa:eight': [
    'Team 8-ball on a six-pocket table: one cue ball, seven solids, seven stripes, and the 8. Jump shots are not allowed.',
    'Pocket every ball in your group, then pocket the 8 on its own shot. Pocketing the 8 early, or on the same shot as the last group ball, loses the rack.',
    'The 8 is racked on the foot spot. The other balls follow the manual’s solids-and-stripes pattern, by group, not by ball number. A rack cannot be won or lost on the break. An 8 pocketed on the break is re-spotted. The table stays open. Balls pocketed on the break do not set the groups. Groups are set when a player legally pockets a ball from the group the cue ball hit first.',
    'A legal break needs three points: one for each object ball pocketed, and one for each object ball that fully crosses the center line between the side pockets without being pocketed. If that total is not met, the balls are re-racked and the opponent chooses who breaks. A scratch on the break is cue ball in hand behind the head string, and the player may shoot any direction. The cue ball off the table, or another standard foul on the break, is cue ball in hand anywhere.',
    'A legal shot hits your own group first, then a ball is pocketed or the cue ball or an object ball hits a rail. Section 11: a standard foul is cue ball in hand anywhere, unless a rule says otherwise. Section 18: a 30-second shot clock, one 30-second extension per rack, requested before time runs out. Failing to play in time is a standard foul.',
    'Team nights use the shared match in manual section 5. See the Ultimate Pool USA rules page for the clocks and the handicap chart.'
  ],
  'upusa:ten': [
    'A call-pocket rotation game with balls 1 through 10 and a cue ball. Hit the lowest numbered ball first. Call the object ball and the pocket on every shot except the break. Only one ball may be called. Cushions, combinations, caroms, and other balls do not have to be called. Jump shots are not permitted.',
    'Win the rack by legally pocketing the 10 as the last object ball, in a called pocket. If the 10 is pocketed on a legal break, or before it is the last ball, it is re-spotted and play continues.',
    'The rack is a triangle. The 1 is at the apex. The 10 is in the center, on the foot spot. The other balls are random and must not be patterned on purpose.',
    'The break must hit the 1 first. Missing the 1 is a standard foul and ball in hand for the opponent. A legal break uses the same three-point test as UPL 8-ball: one point per object ball pocketed, and one point per object ball that fully crosses the center line between the side pockets. If that is not met, re-rack and the opponent chooses who breaks. A scratch, the cue ball off the table, or another break foul is cue ball in hand anywhere.',
    'After a legal break the player may declare a push out before shooting. Lowest-ball-first and the rail-after-contact requirement are suspended. If the push out is not a foul, the incoming player chooses who shoots next.',
    'Section 21: a 30-second shot clock, one 30-second extension per rack, requested before time expires. Failing to shoot in time is a standard foul. Team nights use the same match structure as 8-ball. See the Ultimate Pool USA rules page for the clocks and the handicap chart.'
  ]
};

const ICO_CUE = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="15" cy="30" r="8" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12.4" cy="27.2" r="1.5" fill="#fff"/><path d="M22 24.5 42 8" stroke="#e7c27a" stroke-width="3.2" stroke-linecap="round"/><path d="M20 27.2 25.2 22.6" stroke="#e8eef6" stroke-width="3" stroke-linecap="round"/></svg>`;
const ICO_BOTH = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 13.5h14.5a2 2 0 0 1 2 2V34a2.2 2.2 0 0 0-2-1.2H8V13.5Zm22.5 0H45v19.3h-12.5a2.2 2.2 0 0 0-2 1.2V15.5a2 2 0 0 1 2-2Z" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="34" cy="30" r="5.2" fill="none" stroke="#f6c453" stroke-width="1.7"/><circle cx="39.5" cy="22" r="3.4" fill="none" stroke="#4cc9ff" stroke-width="1.6"/></svg>`;

function card(href, tone, ico, title, text, photo) {
  return `<button type="button" class="learnCard ${tone}" data-action="go" data-href="${href}">
    <span class="lcBg" style="background-image:url('${photo}')"></span>
    <span class="lcShade"></span>
    <span class="lcIn">
      <span class="lcMain"><span class="lcIco">${ico}</span><b>${esc(title)}</b><small>${esc(text)}</small></span>
      <span class="lcChev" aria-hidden="true">›</span>
    </span>
  </button>`;
}

function landing() {
  return `<div class="title learnPage" data-page-learn>
    <h1>Learn</h1>
    <p>Build your knowledge and improve your game.</p>
    <div class="learnCards">
      ${card('#learn/fundamentals', 'gold', ICO_CUE, 'Fundamentals', 'Stance, grip, bridge, aiming, stroke, cue ball control and core concepts.', './icons/learn-fundamentals.jpg')}
      ${card('#learn/play', 'blue', ICO_BOTH, 'How to Play & Rules', 'Game formats, scoring and rules for 8-ball, 9-ball, 10-ball and more. WPA, APA, BCA, Bar Rules and Ultimate Pool USA with explanations.', './icons/learn-play.jpg')}
    </div>
  </div>`;
}

function combined() {
  const games = GAMES.map(([id, name]) => [`#learn/play/game/${id}`, name, BODY_ORDER.filter((b) => BODY_GAMES[b].includes(id)).map((b) => BODIES[b]).join(', ')]);
  const bodies = [
    ['#learn/rules/wpa', 'WPA', 'World Pool-Billiards Association rules of play. Every game in that book.'],
    ['#learn/rules/apa', 'APA', 'APA game rules booklet, league years 2026/27–2028/29.'],
    ['#learn/rules/bca', 'BCA', 'What “BCA rules” points at today. Two different things.'],
    ['#learn/rules/bar', 'Bar', 'Pool IQ’s bar preset. Not an official rulebook.'],
    ['#learn/rules/upusa', 'Ultimate Pool USA', 'League manual v5.0. 8-ball and 10-ball team play.']
  ];
  return `<div class="title learnPage" data-page-learn><div>${back('#learn', 'Learn')}</div>
    <h1>How to Play & Rules</h1>
    <h2>How to Play</h2>
    <p class="muted">Pick a game. Then pick a rule set that actually plays it.</p>
    ${list(games)}
    <h2>Rules</h2>
    <p class="muted">Pick a rule set. Then see every game that set publishes.</p>
    ${list(bodies)}
  </div>`;
}

function sourceFor(body) {
  if (body === 'wpa') return src(WPA_SRC, WPA_URL);
  if (body === 'apa') return src(APA_SRC, APA_URL);
  if (body === 'bca') return src(CSI_SRC, CSI_URL) + src('BCA Rules and Specifications page. It does not host a separate rulebook.', BCA_URL);
  if (body === 'upusa') return src(UPL_SRC, UPL_URL);
  return `<p class="learnSrc"><b>Source:</b> Pool IQ bar preset. Not an official book. Dr. Dave on why bar rules vary: <a href="https://drdavepoolinfo.com/normal-video/nv-l-46/" target="_blank" rel="noopener noreferrer">https://drdavepoolinfo.com/normal-video/nv-l-46/</a></p>`;
}

function howPage(body, gameId, href, label) {
  if (!BODIES[body] || !game(gameId) || !BODY_GAMES[body].includes(gameId)) {
    return page('How to Play', '<p class="muted">That game is not in this rule set.</p>', href, label);
  }
  const key = `${body}:${gameId}`;
  const lines = HOW[key];
  const missing = MISSING[key];
  let html = sourceFor(body);
  if (body === 'bca') html += `<p>${esc(BCA_NOTE)}</p>`;
  if (missing) {
    html += `<p>${esc(missing)}</p><p class="learnSrc"><a href="${esc(WPA_RULES_PAGE)}" target="_blank" rel="noopener noreferrer">${esc(WPA_RULES_PAGE)}</a></p>`;
  } else if (lines) html += bullets(lines);
  else html += '<p class="muted">Those rules were not in the source used for this page, so they are not written here.</p>';
  return page(`${gameName(gameId)} · ${BODIES[body]}`, html, href, label);
}

function gameSets(gameId) {
  const g = game(gameId);
  if (!g) return page('How to Play', '<p class="muted">That game is not on these rule lists.</p>', '#learn/play', 'How to Play & Rules');
  const rows = BODY_ORDER.filter((b) => BODY_GAMES[b].includes(gameId)).map((b) => [`#learn/play/game/${gameId}/${b}`, BODIES[b], b === 'bca' ? 'CSI book, the usual meaning of “BCA rules.”' : 'Short how-to from that source.']);
  return page(g[1], `<p class="muted">Rule sets that play ${esc(g[1])}.</p>${list(rows)}`, '#learn/play', 'How to Play & Rules');
}

function bodyPage(body) {
  if (body === 'wpa') {
    const rows = BODY_GAMES.wpa.map((id) => [`#learn/rules/wpa/${id}`, gameName(id), MISSING[`wpa:${id}`] ? 'Named in the book. The how-to is not in this file.' : game(id)[2]]);
    return page('WPA', `${src(WPA_SRC, WPA_URL)}
      <p>Games in the WPA Rules of Play. General rules in sections 1–3 apply across these games and are not copied here.</p>
      ${list(rows)}
      <p class="muted small">Heyball, Pyramid, and Artistic Pool are chapter titles in this book. Each chapter says those rules are under review and are not printed. International Rules 8-ball is only a pointer to the IEPF file on the WPA rules page.</p>`, '#learn/play', 'How to Play & Rules');
  }
  if (body === 'apa') {
    const rows = BODY_GAMES.apa.map((id) => [`#learn/rules/apa/${id}`, gameName(id), game(id)[2]]);
    return page('APA', `${src(APA_SRC, APA_URL)}
      <p>This booklet’s game rules are 8-ball and 9-ball.</p>
      ${list(rows)}
      <p class="muted small">The rules notes checked this booklet and the team manual for these league years. They did not find 10-ball, 14.1 continuous, one-pocket, or bank pool, so those are not listed.</p>`, '#learn/play', 'How to Play & Rules');
  }
  if (body === 'bca') {
    const rows = BODY_GAMES.bca.map((id) => [`#learn/rules/bca/${id}`, gameName(id), game(id)[2]]);
    return page('BCA', `${src('BCA Rules and Specifications page, plus the BCA Pool League page on playcsipool.com.', BCA_URL)}
      ${src(CSI_SRC, CSI_URL)}
      <ul class="learnRules">
        <li>The Billiard Congress of America is the North American member of the WPA. Its rules page does not host a separate rulebook. It says to use the world-standardized rules from the World Pool Association.</li>
        <li>The BCA Pool League was created by the BCA in 1976 and sold to CueSports International in 2004. BCAPL and the USA Pool League use the Official Rules of CueSports International, a different book from the WPA rules.</li>
        <li>One difference the notes checked: after a foul on a legal break, CSI gives ball in hand anywhere. WPA gives ball in hand behind the head string.</li>
        <li>A bar or league player who says “BCA rules” usually means the BCAPL / CSI book, not the BCA federation page. The games below are the ones in that CSI book.</li>
      </ul>
      ${list(rows)}
      <p class="muted small">The full CSI book is not copied here. The BCA federation page does not add games of its own.</p>`, '#learn/play', 'How to Play & Rules');
  }
  if (body === 'bar') {
    return page('Bar', `${sourceFor('bar')}
      <p>This preset is only written for 8-ball. It does not add 9-ball, 10-ball, or any other game.</p>
      ${list([['#learn/rules/bar/eight', '8-Ball', 'The two bar-preset rules. Not an official book.']])}`, '#learn/play', 'How to Play & Rules');
  }
  if (body === 'upusa') {
    const rows = BODY_GAMES.upusa.map((id) => [`#learn/rules/upusa/${id}`, gameName(id), game(id)[2]]);
    return page('Ultimate Pool USA', `${src(UPL_SRC, UPL_URL)}
      <ul class="learnRules">
        <li>The manual says the league currently offers 8-ball and 10-ball team play. Both use the same match structure in section 5. No other game is in that manual.</li>
        <li>A team night is five individual matches. Each one is 30 minutes. There is no match race. UPScore sets a starting score. Points from the five matches are added for the team result.</li>
        <li>Players lag for the first break. Breaks then alternate. Players rack their own balls.</li>
        <li>Clocks, section 6: a 30-minute match clock and a 30-second shot clock. One 30-second extension per rack. The extension must be indicated before it is used. The match clock starts when the cue ball is struck on the first break. The shot clock starts when all balls have stopped and the table is free.</li>
        <li>Handicap chart, section 5.4: the higher-rated player starts negative. Rows are a rating difference of 40, 80, 120, and 180. The column is the lower player’s UPScore: 400 and below, 401–520, or 521 and above. A difference over 180 still uses the 180 row. A difference under 40 is not on the chart.</li>
      </ul>
      ${list(rows)}
      <p class="muted small">Coaching, roster limits, and the full object-ball rules are in the manual and are not copied here.</p>
      <button type="button" class="bigBtn" data-action="go" data-href="#tgame/upusa">OPEN THE TABLE GAME</button>`, '#learn/play', 'How to Play & Rules');
  }
  return page('Rules', '<p class="muted">That rules page is not in this list.</p>', '#learn/play', 'How to Play & Rules');
}

export function learnHTML(args = []) {
  const a = args[0] || '';
  const b = args[1] || '';
  const c = args[2] || '';
  const d = args[3] || '';
  if (!a) return landing();
  if (a === 'fundamentals') return page('Fundamentals', '<p class="muted">Lessons will show here.</p>');
  if (a === 'play' && b === 'game' && c && d) return howPage(d, c, `#learn/play/game/${c}`, gameName(c));
  if (a === 'play' && b === 'game' && c) return gameSets(c);
  if (a === 'rules' && b && c) return howPage(b, c, `#learn/rules/${b}`, BODIES[b] || 'Rules');
  if (a === 'rules' && b) return bodyPage(b);
  if (a === 'play' || a === 'howto' || a === 'rules') return combined();
  return landing();
}

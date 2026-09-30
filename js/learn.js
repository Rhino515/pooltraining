/**
 * Learn pages. No invented lessons.
 * Rules text is paraphrased from /workspace/research/RULES_SOURCES.md and rules-sources.json
 * (checked there against the official files) plus the Ultimate Pool USA league manual fetched
 * 2026-09-30 from https://league.ultimatepoolusa.com/docs/uplmanual.pdf (UPL League Manual v5.0).
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

const ENTRIES = [
  ['#learn/fundamentals', 'Fundamentals', 'Lessons will show here.'],
  ['#learn/howto', 'How to Play', 'Points at the rules. Not a lesson.'],
  ['#learn/rules', 'Rules', 'WPA, APA, BCA, Bar, and Ultimate Pool USA.']
];

export function learnHTML(args = []) {
  const a = args[0] || '';
  const b = args[1] || '';
  if (a === 'fundamentals') {
    return page('Fundamentals', '<p class="muted">Lessons will show here.</p>');
  }
  if (a === 'howto') {
    return page('How to Play', `<p>This is not a lesson. The rules are listed under Rules.</p>
      <button type="button" class="bigBtn" data-action="go" data-href="#learn/rules">OPEN RULES</button>`);
  }
  if (a === 'rules' && b) return rulePage(b);
  if (a === 'rules') {
    const items = [
      ['wpa', 'WPA', 'World Pool-Billiards Association rules of play.'],
      ['apa', 'APA', 'APA game rules booklet, league years 2026/27–2028/29.'],
      ['bca', 'BCA', 'What “BCA rules” points at today. Two different things.'],
      ['bar', 'Bar', 'Pool IQ’s bar preset. Not an official rulebook.'],
      ['upusa', 'Ultimate Pool USA', 'League manual v5.0. Match clock and shot clock.']
    ];
    return page('Rules', `<div class="learnList">${items.map(([id, name, sub]) => `<button type="button" class="card learnRow" data-action="go" data-href="#learn/rules/${id}"><b>${esc(name)}</b><small>${esc(sub)}</small></button>`).join('')}</div>`, '#learn', 'Learn');
  }
  return `<div class="title learnPage" data-page-learn><h1>Learn</h1><p class="muted">Lessons will show here.</p>
    <div class="learnList">${ENTRIES.map(([href, name, sub]) => `<button type="button" class="card learnRow" data-action="go" data-href="${href}"><b>${esc(name)}</b><small>${esc(sub)}</small></button>`).join('')}</div></div>`;
}

function li(title, text) {
  return `<li><b>${esc(title)}</b> ${esc(text)}</li>`;
}

function rulePage(id) {
  if (id === 'wpa') {
    return page('WPA', `
      ${src('WPA Rules of Play, effective 2025-09-15 (file dated 2026.01.02). Paraphrase from the Pool IQ rules notes, which checked these lines against that PDF. Not the full rulebook.', 'https://wpapool.com/wp-content/uploads/2026/01/2026.01.02-WPA-Rules.pdf')}
      <p class="muted small">8-ball, unless a line says otherwise. The BCA rules page tells readers to use these world-standardized rules.</p>
      <ul class="learnRules">
        ${li('Scratch on the break.', 'It is a foul. The opponent may play the table as it lies, or take cue ball in hand behind the head string.')}
        ${li('8-ball on the break.', 'Not a win and not a loss. On a legal break the breaker may spot the 8 and keep shooting, or re-break. If the breaker also fouled, the opponent may spot the 8 and take ball in hand behind the head string, or re-break.')}
        ${li('Groups.', 'The table stays open after the break. Groups are set when a player legally pockets a called ball after the break.')}
        ${li('Called shots.', 'Except on the break, call the ball and pocket unless they are obvious. Banks, kisses, and cushions do not have to be called.')}
        ${li('Ball in hand.', 'After a standard foul, the incoming player may place the cue ball anywhere. After a foul on the break, ball in hand is behind the head string.')}
        ${li('8-ball early, or on a foul.', 'Pocketing the 8 before your group is cleared loses the rack, except on the break. Pocketing the 8 and fouling loses the rack. A scratch that does not pocket the 8 is an ordinary foul.')}
      </ul>`, '#learn/rules', 'Rules');
  }
  if (id === 'apa') {
    return page('APA', `
      ${src('APA Game Rules Booklet (English), league years 2026/27, 2027/28 and 2028/29. Paraphrase from the Pool IQ rules notes checked against that booklet. Not the full booklet.', 'http://media.poolplayers.com/TMRB/Rules-Booklet-English.pdf')}
      <ul class="learnRules">
        ${li('8-ball on the break.', 'The breaker wins, unless they foul the cue ball on the break (for example a scratch), in which case they lose.')}
        ${li('Groups.', 'If the breaker pockets balls from only one category on the break, that category is theirs. The table stays open only if both solids and stripes were made, or nothing was made.')}
        ${li('Foul on a legal 8-ball break.', 'In the 2026–29 booklet, any foul on a legal break gives ball in hand behind the head string, and the cue ball must contact an object ball outside the head string. The older 2023–26 text said “scratch.” If the break was also illegal, the balls are re-racked and the opponent breaks.')}
        ${li('Other fouls.', 'After a foul that is not the 8-ball break exception, the opponent may place the cue ball anywhere on the table.')}
        ${li('8-ball.', 'Pocketing the 8 out of turn, or on the same shot as the last ball of your category, loses. The 8 must be pocketed on its own shot. Scratching or knocking the cue ball off the table while playing the 8 loses even if the 8 does not go in.')}
        ${li('Called shots.', 'Ordinary shots are not called. The 8-ball pocket is marked. In Masters it may be called instead.')}
        ${li('9-ball.', 'The booklet covers handicapped 9-ball scored by ball count. It says there is no push-out except Masters. 10-ball is not in the APA game rules covered by these notes.')}
      </ul>`, '#learn/rules', 'Rules');
  }
  if (id === 'bca') {
    return page('BCA', `
      ${src('BCA Rules and Specifications page, plus the BCA Pool League page on playcsipool.com. Summary from the Pool IQ rules notes. Not a rulebook.', 'https://bca-pool.com/?page=54')}
      <ul class="learnRules">
        ${li('BCA the federation.', 'The Billiard Congress of America is the North American member of the WPA. Its rules page does not host a separate rulebook. It says to use the world-standardized rules from the World Pool Association.')}
        ${li('BCA Pool League.', 'That league was created by the BCA in 1976 and sold to CueSports International in 2004. BCAPL and the USA Pool League use the Official Rules of CueSports International, a different book from the WPA rules.')}
        ${li('One difference the notes checked.', 'After a foul on a legal break, CSI gives ball in hand anywhere. WPA gives ball in hand behind the head string.')}
        ${li('Which one people mean.', 'The notes say a bar or league player who says “BCA rules” usually means the BCAPL / CSI book, not the BCA federation page.')}
      </ul>
      <p class="learnSrc">CSI book listed in the notes: Official Rules of CueSports International, file dated 08/12/2025. <a href="https://www.playcsipool.com/bcapl-rules.html" target="_blank" rel="noopener noreferrer">https://www.playcsipool.com/bcapl-rules.html</a></p>
      <p class="muted small">The full CSI book is not copied here.</p>`, '#learn/rules', 'Rules');
  }
  if (id === 'bar') {
    return page('Bar', `
      <p><b>Pool IQ Bar Rules</b> is Pool IQ’s casual bar preset. It is not an official rulebook, and it is not WPA, APA, BCA, or CSI.</p>
      <ul class="learnRules">
        ${li('Groups.', 'The group made on the break sets solids or stripes.')}
        ${li('Foul or scratch.', 'The incoming player shoots from behind the head string, and the ball must pass it.')}
      </ul>
      <p class="muted small">Anything else people call bar rules is unconfirmed here. Dr. Dave’s notes, saved with the rules research, say bar rules vary by room and are not one official set.</p>`, '#learn/rules', 'Rules');
  }
  if (id === 'upusa') {
    return page('Ultimate Pool USA', `
      ${src('Ultimate Pool USA, UPL League Manual, version 5.0 (PDF created 17 Apr 2026). Read from that file on 30 Sep 2026. Not the whole manual.', 'https://league.ultimatepoolusa.com/docs/uplmanual.pdf')}
      <ul class="learnRules">
        ${li('Formats.', 'The manual says the league currently offers 8-ball and 10-ball team play. Both use the same match structure in section 5.')}
        ${li('A team night.', 'Five individual matches. Each one is 30 minutes. There is no match race. UPScore sets a starting score. Points from the five matches are added for the team result.')}
        ${li('Who breaks.', 'Players lag for the first break. Breaks then alternate. Players rack their own balls.')}
        ${li('Clocks.', '30-minute match clock. 30-second shot clock. One 30-second extension per rack. The extension must be indicated before it is used. The match clock starts when the cue ball is struck on the first break. The shot clock starts when all balls have stopped and the table is free.')}
        ${li('Shot clock foul (8-ball section).', 'Section 18 says failing to play in time is a standard foul. Section 11 says a standard foul gives the incoming player cue ball in hand anywhere, unless a rule says otherwise.')}
        ${li('Handicap chart.', 'The higher-rated player starts negative. Rows are a rating difference of 40, 80, 120, and 180. The column is the lower player’s UPScore: 400 and below, 401–520, or 521 and above. A difference over 180 still uses the 180 row. A difference under 40 is not on the chart.')}
      </ul>
      <p class="muted small">Coaching, roster limits, the five-match lineup, and the full 8-ball and 10-ball object-ball rules are in the manual and are not copied here. The table game uses the clocks, the break order, the rack score, and the handicap chart.</p>
      <button type="button" class="bigBtn" data-action="go" data-href="#tgame/upusa">OPEN THE TABLE GAME</button>`, '#learn/rules', 'Rules');
  }
  return page('Rules', '<p class="muted">That rules page is not in this list.</p>', '#learn/rules', 'Rules');
}

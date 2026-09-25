/**
 * Analyze / Camera — Beta stub with structure hooks for future detection.
 * No fake ball detection.
 */
import { renderTableDiagram } from './tableDiagram.js';

const demoSpec = {
  balls: [
    { id: 'cue', x: 18, y: 38 },
    { id: 1, x: 42, y: 28 },
    { id: 2, x: 58, y: 18 },
    { id: 8, x: 78, y: 12 }
  ],
  targetPocket: 'TR',
  zone: { x: 55, y: 30, r: 7 },
  paths: [
    {
      points: [
        { x: 18, y: 38 },
        { x: 42, y: 28 },
        { x: 97, y: 3 }
      ]
    }
  ],
  headString: true
};

export function renderAnalyzePage() {
  const svg = renderTableDiagram(demoSpec, { compact: false, className: 'table-diagram large' });
  return `
    <div class="title">
      <span class="eyebrow">TABLE VISION</span>
      <h1>Analyze Table</h1>
      <p>Camera-assisted layout coaching is next. This screen is a structured beta — no simulated detection.</p>
    </div>
    <div class="table card analyzeCard">
      <div class="diagramWrap">${svg}</div>
      <div class="coach">
        <div class="betaBadge">CAMERA · BETA / COMING NEXT</div>
        <b>Recommended route</b>
        <span>1 → 2 → 8</span>
        <p>Demo overlay only. Live iPhone camera detection, ball ID, and shot suggestions will plug into the hooks below.</p>
        <div class="toggles">
          <label><input type="checkbox" id="togShot" checked> Shot line</label>
          <label><input type="checkbox" id="togZone" checked> Position zone</label>
          <label><input type="checkbox" id="togSpeed" checked> Speed cue</label>
        </div>
        <button type="button" id="cameraBtn" class="cameraBtn">Open Camera (Beta)</button>
        <div id="cameraPanel" class="cameraPanel hidden">
          <p class="muted">Camera access will appear here in a future build. Hooks ready:</p>
          <ul class="hookList">
            <li><code>AnalyzeSession.captureFrame()</code></li>
            <li><code>AnalyzeSession.detectBalls(frame)</code> → Ball[]</li>
            <li><code>AnalyzeSession.suggestRoute(balls)</code></li>
            <li><code>AnalyzeSession.overlayDiagram(spec)</code></li>
          </ul>
          <video id="analyzeVideo" playsinline muted class="hidden"></video>
          <canvas id="analyzeCanvas" class="hidden"></canvas>
          <button type="button" id="closeCameraBtn" class="ghost">Close Beta Panel</button>
        </div>
      </div>
    </div>
  `;
}

/** Future API surface — stub implementations */
export const AnalyzeSession = {
  async captureFrame() {
    return null;
  },
  async detectBalls(_frame) {
    return { status: 'not_implemented', balls: [] };
  },
  suggestRoute(_balls) {
    return { status: 'not_implemented', route: [] };
  },
  overlayDiagram(spec) {
    return renderTableDiagram(spec || demoSpec);
  }
};

export function bindAnalyzeHandlers(root) {
  const camBtn = root.querySelector('#cameraBtn');
  const panel = root.querySelector('#cameraPanel');
  const closeBtn = root.querySelector('#closeCameraBtn');
  if (camBtn && panel) {
    camBtn.addEventListener('click', () => {
      panel.classList.remove('hidden');
      camBtn.textContent = 'Camera Beta — Coming Next';
    });
  }
  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
  }
}

/**
 * Result-source adapter — the hook camera verification will plug into later.
 * Today every attempt is scored manually and stored with resultSource: 'manual'.
 * A future camera adapter implements the same interface and is registered with registerResultAdapter().
 */
const manualAdapter = {
  id: 'manual',
  available: () => true,
  /** @returns {Promise<{outcome:object, resultSource:string, confidence:number|null}>} */
  async verifyAttempt(_challenge, outcome) {
    return { outcome, resultSource: 'manual', confidence: null };
  }
};
let activeAdapter = manualAdapter;
export function registerResultAdapter(adapter) {
  if (adapter && typeof adapter.verifyAttempt === 'function') activeAdapter = adapter;
  return activeAdapter;
}
export function getResultAdapter() {
  return activeAdapter;
}

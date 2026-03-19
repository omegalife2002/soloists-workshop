import { useState, useCallback, useRef, useEffect } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Share+Tech+Mono&display=swap";
document.head.appendChild(FONT_LINK);

// ── Oracle Data ────────────────────────────────────────────────────────────
const LIKELIHOODS = [
  { label: "Certain",      mod: +4 },
  { label: "Very Likely",  mod: +2 },
  { label: "Likely",       mod: +1 },
  { label: "50 / 50",      mod:  0 },
  { label: "Unlikely",     mod: -1 },
  { label: "Very Unlikely",mod: -2 },
  { label: "Impossible",   mod: -4 },
];

function rollOracle(likelihoodMod, chaos) {
  const r1 = Math.ceil(Math.random() * 6);
  const r2 = Math.ceil(Math.random() * 6);
  const raw = r1 + r2;
  const total = raw + likelihoodMod + (chaos - 5); // chaos 1-10, 5 is neutral
  if (total <= 2)  return { result: "No, and…",  tone: "bad",     dice: [r1, r2] };
  if (total <= 5)  return { result: "No",         tone: "no",      dice: [r1, r2] };
  if (total <= 7)  return { result: "No, but…",  tone: "no-but",  dice: [r1, r2] };
  if (total <= 9)  return { result: "Yes, but…", tone: "yes-but", dice: [r1, r2] };
  if (total <= 11) return { result: "Yes",        tone: "yes",     dice: [r1, r2] };
  return               { result: "Yes, and…",  tone: "good",    dice: [r1, r2] };
}

// ── Spark Table ────────────────────────────────────────────────────────────
const SPARK_WORDS = [
  "Abandoned","Ancient","Betrayal","Blood","Broken","Chaos","Cold","Cunning",
  "Dark","Debt","Decay","Dread","Duty","Echo","Edge","Ember","Empire","Exile",
  "Fading","Fallen","Fate","Fear","Flame","Fleeting","Fog","Forgotten","Fortune",
  "Frenzy","Ghost","Gold","Grief","Guard","Guilt","Haunted","Hidden","Hollow",
  "Honor","Hope","Hunger","Iron","Jade","Labyrinth","Legacy","Lost","Loyal",
  "Madness","Mirror","Moonless","Myth","Night","Oath","Omen","Pale","Plague",
  "Price","Promise","Relic","Remnant","Ruin","Sacred","Scar","Shadow","Silence",
  "Silver","Sin","Smoke","Sorrow","Stolen","Storm","Strange","Threshold","Throne",
  "Tide","Tomb","Trance","Twisted","Veil","Vengeance","Vigil","Void","Wandering",
  "War","Wasteland","Whisper","Wild","Winter","Wrath","Warden","Wound","Zealot",
  "Threshold","Labyrinth","Hollow","Ember","Dusk","Oracle","Stranger","Rift",
];

function drawSpark() {
  const a = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
  let b = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
  while (b === a) b = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
  return [a, b];
}

// ── Dice ───────────────────────────────────────────────────────────────────
const DICE = [4, 6, 8, 10, 12, 20, 100];

function rollDie(sides) {
  return Math.ceil(Math.random() * sides);
}

// ── START Loop Steps ───────────────────────────────────────────────────────
const START_STEPS = [
  { letter: "S", word: "Set the Scene", desc: "Where are you? Who is present? What is the immediate situation or goal?" },
  { letter: "T", word: "Think Ahead",   desc: "Consider what could logically happen next. What's the most interesting complication or opportunity?" },
  { letter: "A", word: "Ask the Oracle",desc: "Use the Yes/No Oracle for uncertain outcomes. Only ask when the answer is genuinely in doubt and matters to the story." },
  { letter: "R", word: "Roll & Resolve",desc: "Use your game's mechanics — skill checks, combat, saves — to determine what actually happens." },
  { letter: "T", word: "Tell the Story",desc: "Narrate the outcome. Interpret the dice through the fiction. Then set up the next scene." },
];

// ── Styles ─────────────────────────────────────────────────────────────────
const css = `
  :root {
    --bg:       #0d0c0a;
    --surface:  #16140f;
    --border:   #2e2a1e;
    --gold:     #c9973f;
    --gold-dim: #7a5c24;
    --amber:    #e8b45a;
    --text:     #d4c9a8;
    --muted:    #7a6e55;
    --yes:      #5f9e6e;
    --yes-and:  #3dbb5e;
    --no:       #9e5f5f;
    --no-and:   #cc3c3c;
    --yes-but:  #8fb87a;
    --no-but:   #b87a7a;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
	body { background: var(--bg); color: var(--text); font-family: 'IM Fell English', Georgia, serif; font-size: 18px; }

  .app {
    min-height: 100vh;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1rem 4rem;
  }

  /* Header */
  .header {
    text-align: center;
    padding: 2.5rem 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2rem;
    position: relative;
  }
  .header::before, .header::after {
    content: '✦';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gold-dim);
    font-size: 1.2rem;
  }
  .header::before { left: 1rem; }
  .header::after  { right: 1rem; }
  .header h1 {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.4rem, 4vw, 2.2rem);
    color: var(--amber);
    letter-spacing: 0.15em;
    font-weight: 700;
    text-shadow: 0 0 30px rgba(201,151,63,0.3);
  }
  .header p {
    color: var(--muted);
    font-style: italic;
    font-size: 0.9rem;
    margin-top: 0.3rem;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2rem;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tab {
    font-family: 'Cinzel', serif;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    padding: 0.7rem 1.2rem;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: color 0.2s, border-color 0.2s;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--amber); border-bottom-color: var(--gold); }

  /* Panel */
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 2px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .panel-title {
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    color: var(--gold-dim);
    text-transform: uppercase;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .panel-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* Oracle */
  .likelihood-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }
  .lh-btn {
    font-family: 'Cinzel', serif;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    padding: 0.4rem 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--muted);
    cursor: pointer;
    border-radius: 1px;
    transition: all 0.15s;
  }
  .lh-btn:hover { color: var(--text); border-color: var(--gold-dim); }
  .lh-btn.selected {
    background: var(--gold-dim);
    border-color: var(--gold);
    color: var(--amber);
  }

  .oracle-result {
    text-align: center;
    padding: 1.5rem;
    margin: 1rem 0;
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: 2px;
    min-height: 7rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: border-color 0.3s;
  }
  .oracle-result.tone-good    { border-color: var(--yes-and); }
  .oracle-result.tone-yes     { border-color: var(--yes); }
  .oracle-result.tone-yes-but { border-color: var(--yes-but); }
  .oracle-result.tone-no-but  { border-color: var(--no-but); }
  .oracle-result.tone-no      { border-color: var(--no); }
  .oracle-result.tone-bad     { border-color: var(--no-and); }

  .oracle-answer {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.3rem, 4vw, 2rem);
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .tone-good    .oracle-answer { color: var(--yes-and); }
  .tone-yes     .oracle-answer { color: var(--yes); }
  .tone-yes-but .oracle-answer { color: var(--yes-but); }
  .tone-no-but  .oracle-answer { color: var(--no-but); }
  .tone-no      .oracle-answer { color: var(--no); }
  .tone-bad     .oracle-answer { color: var(--no-and); }

  .oracle-dice {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .oracle-log {
    max-height: 8rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .oracle-log-entry {
    font-size: 0.82rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    color: var(--muted);
    font-style: italic;
  }
  .oracle-log-entry span:first-child { color: var(--text); }

  /* Chaos */
  .chaos-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .chaos-label {
    font-family: 'Cinzel', serif;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .chaos-btns { display: flex; gap: 0.25rem; }
  .chaos-btn {
    width: 2rem; height: 2rem;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--muted);
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.8rem;
    cursor: pointer;
    border-radius: 1px;
    transition: all 0.15s;
  }
  .chaos-btn.active {
    background: var(--gold-dim);
    border-color: var(--gold);
    color: var(--amber);
  }

  /* Dice Roller */
  .dice-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .die-btn {
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    width: 3.5rem; height: 3.5rem;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--muted);
    cursor: pointer;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .die-btn:hover {
    border-color: var(--gold-dim);
    color: var(--text);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(201,151,63,0.15);
  }
  .die-btn.rolling {
    animation: shake 0.3s ease-in-out;
    border-color: var(--gold);
  }
  @keyframes shake {
    0%,100% { transform: translate(0,0) rotate(0); }
    25% { transform: translate(-3px,1px) rotate(-5deg); }
    75% { transform: translate(3px,-1px) rotate(5deg); }
  }
  .die-label {
    font-size: 0.65rem;
    color: var(--gold-dim);
    text-transform: uppercase;
  }
  .die-value {
    font-size: 1.3rem;
    color: var(--amber);
    font-weight: 700;
    min-height: 1.5rem;
  }

  .dice-history {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: 6rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .dice-history-chip {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 1px;
  }

  /* Spark Table */
  .spark-result {
    text-align: center;
    padding: 2rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    margin: 1rem 0;
    border-radius: 2px;
    min-height: 8rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  .spark-words {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }
  .spark-word {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.2rem, 3.5vw, 1.8rem);
    font-weight: 600;
    color: var(--amber);
    letter-spacing: 0.08em;
    transition: opacity 0.3s;
  }
  .spark-sep {
    color: var(--gold-dim);
    font-size: 1.5rem;
  }
  .spark-hint { font-style: italic; color: var(--muted); font-size: 1rem; }

  .spark-history {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 7rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .spark-history-entry {
    font-size: 0.8rem;
    font-family: 'Share Tech Mono', monospace;
    color: var(--muted);
    padding: 0.2rem 0;
    border-bottom: 1px solid var(--border);
  }

  /* START Loop */
  .start-steps {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .start-step {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-left: 3px solid var(--gold-dim);
    border-radius: 1px;
    cursor: pointer;
    transition: border-left-color 0.2s;
  }
  .start-step:hover { border-left-color: var(--gold); }
  .start-step.done { border-left-color: var(--yes); opacity: 0.6; }
  .start-step.active { border-left-color: var(--amber); }
  .start-letter {
    font-family: 'Cinzel', serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--gold-dim);
    line-height: 1;
    min-width: 1.5rem;
    text-align: center;
  }
  .start-step.active .start-letter { color: var(--amber); }
  .start-step.done   .start-letter { color: var(--yes); }
  .start-step-text h3 {
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    color: var(--text);
    margin-bottom: 0.25rem;
  }
  .start-step-text p { font-size: 1rem; color: var(--text); font-style: normal; }

  .start-controls {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  /* Journal */
  .journal-textarea {
    width: 100%;
    min-height: 16rem;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: 'IM Fell English', Georgia, serif;
    font-size: 0.95rem;
    line-height: 1.7;
    padding: 1rem;
    resize: vertical;
    outline: none;
    border-radius: 1px;
    transition: border-color 0.2s;
  }
  .journal-textarea:focus { border-color: var(--gold-dim); }
  .journal-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted);
    font-family: 'Share Tech Mono', monospace;
  }

  /* Buttons */
  .btn {
    font-family: 'Cinzel', serif;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    padding: 0.55rem 1.25rem;
    background: var(--gold-dim);
    border: 1px solid var(--gold);
    color: var(--amber);
    cursor: pointer;
    border-radius: 1px;
    text-transform: uppercase;
    transition: all 0.15s;
  }
  .btn:hover {
    background: var(--gold);
    color: var(--bg);
    box-shadow: 0 0 12px rgba(201,151,63,0.3);
  }
  .btn-ghost {
    background: transparent;
    border-color: var(--border);
    color: var(--muted);
  }
  .btn-ghost:hover { border-color: var(--gold-dim); color: var(--text); background: transparent; }

  /* Two col layout */
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 680px) {
    .cols { grid-template-columns: 1fr; }
  }

  /* Divider */
  .divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.75rem 0;
    color: var(--gold-dim);
    font-size: 0.7rem;
    font-family: 'Cinzel', serif;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* Scrollbars */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

// ── Inject CSS ─────────────────────────────────────────────────────────────
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════════════════

function OraclePanel() {
  const [likelihood, setLikelihood] = useState(3); // index into LIKELIHOODS
  const [chaos, setChaos] = useState(5);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [question, setQuestion] = useState("");

  const ask = () => {
    const lh = LIKELIHOODS[likelihood];
    const r = rollOracle(lh.mod, chaos);
    setResult(r);
    setLog(prev => [
      { q: question || "(no question)", a: r.result, lh: lh.label },
      ...prev.slice(0, 19),
    ]);
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Yes / No Oracle</div>

        <input
          placeholder="Ask a yes/no question…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          style={{
            width: "100%",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "1px",
            padding: "0.5rem 0.75rem",
            color: "var(--text)",
            fontFamily: "'IM Fell English', serif",
            fontSize: "0.9rem",
            outline: "none",
            marginBottom: "0.75rem",
          }}
        />

        <div style={{ marginBottom: "0.5rem", fontSize: "0.72rem", color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Likelihood</div>
        <div className="likelihood-grid">
          {LIKELIHOODS.map((lh, i) => (
            <button
              key={lh.label}
              className={`lh-btn${likelihood === i ? " selected" : ""}`}
              onClick={() => setLikelihood(i)}
            >{lh.label}</button>
          ))}
        </div>

        <div className="divider">Chaos Factor</div>
        <div className="chaos-row">
          <span className="chaos-label">Chaos</span>
          <div className="chaos-btns">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                className={`chaos-btn${chaos === n ? " active" : ""}`}
                onClick={() => setChaos(n)}
              >{n}</button>
            ))}
          </div>
        </div>

        <div className={`oracle-result${result ? ` tone-${result.tone}` : ""}`}>
          {result ? (
            <>
              <div className="oracle-answer">{result.result}</div>
              <div className="oracle-dice">
                🎲 {result.dice[0]} + {result.dice[1]} = {result.dice[0]+result.dice[1]}
                {" · "}{LIKELIHOODS[likelihood].label}
                {" · "} Chaos {chaos}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--muted)", fontStyle: "italic" }}>
              Set the likelihood, then ask the oracle…
            </div>
          )}
        </div>

        <button className="btn" style={{ width: "100%" }} onClick={ask}>
          ✦ Consult the Oracle ✦
        </button>
      </div>

      {log.length > 0 && (
        <div className="panel">
          <div className="panel-title">Recent Rolls</div>
          <div className="oracle-log">
            {log.map((entry, i) => (
              <div className="oracle-log-entry" key={i}>
                <span>{entry.a}</span>
                <span>{entry.lh} — {entry.q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DicePanel() {
  const [values, setValues] = useState({});
  const [rolling, setRolling] = useState({});
  const [history, setHistory] = useState([]);

  const roll = useCallback((sides) => {
    setRolling(r => ({ ...r, [sides]: true }));
    setTimeout(() => {
      const val = rollDie(sides);
      setValues(v => ({ ...v, [sides]: val }));
      setRolling(r => ({ ...r, [sides]: false }));
      setHistory(h => [`d${sides}: ${val}`, ...h.slice(0, 39)]);
    }, 300);
  }, []);

  const rollAll = () => DICE.forEach(d => {
    setTimeout(() => roll(d), Math.random() * 200);
  });

  return (
    <div className="panel">
      <div className="panel-title">Dice Roller</div>
      <div className="dice-grid">
        {DICE.map(sides => (
          <button
            key={sides}
            className={`die-btn${rolling[sides] ? " rolling" : ""}`}
            onClick={() => roll(sides)}
          >
            <span className="die-label">d{sides}</span>
            <span className="die-value">{values[sides] ?? "—"}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-ghost" style={{ marginBottom: "0.75rem" }} onClick={rollAll}>
        Roll All
      </button>
      {history.length > 0 && (
        <>
          <div className="divider">History</div>
          <div className="dice-history">
            {history.map((h, i) => (
              <span key={i} className="dice-history-chip">{h}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SparkPanel() {
  const [words, setWords] = useState(null);
  const [history, setHistory] = useState([]);

  const draw = () => {
    const w = drawSpark();
    setWords(w);
    setHistory(h => [`${w[0]} + ${w[1]}`, ...h.slice(0, 14)]);
  };

  return (
    <div className="panel">
      <div className="panel-title">Spark Table</div>
      <p style={{ fontSize: "1rem", color: "var(--muted)", fontStyle: "normal", marginBottom: "0.75rem" }}>
        Draw two words. View them through the lens of your current scene — trust the first idea that surfaces.
      </p>
      <div className="spark-result">
        {words ? (
          <>
            <div className="spark-words">
              <span className="spark-word">{words[0]}</span>
              <span className="spark-sep">✦</span>
              <span className="spark-word">{words[1]}</span>
            </div>
            <div className="spark-hint">
              What do these words suggest about the scene right now?
            </div>
          </>
        ) : (
          <div style={{ color: "var(--muted)", fontStyle: "italic" }}>Draw for inspiration…</div>
        )}
      </div>
      <button className="btn" style={{ width: "100%" }} onClick={draw}>
        ✦ Draw Spark ✦
      </button>
      {history.length > 0 && (
        <>
          <div className="divider" style={{ marginTop: "1rem" }}>Past Draws</div>
          <div className="spark-history">
            {history.map((h, i) => (
              <div key={i} className="spark-history-entry">{h}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StartPanel() {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState(new Set());

  const advance = () => {
    if (activeStep < START_STEPS.length - 1) {
      setDoneSteps(d => new Set([...d, activeStep]));
      setActiveStep(s => s + 1);
    } else {
      setDoneSteps(d => new Set([...d, activeStep]));
    }
  };

  const reset = () => {
    setActiveStep(0);
    setDoneSteps(new Set());
  };

  return (
    <div className="panel">
      <div className="panel-title">START Loop</div>
      <p style={{ fontSize: "1rem", color: "var(--text)", fontStyle: "italic", marginBottom: "1rem" }}>
        A structured ritual to keep your solo sessions moving. Click a step to focus it, or advance through in order.
      </p>
      <div className="start-steps">
        {START_STEPS.map((step, i) => (
          <div
            key={i}
            className={`start-step${doneSteps.has(i) ? " done" : ""}${activeStep === i && !doneSteps.has(i) ? " active" : ""}`}
            onClick={() => { setActiveStep(i); setDoneSteps(d => { const next = new Set(d); next.delete(i); return next; }); }}
          >
            <span className="start-letter">{step.letter}</span>
            <div className="start-step-text">
              <h3>{step.word}</h3>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="start-controls">
        <button className="btn" onClick={advance}>Next Step →</button>
        <button className="btn btn-ghost" onClick={reset}>Reset Loop</button>
      </div>
    </div>
  );
}

function JournalPanel() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const save = () => {
    try {
      // Save to a global variable since localStorage isn't available
      window._soloJournal = text;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch(e) {}
  };

  return (
    <div className="panel">
      <div className="panel-title">Session Journal</div>
      <textarea
        className="journal-textarea"
        placeholder="Write your session narrative here… record what happened, NPC names, quest threads, unanswered questions. This is your story."
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false); }}
      />
      <div className="journal-meta">
        <span>{wordCount} words</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {saved && <span style={{ color: "var(--yes)" }}>✓ Saved</span>}
          <button className="btn" onClick={save}>Save Notes</button>
        </div>
      </div>
    </div>
  );
}

// ── NPC Data ───────────────────────────────────────────────────────────────
const NPC_FIRST_NAMES = [
  "Aldric","Brynn","Caelum","Dara","Elowen","Fenn","Gidra","Harwick",
  "Isolde","Jareth","Kira","Lorn","Maeris","Neven","Oryn","Petra",
  "Quill","Rhaena","Soren","Tavia","Ulder","Veyra","Wren","Xanthe",
  "Ysolde","Zafar","Ashen","Breccan","Corvin","Delara","Emric","Faela",
  "Godwin","Hessa","Idris","Jora","Kylen","Liriel","Mord","Nala",
];

const NPC_LAST_NAMES = [
  "Ashford","Blackthorn","Coldwater","Duskmantle","Emberveil","Frostholm",
  "Greystone","Hallowmere","Ironwood","Jadehollow","Kettrick","Longmire",
  "Mirewood","Nighthollow","Oakheart","Pinecrest","Quarryfield","Ravenmoor",
  "Stoneback","Thistledown","Underhill","Vantablack","Whitlock","Yarrowdale",
];

const NPC_ROLES = [
  "Disgraced knight","Hedge witch","Wandering merchant","Temple acolyte",
  "Retired soldier","Gravekeeper","Innkeeper with a past","Bounty hunter",
  "Failed court wizard","Smuggler","Village healer","Exiled noble",
  "Sellsword","Spy for an unknown master","Cartographer","Herbalist",
  "Ferryman","Debt collector","Pilgrim","Deserter","Blacksmith",
  "Itinerant scholar","Midwife","Outlaw turned farmer","Pirate turned merchant",
];

const NPC_TRAITS = [
  "Speaks in half-truths","Laughs too loudly","Unusually calm under pressure",
  "Distrusts magic","Obsessively tidy","Carries a deep guilt",
  "Fiercely loyal once trust is earned","Jumpy, easily startled",
  "Talks to animals","Collects small keepsakes","Holds grudges for years",
  "Overly generous","Never makes eye contact","Tells rambling stories",
  "Deeply superstitious","Blunt to the point of rudeness","Hums constantly",
  "Asks too many questions","Masks fear with bravado","Surprisingly well-read",
];

const NPC_SECRETS = [
  "Is wanted in another province under a different name",
  "Knows where a body is buried — literally",
  "Was once a member of a banned cult",
  "Is secretly protecting someone dangerous",
  "Owes a life debt to a criminal lord",
  "Has faked their own death before",
  "Is not human — or not entirely",
  "Sold out their companions years ago and never recovered",
  "Carries a cursed object they can't bring themselves to discard",
  "Is slowly losing their memory and hiding it",
  "Has a child no one knows about",
  "Works for the very faction they claim to oppose",
  "Witnessed something that powerful people want kept quiet",
  "Is terminally ill and settling old scores",
  "Their mentor's death was not an accident",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNPC() {
  const traits = [...NPC_TRAITS];
  const t1 = traits.splice(Math.floor(Math.random() * traits.length), 1)[0];
  const t2 = traits[Math.floor(Math.random() * traits.length)];
  return {
    name: `${pick(NPC_FIRST_NAMES)} ${pick(NPC_LAST_NAMES)}`,
    role: pick(NPC_ROLES),
    trait1: t1,
    trait2: t2,
    secret: pick(NPC_SECRETS),
  };
}

function NPCPanel() {
  const [npc, setNpc] = useState(null);
  const [saved, setSaved] = useState([]);

  const generate = () => setNpc(generateNPC());
  const saveNpc = () => {
    if (npc) {
      setSaved(s => [npc, ...s.slice(0, 9)]);
      setNpc(null);
    }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-title">NPC Generator</div>

        {npc ? (
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderLeft: "3px solid var(--gold)", padding: "1.25rem", marginBottom: "1rem", borderRadius: "1px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", color: "var(--amber)", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
              {npc.name}
            </div>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <div>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "var(--gold-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Role — </span>
                <span style={{ fontSize: "1rem" }}>{npc.role}</span>
              </div>
              <div>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "var(--gold-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Traits — </span>
                <span style={{ fontSize: "1rem" }}>{npc.trait1}. {npc.trait2}.</span>
              </div>
              <div>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "var(--gold-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Secret — </span>
                <span style={{ fontSize: "1rem", fontStyle: "italic", color: "var(--muted)" }}>{npc.secret}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontStyle: "italic", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "1rem" }}>
            Generate an NPC to meet someone new…
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn" onClick={generate}>✦ Generate NPC ✦</button>
          {npc && <button className="btn btn-ghost" onClick={saveNpc}>Save to Roster</button>}
        </div>
      </div>

      {saved.length > 0 && (
        <div className="panel">
          <div className="panel-title">Roster</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {saved.map((s, i) => (
              <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.75rem 1rem", borderRadius: "1px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", color: "var(--amber)", fontSize: "1rem", marginBottom: "0.3rem" }}>{s.name}</div>
                <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{s.role} · {s.trait1}</div>
                <div style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--muted)", marginTop: "0.2rem" }}>{s.secret}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "oracle",  label: "Oracle" },
  { id: "dice",    label: "Dice" },
  { id: "spark",   label: "Spark Table" },
  { id: "start",   label: "START Loop" },
  { id: "npc",     label: "NPC" },
  { id: "journal", label: "Journal" },
];

export default function App() {
  const [tab, setTab] = useState("oracle");

  return (
    <div className="app">
      <div className="header">
        <h1>The Soloist's Workshop</h1>
        <p>A system-neutral toolkit for solo tabletop roleplaying</p>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {tab === "oracle"  && <OraclePanel />}
      {tab === "dice"    && <DicePanel />}
      {tab === "spark"   && <SparkPanel />}
      {tab === "start"   && <StartPanel />}
      {tab === "npc"     && <NPCPanel />}
      {tab === "journal" && <JournalPanel />}
    </div>
  );
}

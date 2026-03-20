import { useState, useCallback, useEffect } from "react";

const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Spectral+SC:wght@400;600&display=swap";
document.head.appendChild(FONT_LINK);

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const LIKELIHOODS = [
  { label: "Certain",       mod: +4 },
  { label: "Very Likely",   mod: +2 },
  { label: "Likely",        mod: +1 },
  { label: "50 / 50",       mod:  0 },
  { label: "Unlikely",      mod: -1 },
  { label: "Very Unlikely", mod: -2 },
  { label: "Impossible",    mod: -4 },
];

function rollOracle(mod, chaos) {
  const r1 = Math.ceil(Math.random() * 6);
  const r2 = Math.ceil(Math.random() * 6);
  const t = r1 + r2 + mod + (chaos - 5);
  if (t <= 2)  return { result: "No, and…",  tone: "bad",     dice: [r1,r2] };
  if (t <= 5)  return { result: "No",         tone: "no",      dice: [r1,r2] };
  if (t <= 7)  return { result: "No, but…",  tone: "no-but",  dice: [r1,r2] };
  if (t <= 9)  return { result: "Yes, but…", tone: "yes-but", dice: [r1,r2] };
  if (t <= 11) return { result: "Yes",        tone: "yes",     dice: [r1,r2] };
  return               { result: "Yes, and…", tone: "good",    dice: [r1,r2] };
}

const SPARK_WORDS = [
  "Abandoned","Ancient","Betrayal","Blood","Broken","Chaos","Cold","Cunning","Dark","Debt",
  "Decay","Dread","Duty","Echo","Edge","Ember","Empire","Exile","Fading","Fallen","Fate",
  "Fear","Flame","Fleeting","Fog","Forgotten","Fortune","Frenzy","Ghost","Gold","Grief",
  "Guard","Guilt","Haunted","Hidden","Hollow","Honor","Hope","Hunger","Iron","Jade",
  "Labyrinth","Legacy","Lost","Loyal","Madness","Mirror","Moonless","Myth","Night","Oath",
  "Omen","Pale","Plague","Price","Promise","Relic","Remnant","Ruin","Sacred","Scar",
  "Shadow","Silence","Silver","Sin","Smoke","Sorrow","Stolen","Storm","Strange","Threshold",
  "Throne","Tide","Tomb","Twisted","Veil","Vengeance","Vigil","Void","Wandering","War",
  "Wasteland","Whisper","Wild","Winter","Wrath","Warden","Wound","Zealot","Dusk","Rift","Cursed",
];
function drawSpark() {
  const a = SPARK_WORDS[Math.floor(Math.random()*SPARK_WORDS.length)];
  let b = SPARK_WORDS[Math.floor(Math.random()*SPARK_WORDS.length)];
  while (b===a) b = SPARK_WORDS[Math.floor(Math.random()*SPARK_WORDS.length)];
  return [a,b];
}

const DICE = [4,6,8,10,12,20,100];
function rollDie(n) { return Math.ceil(Math.random()*n); }

const NPC_FIRST = ["Aldric","Brynn","Caelum","Dara","Elowen","Fenn","Gidra","Harwick","Isolde","Jareth","Kira","Lorn","Maeris","Neven","Oryn","Petra","Quill","Rhaena","Soren","Tavia","Ulder","Veyra","Wren","Xanthe","Ysolde","Zafar","Ashen","Breccan","Corvin","Delara","Emric","Faela","Godwin","Hessa","Idris","Jora","Kylen","Liriel","Mord","Nala"];
const NPC_LAST  = ["Ashford","Blackthorn","Coldwater","Duskmantle","Emberveil","Frostholm","Greystone","Hallowmere","Ironwood","Jadehollow","Kettrick","Longmire","Mirewood","Nighthollow","Oakheart","Pinecrest","Quarryfield","Ravenmoor","Stoneback","Thistledown","Underhill","Whitlock","Yarrowdale"];
const NPC_ROLES = ["Disgraced knight","Hedge witch","Wandering merchant","Temple acolyte","Retired soldier","Gravekeeper","Innkeeper with a past","Bounty hunter","Failed court wizard","Smuggler","Village healer","Exiled noble","Sellsword","Spy for an unknown master","Cartographer","Herbalist","Ferryman","Debt collector","Pilgrim","Deserter","Blacksmith","Itinerant scholar","Outlaw turned farmer"];
const NPC_TRAITS = ["Speaks in half-truths","Laughs too loudly","Unusually calm under pressure","Distrusts magic","Obsessively tidy","Carries a deep guilt","Fiercely loyal once trust is earned","Jumpy, easily startled","Talks to animals","Collects small keepsakes","Holds grudges for years","Overly generous","Never makes eye contact","Tells rambling stories","Deeply superstitious","Blunt to the point of rudeness","Hums constantly","Asks too many questions","Masks fear with bravado","Surprisingly well-read"];
const NPC_SECRETS = ["Wanted in another province under a different name","Knows where a body is buried — literally","Was once a member of a banned cult","Is secretly protecting someone dangerous","Owes a life debt to a criminal lord","Has faked their own death before","Is not entirely human","Sold out companions years ago and never recovered","Carries a cursed object they cannot discard","Is slowly losing their memory and hiding it","Has a child no one knows about","Works for the faction they claim to oppose","Witnessed something powerful people want quiet","Is terminally ill and settling old scores"];
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }
function generateNPC() {
  const traits=[...NPC_TRAITS];
  const t1=traits.splice(Math.floor(Math.random()*traits.length),1)[0];
  const t2=traits[Math.floor(Math.random()*traits.length)];
  return { name:`${pick(NPC_FIRST)} ${pick(NPC_LAST)}`, role:pick(NPC_ROLES), trait1:t1, trait2:t2, secret:pick(NPC_SECRETS) };
}

const START_STEPS = [
  { letter:"S", word:"Set the Scene",  desc:"Where are you? Who is present? What is the immediate situation or goal?" },
  { letter:"T", word:"Think Ahead",    desc:"What could logically happen next? What is the most interesting complication?" },
  { letter:"A", word:"Ask the Oracle", desc:"Use the oracle for uncertain outcomes. Ask only when the answer genuinely matters." },
  { letter:"R", word:"Roll & Resolve", desc:"Use your game's mechanics — checks, combat, saves — to determine what happens." },
  { letter:"T", word:"Tell the Story", desc:"Narrate the outcome. Interpret the dice through fiction. Set up the next scene." },
];

const TONE_COLORS = {
  good:     { bg:"#c8edcc", border:"#2a7a36", text:"#123818" },
  yes:      { bg:"#e0f2e3", border:"#3d7a48", text:"#1a3d22" },
  "yes-but":{ bg:"#eef3df", border:"#7a9040", text:"#384516" },
  "no-but": { bg:"#f5ead8", border:"#a07030", text:"#4f2e08" },
  no:       { bg:"#f2dede", border:"#a03838", text:"#4a1010" },
  bad:      { bg:"#ecc0c0", border:"#c01818", text:"#5a0808" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Spectral+SC:wght@400;600&display=swap');

  :root {
    --bg:       #ede8df;
    --paper:    #f5f1ea;
    --card:     #faf7f2;
    --ink:      #1c1a16;
    --ink2:     #4a4438;
    --ink3:     #8a7e6a;
    --ink4:     #b8ae9a;
    --rust:     #a85c38;
    --rust-dim: #d4956e;
    --rust-bg:  #f7ede6;
    --sage:     #5c7a5c;
    --sage-bg:  #edf4ed;
    --border:   #d4ccbc;
    --border2:  #c4b8a4;
    --shadow:   rgba(28,26,22,0.08);
  }

  * { box-sizing:border-box; margin:0; padding:0; }

  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Spectral', Georgia, serif;
    font-size: 16px;
    min-height: 100vh;
    background-image: radial-gradient(circle, #c8bfaa 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* ── Top bar ── */
  .topbar {
    background: var(--card);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    height: 56px;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 1px 0 var(--border), 0 4px 12px var(--shadow);
  }

  .brand {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }
  .brand-title {
    font-family: 'Spectral SC', serif;
    font-size: 0.85rem;
    letter-spacing: 0.12em;
    color: var(--ink);
    font-weight: 600;
  }
  .brand-sub {
    font-size: 0.68rem;
    color: var(--ink3);
    font-style: italic;
    letter-spacing: 0.03em;
  }

  .topnav {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--ink3);
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .nav-btn svg { width:18px; height:18px; transition: color 0.15s; }
  .nav-btn:hover { background: var(--paper); color: var(--ink2); border-color: var(--border); }
  .nav-btn.active {
    background: var(--rust-bg);
    color: var(--rust);
    border-color: var(--rust-dim);
  }
  .nav-btn.active svg { color: var(--rust); }

  .chaos-control {
    display: flex;
    align-items: center;
    gap: 8px;
    border-left: 1px solid var(--border);
    padding-left: 16px;
    margin-left: 8px;
  }
  .chaos-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    color: var(--ink3);
    text-transform: uppercase;
  }
  .chaos-pips { display:flex; gap:3px; }
  .chaos-pip {
    width: 22px; height: 22px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--paper);
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    color: var(--ink3);
    display:flex; align-items:center; justify-content:center;
    transition: all 0.12s;
  }
  .chaos-pip:hover { border-color: var(--rust-dim); color: var(--rust); }
  .chaos-pip.active { background: var(--rust); border-color: var(--rust); color: #fff; }

  /* ── Main ── */
  .main {
    flex: 1;
    padding: 2rem 1.5rem;
    max-width: 860px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── Cards ── */
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--shadow), 0 0 0 1px rgba(255,255,255,0.6) inset;
    padding: 1.75rem;
    margin-bottom: 1.25rem;
  }

  .card-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--border);
  }
  .card-title {
    font-family: 'Spectral SC', serif;
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    color: var(--rust);
    font-weight: 600;
  }
  .card-meta {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    color: var(--ink4);
  }

  /* ── Oracle ── */
  .lh-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 1.25rem;
  }
  .lh-btn {
    padding: 0.45rem 0.3rem;
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    color: var(--ink3);
    cursor: pointer;
    text-align: center;
    transition: all 0.12s;
    letter-spacing: 0.02em;
  }
  .lh-btn:hover { border-color: var(--rust-dim); color: var(--ink2); }
  .lh-btn.sel { background: var(--rust); border-color: var(--rust); color: #fff; }

  .oracle-question {
    width: 100%;
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.65rem 0.85rem;
    font-family: 'Spectral', serif;
    font-size: 1rem;
    color: var(--ink);
    outline: none;
    margin-bottom: 1.25rem;
    transition: border-color 0.15s;
    font-style: italic;
  }
  .oracle-question:focus { border-color: var(--rust-dim); }
  .oracle-question::placeholder { color: var(--ink4); }

  .oracle-stage {
    border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--paper);
    min-height: 10rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    margin-bottom: 1.25rem;
    transition: border-color 0.4s, background 0.4s;
    position: relative;
    overflow: hidden;
  }
  .oracle-stage::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: repeating-linear-gradient(
      45deg, var(--ink) 0, var(--ink) 1px, transparent 0, transparent 50%
    );
    background-size: 8px 8px;
    pointer-events: none;
  }
  .oracle-result-text {
    font-family: 'Spectral', serif;
    font-size: clamp(2rem, 6vw, 3.2rem);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.01em;
    margin-bottom: 0.6rem;
  }
  .oracle-dice-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    color: var(--ink3);
    letter-spacing: 0.04em;
  }
  .oracle-empty {
    font-family: 'Spectral', serif;
    font-style: italic;
    color: var(--ink4);
    font-size: 1rem;
  }

  .consult-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--rust);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-family: 'Spectral SC', serif;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.15s;
  }
  .consult-btn:hover { background: #8f4d2e; }

  .log-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
    max-height: 8rem;
    overflow-y: auto;
  }
  .log-entry {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.85rem;
  }
  .log-answer { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--ink2); flex-shrink:0; }
  .log-q { color: var(--ink3); font-style: italic; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem; }

  /* ── Dice ── */
  .dice-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    margin-bottom: 1.25rem;
    overflow-x: auto;
  }
  .die-face {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    transition: all 0.15s;
    position: relative;
  }
  .die-face:hover { transform: translateY(-4px) scale(1.06); }
  .die-face:active { transform: translateY(1px) scale(0.97); }
  .die-face.rolling {
    animation: dieroll 0.3s ease-in-out;
  }
  @keyframes dieroll {
    0%,100% { transform: rotate(0deg) translateY(0); }
    25% { transform: rotate(-8deg) translateY(-4px); }
    75% { transform: rotate(8deg) translateY(-4px); }
  }
  .die-type {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    color: var(--ink4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .die-val {
    font-family: 'Spectral', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--rust);
    line-height: 1;
    min-height: 1.8rem;
    display:flex;
    align-items:center;
  }
  .die-val.empty { color: var(--ink4); font-size:1.2rem; }

  .dice-history-row {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-height: calc(4 * 2.6rem);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--paper);
  }
  .dice-chip {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    padding: 0.45rem 0.75rem;
    color: var(--ink2);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
  }
  .dice-chip:last-child { border-bottom: none; }

  /* ── Spark ── */
  .spark-stage {
    background: var(--paper);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    min-height: 9rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.75rem;
    margin-bottom: 1.25rem;
    gap: 0.75rem;
  }
  .spark-pair {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  .spark-word {
    font-family: 'Spectral SC', serif;
    font-size: clamp(1.4rem, 4vw, 2.2rem);
    letter-spacing: 0.06em;
    color: var(--ink);
    font-weight: 600;
  }
  .spark-plus {
    font-size: 1.5rem;
    color: var(--rust-dim);
    font-weight: 300;
  }
  .spark-prompt {
    font-style: italic;
    color: var(--ink3);
    font-size: 0.9rem;
  }
  .spark-hist {
    display:flex; flex-direction:column; gap:3px;
    max-height:6rem; overflow-y:auto;
  }
  .spark-hist-row {
    font-family:'DM Mono', monospace;
    font-size:0.68rem;
    color:var(--ink3);
    padding:3px 0;
    border-bottom:1px solid var(--border);
  }

  /* ── START loop ── */
  .start-grid { display:flex; flex-direction:column; gap:8px; }
  .start-step {
    display:flex;
    gap:1rem;
    align-items:flex-start;
    padding:0.9rem 1.1rem;
    background:var(--paper);
    border:1px solid var(--border);
    border-radius:8px;
    cursor:pointer;
    transition:all 0.15s;
    border-left:4px solid var(--border2);
  }
  .start-step:hover { border-color:var(--rust-dim); border-left-color:var(--rust-dim); }
  .start-step.active { border-left-color:var(--rust); background:var(--rust-bg); border-color:var(--rust-dim); }
  .start-step.done { opacity:0.45; border-left-color:var(--sage); }
  .step-letter {
    font-family:'Spectral SC', serif;
    font-size:1.8rem;
    font-weight:600;
    color:var(--border2);
    line-height:1;
    min-width:1.4rem;
    text-align:center;
    flex-shrink:0;
  }
  .start-step.active .step-letter { color:var(--rust); }
  .start-step.done   .step-letter { color:var(--sage); }
  .step-body h3 {
    font-family:'Spectral SC', serif;
    font-size:0.78rem;
    letter-spacing:0.1em;
    color:var(--ink2);
    margin-bottom:0.2rem;
  }
  .step-body p {
    font-size:0.88rem;
    color:var(--ink3);
    line-height:1.5;
    font-style:normal;
  }
  .start-step.active .step-body p { color:var(--ink2); }
  .start-controls { display:flex; gap:8px; margin-top:1rem; }

  /* ── Scene tracker ── */
  .scene-list { display:flex; flex-direction:column; gap:6px; max-height:50vh; overflow-y:auto; margin-bottom:1.25rem; }
  .scene-item {
    display:flex;
    align-items:flex-start;
    gap:10px;
    padding:0.7rem 0.9rem;
    background:var(--paper);
    border:1px solid var(--border);
    border-radius:7px;
    cursor:pointer;
    transition:all 0.12s;
    border-left:3px solid var(--border2);
  }
  .scene-item:hover { border-color:var(--rust-dim); }
  .scene-item.active { border-left-color:var(--rust); background:var(--rust-bg); }
  .scene-item.resolved { opacity:0.4; border-left-color:var(--sage); }
  .scene-num { font-family:'DM Mono', monospace; font-size:0.62rem; color:var(--ink4); flex-shrink:0; margin-top:2px; }
  .scene-content { flex:1; }
  .scene-title-text { font-family:'Spectral', serif; font-size:0.95rem; color:var(--ink); }
  .scene-item.resolved .scene-title-text { text-decoration:line-through; color:var(--ink3); }
  .scene-notes { font-size:0.8rem; color:var(--ink3); font-style:italic; margin-top:2px; }
  .scene-resolve {
    font-family:'DM Mono', monospace;
    font-size:0.6rem;
    letter-spacing:0.06em;
    padding:3px 8px;
    background:transparent;
    border:1px solid var(--border);
    border-radius:4px;
    cursor:pointer;
    color:var(--ink3);
    margin-top:6px;
    transition:all 0.12s;
  }
  .scene-resolve:hover { border-color:var(--sage); color:var(--sage); }
  .scene-x {
    background:transparent; border:none; color:var(--ink4);
    cursor:pointer; font-size:0.8rem; flex-shrink:0; padding:0;
    transition:color 0.12s;
  }
  .scene-x:hover { color:var(--rust); }

  .field {
    width:100%;
    background:var(--paper);
    border:1px solid var(--border);
    border-radius:6px;
    padding:0.55rem 0.75rem;
    font-family:'Spectral', serif;
    font-size:0.95rem;
    color:var(--ink);
    outline:none;
    transition:border-color 0.15s;
    margin-bottom:8px;
    font-style:italic;
  }
  .field:focus { border-color:var(--rust-dim); }
  .field::placeholder { color:var(--ink4); }

  /* ── NPC ── */
  .npc-display {
    background:var(--paper);
    border:1px solid var(--border);
    border-left:4px solid var(--rust);
    border-radius:8px;
    padding:1.25rem;
    margin-bottom:1rem;
  }
  .npc-name-text {
    font-family:'Spectral SC', serif;
    font-size:1.15rem;
    color:var(--ink);
    font-weight:600;
    margin-bottom:0.75rem;
    letter-spacing:0.04em;
  }
  .npc-row { margin-bottom:0.4rem; font-size:0.9rem; line-height:1.5; }
  .npc-key {
    font-family:'DM Mono', monospace;
    font-size:0.6rem;
    text-transform:uppercase;
    letter-spacing:0.1em;
    color:var(--rust-dim);
    margin-right:0.4rem;
  }
  .npc-secret-text { font-style:italic; color:var(--ink3); }
  .roster-list { display:flex; flex-direction:column; gap:6px; max-height:40vh; overflow-y:auto; }
  .roster-item {
    background:var(--paper);
    border:1px solid var(--border);
    border-radius:7px;
    padding:0.65rem 0.9rem;
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:8px;
  }
  .roster-name { font-family:'Spectral SC', serif; font-size:0.9rem; color:var(--ink); margin-bottom:3px; }
  .roster-detail { font-size:0.8rem; color:var(--ink3); }

  /* ── Shared buttons ── */
  .btn {
    font-family:'Spectral SC', serif;
    font-size:0.72rem;
    letter-spacing:0.1em;
    padding:0.55rem 1.15rem;
    border-radius:6px;
    border:1px solid var(--border2);
    background:var(--paper);
    color:var(--ink2);
    cursor:pointer;
    transition:all 0.15s;
    white-space:nowrap;
  }
  .btn:hover { background:var(--rust-bg); border-color:var(--rust-dim); color:var(--rust); }
  .btn-primary {
    background:var(--rust);
    border-color:var(--rust);
    color:#fff;
  }
  .btn-primary:hover { background:#8f4d2e; border-color:#8f4d2e; color:#fff; }
  .btn-sm { padding:0.35rem 0.75rem; font-size:0.62rem; }

  .row { display:flex; gap:8px; align-items:center; }
  .divider {
    display:flex; align-items:center; gap:8px;
    margin:1rem 0; color:var(--ink4);
    font-family:'DM Mono', monospace;
    font-size:0.62rem; letter-spacing:0.08em;
  }
  .divider::before,.divider::after { content:''; flex:1; height:1px; background:var(--border); }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

  @media (max-width:700px) {
    .topnav { gap:0; }
    .nav-btn { padding:5px 7px; font-size:0.55rem; }
    .nav-btn svg { width:15px; height:15px; }
    .chaos-control { display:none; }
    .brand-sub { display:none; }
    .main { padding:1rem; }
    .card { padding:1.25rem; }
    .lh-grid { grid-template-columns:repeat(2,1fr); }
    .die-face { width:60px; height:60px; }
  }
`;

const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

const NAV = [
  { id:"oracle", label:"Oracle",   icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 6.5v4l2.5 2.5" strokeLinecap="round"/></svg> },
  { id:"dice",   label:"Dice",     icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="14" height="14" rx="3"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1" fill="currentColor" stroke="none"/></svg> },
  { id:"spark",  label:"Spark",    icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l2 5h5l-4 3 1.5 5L10 13l-4.5 3L7 11 3 8h5z" strokeLinejoin="round"/></svg> },
  { id:"start",  label:"Start",    icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h12M4 10h8M4 15h5" strokeLinecap="round"/></svg> },
  { id:"scene",  label:"Scenes",   icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M7 4V2M13 4V2M3 9h14" strokeLinecap="round"/></svg> },
  { id:"npc",    label:"NPCs",     icon:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" strokeLinecap="round"/></svg> },
];

function OraclePanel({ chaos }) {
  const [lh, setLh] = useState(() => load("oracle-lh", 3));
  const [result, setResult] = useState(null);
  const [log, setLog] = useState(() => load("oracle-log", []));
  const [q, setQ] = useState("");

  useEffect(() => { save("oracle-lh", lh); }, [lh]);
  useEffect(() => { save("oracle-log", log); }, [log]);

  const ask = () => {
    const r = rollOracle(LIKELIHOODS[lh].mod, chaos);
    setResult({ ...r, lh: LIKELIHOODS[lh].label, q: q || "—" });
    setLog(p => [{ q: q||"—", a: r.result, lh: LIKELIHOODS[lh].label }, ...p.slice(0,29)]);
  };

  const tc = result ? TONE_COLORS[result.tone] : null;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Yes / No Oracle</span>
          <span className="card-meta">Chaos {chaos}</span>
        </div>
        <input className="oracle-question" placeholder="What do you want to know?" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} />
        <div style={{marginBottom:"0.6rem",fontFamily:"'DM Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.1em",color:"var(--ink3)",textTransform:"uppercase"}}>Likelihood</div>
        <div className="lh-grid">
          {LIKELIHOODS.map((l,i) => <button key={l.label} className={"lh-btn"+(lh===i?" sel":"")} onClick={()=>setLh(i)}>{l.label}</button>)}
        </div>
        <div className="oracle-stage" style={tc ? {borderColor:tc.border,background:tc.bg} : {}}>
          {result ? (
            <>
              <div className="oracle-result-text" style={{color: tc.text}}>{result.result}</div>
              <div className="oracle-dice-text">d6 {result.dice[0]} + {result.dice[1]} = {result.dice[0]+result.dice[1]} · {result.lh} · Chaos {chaos}</div>
            </>
          ) : <div className="oracle-empty">Ask your question, set the odds, roll the bones.</div>}
        </div>
        <button className="consult-btn" onClick={ask}>Consult the Oracle</button>
      </div>

      {log.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Roll History</span>
            <button className="btn btn-sm" onClick={()=>{setLog([]);save("oracle-log",[]);}}>Clear</button>
          </div>
          <div className="log-list">
            {log.map((e,i) => (
              <div key={i} className="log-entry">
                <span className="log-answer">{e.a}</span>
                <span className="log-q">{e.lh} · {e.q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


const DIE_CONFIG = {
  4:   { viewBox:"0 0 100 100", points:"50,6 94,88 6,88",                           textY:66, fontSize:"1.9rem",  type:"triangle" },
  6:   { viewBox:"0 0 100 100",                                                       textY:56, fontSize:"1.9rem",  type:"square"   },
  8:   { viewBox:"0 0 100 100", points:"50,5 95,50 50,95 5,50",                      textY:56, fontSize:"1.9rem",  type:"polygon"  },
  10:  { viewBox:"0 0 100 100", points:"50,5 88,30 88,70 50,95 12,70 12,30",         textY:56, fontSize:"1.9rem",  type:"polygon"  },
  12:  { viewBox:"0 0 100 100", points:"50,4 72,16 88,38 84,64 62,82 38,82 16,64 12,38 28,16", textY:56, fontSize:"1.9rem", type:"polygon" },
  20:  { viewBox:"0 0 100 100", points:"50,4 95,30 80,88 20,88 5,30",                textY:60, fontSize:"1.9rem",  type:"polygon"  },
  100: { viewBox:"0 0 100 100", points:"50,5 95,50 50,95 5,50",                      textY:56, fontSize:"1.3rem",  type:"polygon"  },
};

function DieFace({ sides, value, rolling, onClick }) {
  const cfg = DIE_CONFIG[sides] || DIE_CONFIG[6];
  const hasVal = value !== undefined;
  const shapeProps = { fill:"var(--paper)", stroke:"var(--border2)", strokeWidth:"2.5", strokeLinejoin:"round" };
  return (
    <div
      className={"die-face"+(rolling?" rolling":"")}
      onClick={onClick}
      style={{background:"transparent",border:"none",boxShadow:"none",padding:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}
    >
      <svg
        viewBox={cfg.viewBox}
        style={{width:"76px",height:"76px",filter:rolling?"drop-shadow(0 0 5px var(--rust-dim))":"drop-shadow(0 2px 3px var(--shadow))",transition:"filter 0.15s"}}
      >
        {cfg.type === "square"
          ? <rect x="8" y="8" width="84" height="84" rx="8" {...shapeProps}/>
          : <polygon points={cfg.points} {...shapeProps}/>
        }
        <text
          x="50"
          y={cfg.textY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Spectral, Georgia, serif"
          fontSize={cfg.fontSize}
          fontWeight="600"
          fill={hasVal ? "var(--rust)" : "var(--ink4)"}
        >
          {hasVal ? value : "·"}
        </text>
      </svg>
      <div style={{fontFamily:"DM Mono, monospace",fontSize:"0.6rem",color:"var(--ink3)",letterSpacing:"0.08em"}}>d{sides}</div>
    </div>
  );
}

function DicePanel() {
  const [vals, setVals] = useState({});
  const [rolling, setRolling] = useState({});
  const [rows, setRows] = useState(() => { const r = load("dice-rows", []); return Array.isArray(r) ? r : []; });

  useEffect(() => { save("dice-rows", rows); }, [rows]);

  const addRow = (snapshot) => {
    setRows(r => [snapshot, ...r.slice(0, 3)]);
  };

  const roll = useCallback((s) => {
    setRolling(r => ({...r,[s]:true}));
    setTimeout(() => {
      const v = rollDie(s);
      setVals(p => {
        const next = {...p,[s]:v};
        addRow(next);
        return next;
      });
      setRolling(r => ({...r,[s]:false}));
    }, 280);
  }, []);

  const rollAll = () => {
    const newVals = {};
    DICE.forEach((d, i) => {
      setTimeout(() => {
        setRolling(r => ({...r,[d]:true}));
        setTimeout(() => {
          newVals[d] = rollDie(d);
          setVals(p => ({...p,[d]:newVals[d]}));
          setRolling(r => ({...r,[d]:false}));
          if (i === DICE.length - 1) addRow({...newVals});
        }, 280);
      }, i * 60);
    });
  };

  const hasRows = rows.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Dice Roller</span>
        <div className="row">
          <button className="btn btn-sm" onClick={rollAll}>Roll All</button>
          {hasRows && <button className="btn btn-sm" onClick={()=>{setRows([]);setVals({});save("dice-rows",[]);}}>Clear</button>}
        </div>
      </div>
      <div className="dice-grid">
        {DICE.map(s => <DieFace key={s} sides={s} value={vals[s]} rolling={!!rolling[s]} onClick={()=>roll(s)} />)}
      </div>
      {hasRows && (
        <>
          <div className="divider">History</div>
          <div className="dice-history-row">
            {rows.map((row, i) => (
              <div key={i} className="dice-chip">
                {DICE.map(d => (
                  <span key={d} style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:1,flex:1}}>
                    <span style={{fontSize:"0.55rem",color:"var(--ink4)",fontFamily:"DM Mono,monospace",letterSpacing:"0.06em"}}>d{d}</span>
                    <span style={{color:row[d]!==undefined?"var(--rust)":"var(--ink4)",fontWeight:row[d]!==undefined?500:400}}>
                      {row[d]!==undefined ? row[d] : "—"}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SparkPanel() {
  const [words, setWords] = useState(null);
  const [hist, setHist] = useState(() => load("spark-hist", []));

  useEffect(() => { save("spark-hist", hist); }, [hist]);

  const draw = () => {
    const w = drawSpark();
    setWords(w);
    setHist(h => [w[0]+" + "+w[1],...h.slice(0,19)]);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Spark Table</span>
      </div>
      <p style={{fontSize:"0.9rem",color:"var(--ink3)",fontStyle:"italic",marginBottom:"1.25rem",lineHeight:1.6}}>
        Draw two words. Hold them against your current scene and trust the first connection that surfaces.
      </p>
      <div className="spark-stage">
        {words ? (
          <>
            <div className="spark-pair">
              <span className="spark-word">{words[0]}</span>
              <span className="spark-plus">+</span>
              <span className="spark-word">{words[1]}</span>
            </div>
            <div className="spark-prompt">What does this suggest about right now?</div>
          </>
        ) : <div className="oracle-empty">Draw for inspiration when the scene goes quiet.</div>}
      </div>
      <button className="consult-btn" onClick={draw}>Draw Spark</button>
      {hist.length > 0 && (
        <>
          <div className="divider" style={{marginTop:"1.25rem"}}>Past Draws</div>
          <div className="spark-hist">
            {hist.map((h,i) => <div key={i} className="spark-hist-row">{h}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

function StartPanel({ onStepChange }) {
  const [active, setActive] = useState(() => load("start-active", 0));
  const [done, setDone] = useState(() => new Set(load("start-done", [])));

  useEffect(() => { save("start-active", active); }, [active]);
  useEffect(() => { save("start-done", [...done]); onStepChange(active, done); }, [done, active]);

  const advance = () => {
    if (active < START_STEPS.length-1) { setDone(d=>new Set([...d,active])); setActive(a=>a+1); }
    else { setDone(d=>new Set([...d,active])); }
  };
  const reset = () => { setActive(0); setDone(new Set()); save("start-active",0); save("start-done",[]); };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">START Loop</span>
        <div className="row">
          {START_STEPS.map((_,i) => (
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:done.has(i)?"var(--sage)":active===i&&!done.has(i)?"var(--rust)":"var(--border2)",transition:"background 0.2s"}} />
          ))}
        </div>
      </div>
      <p style={{fontSize:"0.9rem",color:"var(--ink3)",fontStyle:"italic",marginBottom:"1.25rem",lineHeight:1.6}}>
        A structured loop to keep solo sessions moving. Click any step to focus it.
      </p>
      <div className="start-grid">
        {START_STEPS.map((s,i) => (
          <div key={i}
            className={"start-step"+(done.has(i)?" done":"")+(active===i&&!done.has(i)?" active":"")}
            onClick={()=>{ setActive(i); setDone(d=>{const n=new Set(d);n.delete(i);return n;}); }}
          >
            <span className="step-letter">{s.letter}</span>
            <div className="step-body"><h3>{s.word}</h3><p>{s.desc}</p></div>
          </div>
        ))}
      </div>
      <div className="start-controls">
        <button className="btn btn-primary" onClick={advance}>Next Step →</button>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

function ScenePanel() {
  const [scenes, setScenes] = useState(() => load("scenes", []));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [activeId, setActiveId] = useState(null);

  useEffect(() => { save("scenes", scenes); }, [scenes]);

  const add = () => {
    if (!title.trim()) return;
    const s = { id: Date.now(), title: title.trim(), notes: notes.trim(), resolved: false };
    setScenes(p => [...p, s]);
    setActiveId(s.id);
    setTitle(""); setNotes("");
  };
  const toggle = id => setScenes(s => s.map(x => x.id===id ? {...x,resolved:!x.resolved} : x));
  const remove = id => { setScenes(s => s.filter(x => x.id!==id)); if(activeId===id) setActiveId(null); };
  const active = scenes.filter(s=>!s.resolved).length;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scene Tracker</span>
          {scenes.length>0 && <span className="card-meta">{active} active · {scenes.length-active} resolved</span>}
        </div>
        {scenes.length > 0 && (
          <div className="scene-list">
            {scenes.map((s,i) => (
              <div key={s.id}
                className={"scene-item"+(s.resolved?" resolved":"")+(activeId===s.id?" active":"")}
                onClick={()=>setActiveId(a=>a===s.id?null:s.id)}
              >
                <span className="scene-num">#{i+1}</span>
                <div className="scene-content">
                  <div className="scene-title-text">{s.title}</div>
                  {s.notes && <div className="scene-notes">{s.notes}</div>}
                  {activeId===s.id && (
                    <button className="scene-resolve" onClick={e=>{e.stopPropagation();toggle(s.id);}}>
                      {s.resolved?"Reopen":"Resolve"}
                    </button>
                  )}
                </div>
                <button className="scene-x" onClick={e=>{e.stopPropagation();remove(s.id);}}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="divider">{scenes.length===0?"First scene":"New scene"}</div>
        <input className="field" placeholder="Scene or hex location…" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} />
        <textarea className="field" placeholder="Notes (optional)…" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{resize:"vertical",lineHeight:1.6,fontStyle:"italic"}} />
        <button className="btn btn-primary" style={{width:"100%"}} onClick={add}>Add Scene</button>
      </div>
    </div>
  );
}

function NPCPanel() {
  const [npc, setNpc] = useState(null);
  const [roster, setRoster] = useState(() => load("npc-roster", []));

  useEffect(() => { save("npc-roster", roster); }, [roster]);

  const generate = () => setNpc(generateNPC());
  const saveNpc = () => { if(npc){setRoster(r=>[npc,...r.slice(0,19)]);setNpc(null);} };
  const removeNpc = i => setRoster(r=>r.filter((_,idx)=>idx!==i));

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">NPC Generator</span>
        </div>
        {npc ? (
          <div className="npc-display">
            <div className="npc-name-text">{npc.name}</div>
            <div className="npc-row"><span className="npc-key">Role</span>{npc.role}</div>
            <div className="npc-row"><span className="npc-key">Traits</span>{npc.trait1}. {npc.trait2}.</div>
            <div className="npc-row"><span className="npc-key">Secret</span><span className="npc-secret-text">{npc.secret}</span></div>
          </div>
        ) : (
          <div style={{padding:"2rem",textAlign:"center",color:"var(--ink4)",fontStyle:"italic",background:"var(--paper)",border:"1px solid var(--border)",borderRadius:8,marginBottom:"1rem"}}>
            Generate an NPC to meet someone new.
          </div>
        )}
        <div className="row">
          <button className="btn btn-primary" onClick={generate}>Generate NPC</button>
          {npc && <button className="btn" onClick={saveNpc}>Save to Roster</button>}
        </div>
      </div>

      {roster.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Roster ({roster.length})</span>
            <button className="btn btn-sm" onClick={()=>{setRoster([]);save("npc-roster",[]);}}>Clear all</button>
          </div>
          <div className="roster-list">
            {roster.map((s,i) => (
              <div key={i} className="roster-item">
                <div style={{flex:1}}>
                  <div className="roster-name">{s.name}</div>
                  <div className="roster-detail" style={{marginBottom:4}}>{s.role}</div>
                  <div className="roster-detail"><span style={{fontFamily:"DM Mono,monospace",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--rust-dim)",marginRight:4}}>Traits</span>{s.trait1}. {s.trait2}.</div>
                  <div style={{fontSize:"0.82rem",fontStyle:"italic",color:"var(--ink3)",marginTop:4}}><span style={{fontFamily:"DM Mono,monospace",fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--rust-dim)",marginRight:4,fontStyle:"normal"}}>Secret</span>{s.secret}</div>
                </div>
                <button className="scene-x" onClick={()=>removeNpc(i)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(() => load("tab","oracle"));
  const [chaos, setChaos] = useState(() => load("chaos",5));
  const [startStep, setStartStep] = useState(0);
  const [startDone, setStartDone] = useState(new Set());

  useEffect(()=>{ save("tab",tab); },[tab]);
  useEffect(()=>{ save("chaos",chaos); },[chaos]);

  return (
    <div className="layout">
      <div className="topbar">
        <div className="brand">
          <div className="brand-title">The Soloist's Workshop</div>
          <div className="brand-sub">system-neutral solo toolkit</div>
        </div>

        <div className="topnav">
          {NAV.map(n => (
            <button key={n.id} className={"nav-btn"+(tab===n.id?" active":"")} onClick={()=>setTab(n.id)}>
              {n.icon}
              {n.label}
              {n.id==="start" && (
                <div style={{display:"flex",gap:2,marginTop:1}}>
                  {START_STEPS.map((_,i) => (
                    <div key={i} style={{width:5,height:5,borderRadius:"50%",background:startDone.has(i)?"var(--sage)":startStep===i&&!startDone.has(i)?"var(--rust)":"var(--border2)"}} />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="chaos-control">
          <span className="chaos-label">Chaos</span>
          <div className="chaos-pips">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <div key={n} className={"chaos-pip"+(chaos===n?" active":"")} onClick={()=>setChaos(n)}>{n}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="main">
        {tab==="oracle" && <OraclePanel chaos={chaos} />}
        {tab==="dice"   && <DicePanel />}
        {tab==="spark"  && <SparkPanel />}
        {tab==="start"  && <StartPanel onStepChange={(s,d)=>{setStartStep(s);setStartDone(d);}} />}
        {tab==="scene"  && <ScenePanel />}
        {tab==="npc"    && <NPCPanel />}
      </div>
    </div>
  );
}

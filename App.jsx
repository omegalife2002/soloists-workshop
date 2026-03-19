import { useState, useCallback, useEffect } from "react";

// ── Font injection ──────────────────────────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Share+Tech+Mono&display=swap";
document.head.appendChild(FONT_LINK);

// ── Persistence helpers ─────────────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Oracle Data ─────────────────────────────────────────────────────────────
const LIKELIHOODS = [
  { label: "Certain",       mod: +4 },
  { label: "Very Likely",   mod: +2 },
  { label: "Likely",        mod: +1 },
  { label: "50/50",         mod:  0 },
  { label: "Unlikely",      mod: -1 },
  { label: "Very Unlikely", mod: -2 },
  { label: "Impossible",    mod: -4 },
];

function rollOracle(likelihoodMod, chaos) {
  const r1 = Math.ceil(Math.random() * 6);
  const r2 = Math.ceil(Math.random() * 6);
  const raw = r1 + r2;
  const total = raw + likelihoodMod + (chaos - 5);
  if (total <= 2)  return { result: "No, and\u2026",  tone: "bad",     dice: [r1, r2] };
  if (total <= 5)  return { result: "No",              tone: "no",      dice: [r1, r2] };
  if (total <= 7)  return { result: "No, but\u2026",  tone: "no-but",  dice: [r1, r2] };
  if (total <= 9)  return { result: "Yes, but\u2026", tone: "yes-but", dice: [r1, r2] };
  if (total <= 11) return { result: "Yes",             tone: "yes",     dice: [r1, r2] };
  return                   { result: "Yes, and\u2026", tone: "good",    dice: [r1, r2] };
}

// ── Spark Words ─────────────────────────────────────────────────────────────
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
  "Dusk","Oracle","Stranger","Rift","Cursed","Bound",
];

function drawSpark() {
  const a = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
  let b = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
  while (b === a) b = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
  return [a, b];
}

// ── Dice ────────────────────────────────────────────────────────────────────
const DICE = [4, 6, 8, 10, 12, 20, 100];
function rollDie(sides) { return Math.ceil(Math.random() * sides); }

// ── NPC Data ────────────────────────────────────────────────────────────────
const NPC_FIRST = ["Aldric","Brynn","Caelum","Dara","Elowen","Fenn","Gidra","Harwick","Isolde","Jareth","Kira","Lorn","Maeris","Neven","Oryn","Petra","Quill","Rhaena","Soren","Tavia","Ulder","Veyra","Wren","Xanthe","Ysolde","Zafar","Ashen","Breccan","Corvin","Delara","Emric","Faela","Godwin","Hessa","Idris","Jora","Kylen","Liriel","Mord","Nala"];
const NPC_LAST  = ["Ashford","Blackthorn","Coldwater","Duskmantle","Emberveil","Frostholm","Greystone","Hallowmere","Ironwood","Jadehollow","Kettrick","Longmire","Mirewood","Nighthollow","Oakheart","Pinecrest","Quarryfield","Ravenmoor","Stoneback","Thistledown","Underhill","Vantablack","Whitlock","Yarrowdale"];
const NPC_ROLES = ["Disgraced knight","Hedge witch","Wandering merchant","Temple acolyte","Retired soldier","Gravekeeper","Innkeeper with a past","Bounty hunter","Failed court wizard","Smuggler","Village healer","Exiled noble","Sellsword","Spy for an unknown master","Cartographer","Herbalist","Ferryman","Debt collector","Pilgrim","Deserter","Blacksmith","Itinerant scholar","Outlaw turned farmer"];
const NPC_TRAITS = ["Speaks in half-truths","Laughs too loudly","Unusually calm under pressure","Distrusts magic","Obsessively tidy","Carries a deep guilt","Fiercely loyal once trust is earned","Jumpy, easily startled","Talks to animals","Collects small keepsakes","Holds grudges for years","Overly generous","Never makes eye contact","Tells rambling stories","Deeply superstitious","Blunt to the point of rudeness","Hums constantly","Asks too many questions","Masks fear with bravado","Surprisingly well-read"];
const NPC_SECRETS = ["Is wanted in another province under a different name","Knows where a body is buried literally","Was once a member of a banned cult","Is secretly protecting someone dangerous","Owes a life debt to a criminal lord","Has faked their own death before","Is not human or not entirely","Sold out companions years ago and never recovered","Carries a cursed object they cannot discard","Is slowly losing their memory and hiding it","Has a child no one knows about","Works for the faction they claim to oppose","Witnessed something powerful people want quiet","Is terminally ill and settling old scores"];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generateNPC() {
  const traits = [...NPC_TRAITS];
  const t1 = traits.splice(Math.floor(Math.random() * traits.length), 1)[0];
  const t2 = traits[Math.floor(Math.random() * traits.length)];
  return { name: `${pick(NPC_FIRST)} ${pick(NPC_LAST)}`, role: pick(NPC_ROLES), trait1: t1, trait2: t2, secret: pick(NPC_SECRETS) };
}

// ── START Loop ──────────────────────────────────────────────────────────────
const START_STEPS = [
  { letter: "S", word: "Set the Scene",  desc: "Where are you? Who is present? What is the immediate situation or goal?" },
  { letter: "T", word: "Think Ahead",    desc: "Consider what could logically happen next. What is the most interesting complication?" },
  { letter: "A", word: "Ask the Oracle", desc: "Use the oracle for uncertain outcomes. Ask when the answer is in doubt and matters." },
  { letter: "R", word: "Roll & Resolve", desc: "Use your game mechanics such as skill checks, combat, and saves to determine what happens." },
  { letter: "T", word: "Tell the Story", desc: "Narrate the outcome. Interpret the dice through the fiction. Set up the next scene." },
];

// ── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  :root {
    --bg:        #0d0c0a;
    --surface:   #16140f;
    --surface2:  #1c1a14;
    --border:    #2e2a1e;
    --border2:   #3d3729;
    --gold:      #c9973f;
    --gold-dim:  #7a5c24;
    --amber:     #e8b45a;
    --text:      #d4c9a8;
    --muted:     #7a6e55;
    --muted2:    #5a5040;
    --yes-and:   #3dbb5e;
    --yes:       #5f9e6e;
    --yes-but:   #8fb87a;
    --no-but:    #b87a7a;
    --no:        #9e5f5f;
    --no-and:    #cc3c3c;
    --sidebar-w: 240px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'IM Fell English', Georgia, serif; font-size: 16px; overflow-x: hidden; }

  .layout { display: grid; grid-template-columns: var(--sidebar-w) 1fr; grid-template-rows: auto 1fr; min-height: 100vh; }

  .header { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border); background: var(--surface); gap: 1rem; }
  .header-brand { display: flex; flex-direction: column; }
  .header h1 { font-family: 'Cinzel', serif; font-size: clamp(1rem, 2.5vw, 1.35rem); color: var(--amber); letter-spacing: 0.15em; font-weight: 700; line-height: 1.1; }
  .header-sub { font-size: 0.68rem; color: var(--muted); font-style: italic; letter-spacing: 0.05em; }
  .header-chaos { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
  .chaos-label { font-family: 'Cinzel', serif; font-size: 0.62rem; letter-spacing: 0.12em; color: var(--muted); text-transform: uppercase; white-space: nowrap; }
  .chaos-btns { display: flex; gap: 3px; }
  .chaos-btn { width: 1.65rem; height: 1.65rem; border: 1px solid var(--border); background: var(--bg); color: var(--muted); font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; cursor: pointer; border-radius: 2px; transition: all 0.12s; display: flex; align-items: center; justify-content: center; }
  .chaos-btn:hover { border-color: var(--gold-dim); color: var(--text); }
  .chaos-btn.active { background: var(--gold-dim); border-color: var(--gold); color: var(--amber); }

  .sidebar { background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; padding: 1rem 0.65rem; gap: 0.35rem; }
  .sidebar-section { font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.18em; color: var(--muted2); text-transform: uppercase; padding: 0.5rem 0.5rem 0.2rem; }
  .nav-btn { display: flex; align-items: center; gap: 0.55rem; padding: 0.5rem 0.7rem; background: transparent; border: 1px solid transparent; color: var(--muted); font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.08em; cursor: pointer; border-radius: 2px; text-align: left; width: 100%; transition: all 0.15s; }
  .nav-btn:hover { color: var(--text); background: var(--surface2); }
  .nav-btn.active { color: var(--amber); background: var(--surface2); border-color: var(--border2); }
  .nav-icon { width: 15px; height: 15px; opacity: 0.65; flex-shrink: 0; }
  .nav-btn.active .nav-icon { opacity: 1; }
  .start-progress { margin: 0.2rem 0 0 2rem; display: flex; gap: 4px; }
  .start-pip { width: 6px; height: 6px; border-radius: 50%; background: var(--border2); transition: background 0.2s; }
  .start-pip.done { background: var(--yes); }
  .start-pip.active { background: var(--amber); }

  .main { overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.1rem; }

  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 2px; padding: 1.1rem 1.25rem; }
  .panel-title { font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 0.15em; color: var(--gold-dim); text-transform: uppercase; margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
  .panel-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .likelihood-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3rem; margin-bottom: 0.9rem; }
  .lh-btn { font-family: 'Cinzel', serif; font-size: 0.62rem; letter-spacing: 0.04em; padding: 0.38rem 0.3rem; background: var(--bg); border: 1px solid var(--border); color: var(--muted); cursor: pointer; border-radius: 2px; transition: all 0.12s; white-space: nowrap; text-align: center; }
  .lh-btn:hover { color: var(--text); border-color: var(--gold-dim); }
  .lh-btn.selected { background: var(--gold-dim); border-color: var(--gold); color: var(--amber); }

  .oracle-result { text-align: center; padding: 1.1rem; margin: 0.85rem 0; border: 1px solid var(--border); background: var(--bg); border-radius: 2px; min-height: 5.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; transition: border-color 0.3s; }
  .oracle-result.tone-good    { border-color: var(--yes-and); }
  .oracle-result.tone-yes     { border-color: var(--yes); }
  .oracle-result.tone-yes-but { border-color: var(--yes-but); }
  .oracle-result.tone-no-but  { border-color: var(--no-but); }
  .oracle-result.tone-no      { border-color: var(--no); }
  .oracle-result.tone-bad     { border-color: var(--no-and); }
  .oracle-answer { font-family: 'Cinzel', serif; font-size: clamp(1.2rem, 3.5vw, 1.85rem); font-weight: 700; letter-spacing: 0.05em; }
  .tone-good    .oracle-answer { color: var(--yes-and); }
  .tone-yes     .oracle-answer { color: var(--yes); }
  .tone-yes-but .oracle-answer { color: var(--yes-but); }
  .tone-no-but  .oracle-answer { color: var(--no-but); }
  .tone-no      .oracle-answer { color: var(--no); }
  .tone-bad     .oracle-answer { color: var(--no-and); }
  .oracle-dice { font-family: 'Share Tech Mono', monospace; font-size: 0.72rem; color: var(--muted); }
  .oracle-log { max-height: 7rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .oracle-log-entry { font-size: 0.76rem; padding: 0.22rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; gap: 0.5rem; color: var(--muted); font-style: italic; }
  .oracle-log-entry span:first-child { color: var(--text); font-style: normal; flex-shrink: 0; }
  .oracle-log-q { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .dice-grid { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.7rem; }
  .die-btn { font-family: 'Cinzel', serif; font-size: 0.72rem; letter-spacing: 0.05em; width: 3rem; height: 3rem; border: 1px solid var(--border); background: var(--bg); color: var(--muted); cursor: pointer; border-radius: 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.08rem; transition: all 0.15s; }
  .die-btn:hover { border-color: var(--gold-dim); color: var(--text); transform: translateY(-2px); }
  .die-btn.rolling { animation: shake 0.28s ease-in-out; border-color: var(--gold); }
  @keyframes shake { 0%,100%{transform:translate(0,0) rotate(0);} 25%{transform:translate(-3px,1px) rotate(-5deg);} 75%{transform:translate(3px,-1px) rotate(5deg);} }
  .die-label { font-size: 0.58rem; color: var(--gold-dim); text-transform: uppercase; }
  .die-value { font-size: 1.15rem; color: var(--amber); font-weight: 700; min-height: 1.3rem; }
  .dice-history { display: flex; flex-wrap: wrap; gap: 0.3rem; max-height: 5rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .dice-chip { font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; padding: 0.12rem 0.4rem; background: var(--bg); border: 1px solid var(--border); color: var(--muted); border-radius: 1px; }

  .spark-result { text-align: center; padding: 1.4rem 1rem; background: var(--bg); border: 1px solid var(--border); margin: 0.85rem 0; border-radius: 2px; min-height: 6.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.55rem; }
  .spark-words { display: flex; gap: 1.1rem; align-items: center; }
  .spark-word { font-family: 'Cinzel', serif; font-size: clamp(1.05rem, 2.8vw, 1.5rem); font-weight: 600; color: var(--amber); letter-spacing: 0.08em; }
  .spark-sep { color: var(--gold-dim); font-size: 1.1rem; }
  .spark-hint { font-style: italic; color: var(--muted); font-size: 0.85rem; }
  .spark-history { display: flex; flex-direction: column; gap: 0.22rem; max-height: 5.5rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .spark-entry { font-size: 0.72rem; font-family: 'Share Tech Mono', monospace; color: var(--muted); padding: 0.18rem 0; border-bottom: 1px solid var(--border); }

  .start-steps { display: flex; flex-direction: column; gap: 0.55rem; }
  .start-step { display: flex; gap: 0.8rem; padding: 0.6rem 0.85rem; background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--gold-dim); border-radius: 1px; cursor: pointer; transition: border-left-color 0.2s, opacity 0.2s; }
  .start-step:hover { border-left-color: var(--gold); }
  .start-step.done { border-left-color: var(--yes); opacity: 0.45; }
  .start-step.active { border-left-color: var(--amber); }
  .start-letter { font-family: 'Cinzel', serif; font-size: 1.5rem; font-weight: 700; color: var(--gold-dim); line-height: 1; min-width: 1.2rem; text-align: center; }
  .start-step.active .start-letter { color: var(--amber); }
  .start-step.done   .start-letter { color: var(--yes); }
  .start-step-text h3 { font-family: 'Cinzel', serif; font-size: 0.77rem; letter-spacing: 0.08em; color: var(--text); margin-bottom: 0.18rem; }
  .start-step-text p  { font-size: 0.86rem; color: var(--muted); font-style: normal; line-height: 1.45; }
  .start-step.active .start-step-text p { color: var(--text); }
  .start-controls { display: flex; gap: 0.5rem; margin-top: 0.7rem; }

  .scene-list { display: flex; flex-direction: column; gap: 0.45rem; max-height: 52vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; margin-bottom: 0.85rem; }
  .scene-card { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--gold-dim); padding: 0.6rem 0.8rem; border-radius: 1px; cursor: pointer; transition: border-left-color 0.15s; display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
  .scene-card.resolved { opacity: 0.4; border-left-color: var(--yes); }
  .scene-card.active   { border-left-color: var(--amber); }
  .scene-num { font-family: 'Share Tech Mono', monospace; font-size: 0.62rem; color: var(--muted); flex-shrink: 0; margin-top: 2px; }
  .scene-body { flex: 1; }
  .scene-title { font-family: 'Cinzel', serif; font-size: 0.8rem; letter-spacing: 0.05em; color: var(--text); margin-bottom: 0.15rem; display: block; }
  .scene-card.resolved .scene-title { text-decoration: line-through; color: var(--muted); }
  .scene-desc { font-size: 0.8rem; color: var(--muted); font-style: italic; line-height: 1.4; }
  .scene-resolve-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.08em; padding: 0.2rem 0.5rem; cursor: pointer; border-radius: 1px; margin-top: 0.35rem; transition: all 0.12s; }
  .scene-resolve-btn:hover { border-color: var(--yes); color: var(--yes); }
  .scene-close { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 0.75rem; padding: 0; line-height: 1; flex-shrink: 0; }
  .scene-close:hover { color: var(--no); }
  .scene-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'IM Fell English', serif; font-size: 0.88rem; padding: 0.42rem 0.62rem; outline: none; border-radius: 1px; transition: border-color 0.15s; margin-bottom: 0.38rem; }
  .scene-input:focus { border-color: var(--gold-dim); }
  .scene-input::placeholder { color: var(--muted); font-style: italic; }

  .npc-card { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--gold); padding: 0.9rem; margin-bottom: 0.7rem; border-radius: 1px; }
  .npc-name { font-family: 'Cinzel', serif; font-size: 1.05rem; color: var(--amber); margin-bottom: 0.55rem; letter-spacing: 0.05em; }
  .npc-field { margin-bottom: 0.3rem; font-size: 0.88rem; line-height: 1.5; }
  .npc-label { font-family: 'Cinzel', serif; font-size: 0.6rem; color: var(--gold-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-right: 0.3rem; }
  .npc-secret { font-style: italic; color: var(--muted); }
  .npc-roster { display: flex; flex-direction: column; gap: 0.45rem; max-height: 42vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .roster-card { background: var(--bg); border: 1px solid var(--border); padding: 0.55rem 0.8rem; border-radius: 1px; display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
  .roster-name { font-family: 'Cinzel', serif; color: var(--amber); font-size: 0.88rem; margin-bottom: 0.18rem; }
  .roster-detail { font-size: 0.78rem; color: var(--muted); }

  .btn { font-family: 'Cinzel', serif; font-size: 0.68rem; letter-spacing: 0.1em; padding: 0.48rem 1.05rem; background: var(--gold-dim); border: 1px solid var(--gold); color: var(--amber); cursor: pointer; border-radius: 1px; text-transform: uppercase; transition: all 0.15s; white-space: nowrap; }
  .btn:hover { background: var(--gold); color: var(--bg); }
  .btn-ghost { background: transparent; border-color: var(--border); color: var(--muted); }
  .btn-ghost:hover { border-color: var(--gold-dim); color: var(--text); background: transparent; }
  .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.6rem; }

  .divider { display: flex; align-items: center; gap: 0.55rem; margin: 0.7rem 0; color: var(--gold-dim); font-size: 0.62rem; font-family: 'Cinzel', serif; }
  .divider::before,.divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .text-input { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 1px; padding: 0.48rem 0.65rem; color: var(--text); font-family: 'IM Fell English', serif; font-size: 0.88rem; outline: none; margin-bottom: 0.7rem; transition: border-color 0.15s; }
  .text-input:focus { border-color: var(--gold-dim); }
  .text-input::placeholder { color: var(--muted); font-style: italic; }

  .chaos-mobile { display: none; }

  @media (max-width: 720px) {
    .layout { grid-template-columns: 1fr; }
    .sidebar { border-right: none; border-bottom: 1px solid var(--border); flex-direction: row; overflow-x: auto; overflow-y: hidden; padding: 0.45rem; gap: 0.2rem; }
    .sidebar-section { display: none; }
    .nav-btn { white-space: nowrap; flex-shrink: 0; }
    .start-progress { display: none; }
    .header-chaos { display: none; }
    .chaos-mobile { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem; flex-direction: column; }
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

// ── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  oracle: <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  dice:   <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="2" width="12" height="12" rx="2"/><circle cx="5.5" cy="5.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="5.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="5.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/></svg>,
  spark:  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M8 2l1.5 4H14l-3.5 2.5 1.3 4L8 10l-3.8 2.5 1.3-4L2 6h4.5z"/></svg>,
  start:  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 3h10M3 7h7M3 11h5"/></svg>,
  scene:  <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M5 3V2M11 3V2M2 7h12"/></svg>,
  npc:    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/></svg>,
};

// ══════════════════════════════════════════════════════════════════════════════
// ORACLE PANEL
// ══════════════════════════════════════════════════════════════════════════════
function OraclePanel({ chaos }) {
  const [likelihood, setLikelihood] = useState(() => load("oracle-lh", 3));
  const [result, setResult] = useState(null);
  const [log, setLog] = useState(() => load("oracle-log", []));
  const [question, setQuestion] = useState("");

  useEffect(() => { save("oracle-lh", likelihood); }, [likelihood]);
  useEffect(() => { save("oracle-log", log); }, [log]);

  const ask = () => {
    const lh = LIKELIHOODS[likelihood];
    const r = rollOracle(lh.mod, chaos);
    setResult(r);
    setLog(prev => [{ q: question || "—", a: r.result, lh: lh.label }, ...prev.slice(0, 29)]);
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Yes / No Oracle</div>
        <input
          className="text-input"
          placeholder="Type a yes/no question… (Enter to roll)"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
        />
        <div style={{ marginBottom: "0.35rem", fontSize: "0.62rem", color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Likelihood</div>
        <div className="likelihood-grid">
          {LIKELIHOODS.map((lh, i) => (
            <button key={lh.label} className={"lh-btn" + (likelihood === i ? " selected" : "")} onClick={() => setLikelihood(i)}>{lh.label}</button>
          ))}
        </div>
        <div className={"oracle-result" + (result ? " tone-" + result.tone : "")}>
          {result ? (
            <>
              <div className="oracle-answer">{result.result}</div>
              <div className="oracle-dice">d6 {result.dice[0]} + {result.dice[1]} = {result.dice[0]+result.dice[1]} · {LIKELIHOODS[likelihood].label} · Chaos {chaos}</div>
            </>
          ) : (
            <div style={{ color: "var(--muted)", fontStyle: "italic" }}>Set likelihood, then ask the oracle…</div>
          )}
        </div>
        <button className="btn" style={{ width: "100%" }} onClick={ask}>✦ Consult the Oracle ✦</button>
      </div>
      {log.length > 0 && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Roll History</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setLog([]); save("oracle-log", []); }}>Clear</button>
          </div>
          <div className="oracle-log">
            {log.map((entry, i) => (
              <div className="oracle-log-entry" key={i}>
                <span>{entry.a}</span>
                <span className="oracle-log-q">{entry.lh} · {entry.q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DICE PANEL
// ══════════════════════════════════════════════════════════════════════════════
function DicePanel() {
  const [values, setValues] = useState({});
  const [rolling, setRolling] = useState({});
  const [history, setHistory] = useState(() => load("dice-history", []));

  useEffect(() => { save("dice-history", history); }, [history]);

  const roll = useCallback((sides) => {
    setRolling(r => ({ ...r, [sides]: true }));
    setTimeout(() => {
      const val = rollDie(sides);
      setValues(v => ({ ...v, [sides]: val }));
      setRolling(r => ({ ...r, [sides]: false }));
      setHistory(h => ["d" + sides + ":" + val, ...h.slice(0, 49)]);
    }, 280);
  }, []);

  const rollAll = () => DICE.forEach(d => setTimeout(() => roll(d), Math.random() * 180));

  return (
    <div className="panel">
      <div className="panel-title">Dice Roller</div>
      <div className="dice-grid">
        {DICE.map(sides => (
          <button key={sides} className={"die-btn" + (rolling[sides] ? " rolling" : "")} onClick={() => roll(sides)}>
            <span className="die-label">d{sides}</span>
            <span className="die-value">{values[sides] !== undefined ? values[sides] : "—"}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.7rem" }}>
        <button className="btn btn-ghost btn-sm" onClick={rollAll}>Roll All</button>
        {history.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => { setHistory([]); save("dice-history", []); }}>Clear</button>}
      </div>
      {history.length > 0 && (
        <>
          <div className="divider">History</div>
          <div className="dice-history">
            {history.map((h, i) => <span key={i} className="dice-chip">{h}</span>)}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SPARK PANEL
// ══════════════════════════════════════════════════════════════════════════════
function SparkPanel() {
  const [words, setWords] = useState(null);
  const [history, setHistory] = useState(() => load("spark-history", []));

  useEffect(() => { save("spark-history", history); }, [history]);

  const draw = () => {
    const w = drawSpark();
    setWords(w);
    setHistory(h => [w[0] + " + " + w[1], ...h.slice(0, 19)]);
  };

  return (
    <div className="panel">
      <div className="panel-title">Spark Table</div>
      <p style={{ fontSize: "0.88rem", color: "var(--muted)", marginBottom: "0.7rem" }}>
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
            <div className="spark-hint">What do these suggest about the scene right now?</div>
          </>
        ) : (
          <div style={{ color: "var(--muted)", fontStyle: "italic" }}>Draw for inspiration…</div>
        )}
      </div>
      <button className="btn" style={{ width: "100%" }} onClick={draw}>✦ Draw Spark ✦</button>
      {history.length > 0 && (
        <>
          <div className="divider" style={{ marginTop: "0.9rem" }}>Past Draws</div>
          <div className="spark-history">
            {history.map((h, i) => <div key={i} className="spark-entry">{h}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// START LOOP PANEL
// ══════════════════════════════════════════════════════════════════════════════
function StartPanel({ onStepChange }) {
  const [activeStep, setActiveStep] = useState(() => load("start-step", 0));
  const [doneSteps, setDoneSteps] = useState(() => new Set(load("start-done", [])));

  useEffect(() => { save("start-step", activeStep); }, [activeStep]);
  useEffect(() => {
    save("start-done", [...doneSteps]);
    onStepChange(activeStep, doneSteps);
  }, [doneSteps, activeStep]);

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
    save("start-step", 0);
    save("start-done", []);
  };

  return (
    <div className="panel">
      <div className="panel-title">START Loop</div>
      <p style={{ fontSize: "0.88rem", color: "var(--muted)", fontStyle: "italic", marginBottom: "0.9rem" }}>
        A structured ritual to keep your session moving. Click any step to jump to it.
      </p>
      <div className="start-steps">
        {START_STEPS.map((step, i) => (
          <div
            key={i}
            className={"start-step" + (doneSteps.has(i) ? " done" : "") + (activeStep === i && !doneSteps.has(i) ? " active" : "")}
            onClick={() => { setActiveStep(i); setDoneSteps(d => { const n = new Set(d); n.delete(i); return n; }); }}
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
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCENE TRACKER PANEL
// ══════════════════════════════════════════════════════════════════════════════
function ScenePanel() {
  const [scenes, setScenes] = useState(() => load("scenes", []));
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => { save("scenes", scenes); }, [scenes]);

  const addScene = () => {
    if (!newTitle.trim()) return;
    const scene = { id: Date.now(), title: newTitle.trim(), desc: newDesc.trim(), resolved: false };
    setScenes(s => [...s, scene]);
    setActive(scene.id);
    setNewTitle("");
    setNewDesc("");
  };

  const toggleResolved = (id) => setScenes(s => s.map(sc => sc.id === id ? { ...sc, resolved: !sc.resolved } : sc));
  const removeScene = (id) => { setScenes(s => s.filter(sc => sc.id !== id)); if (active === id) setActive(null); };
  const activeCount = scenes.filter(s => !s.resolved).length;

  return (
    <div>
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>Scene Tracker</div>
          {scenes.length > 0 && (
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.68rem", color: "var(--muted)" }}>
              {activeCount} active · {scenes.length - activeCount} resolved
            </span>
          )}
        </div>
        {scenes.length > 0 && (
          <div className="scene-list">
            {scenes.map((sc, i) => (
              <div
                key={sc.id}
                className={"scene-card" + (sc.resolved ? " resolved" : "") + (active === sc.id ? " active" : "")}
                onClick={() => setActive(a => a === sc.id ? null : sc.id)}
              >
                <span className="scene-num">#{i + 1}</span>
                <div className="scene-body">
                  <span className="scene-title">{sc.title}</span>
                  {sc.desc && <div className="scene-desc">{sc.desc}</div>}
                  {active === sc.id && (
                    <button className="scene-resolve-btn" onClick={e => { e.stopPropagation(); toggleResolved(sc.id); }}>
                      {sc.resolved ? "Reopen" : "Resolve"}
                    </button>
                  )}
                </div>
                <button className="scene-close" onClick={e => { e.stopPropagation(); removeScene(sc.id); }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="divider">{scenes.length === 0 ? "Add first scene" : "New scene"}</div>
        <input className="scene-input" placeholder="Scene title or hex location…" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addScene()} />
        <input className="scene-input" placeholder="Notes (optional)…" value={newDesc} onChange={e => setNewDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && addScene()} />
        <button className="btn" onClick={addScene} style={{ width: "100%" }}>Add Scene</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NPC PANEL
// ══════════════════════════════════════════════════════════════════════════════
function NPCPanel() {
  const [npc, setNpc] = useState(null);
  const [roster, setRoster] = useState(() => load("npc-roster", []));

  useEffect(() => { save("npc-roster", roster); }, [roster]);

  const generate = () => setNpc(generateNPC());
  const saveNpc = () => { if (npc) { setRoster(s => [npc, ...s.slice(0, 19)]); setNpc(null); } };
  const removeNpc = (i) => setRoster(r => r.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="panel">
        <div className="panel-title">NPC Generator</div>
        {npc ? (
          <div className="npc-card">
            <div className="npc-name">{npc.name}</div>
            <div className="npc-field"><span className="npc-label">Role</span>{npc.role}</div>
            <div className="npc-field"><span className="npc-label">Traits</span>{npc.trait1}. {npc.trait2}.</div>
            <div className="npc-field"><span className="npc-label">Secret</span><span className="npc-secret">{npc.secret}</span></div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "1.25rem", color: "var(--muted)", fontStyle: "italic", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "0.7rem", borderRadius: "1px" }}>
            Generate an NPC to meet someone new…
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn" onClick={generate}>✦ Generate NPC ✦</button>
          {npc && <button className="btn btn-ghost" onClick={saveNpc}>Save to Roster</button>}
        </div>
      </div>
      {roster.length > 0 && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Roster ({roster.length})</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setRoster([]); save("npc-roster", []); }}>Clear all</button>
          </div>
          <div className="npc-roster">
            {roster.map((s, i) => (
              <div key={i} className="roster-card">
                <div>
                  <div className="roster-name">{s.name}</div>
                  <div className="roster-detail">{s.role} · {s.trait1}</div>
                  <div style={{ fontSize: "0.76rem", fontStyle: "italic", color: "var(--muted)", marginTop: "0.12rem" }}>{s.secret}</div>
                </div>
                <button className="scene-close" onClick={() => removeNpc(i)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "oracle", label: "Oracle",        icon: "oracle" },
  { id: "dice",   label: "Dice",          icon: "dice"   },
  { id: "spark",  label: "Spark Table",   icon: "spark"  },
  { id: "start",  label: "START Loop",    icon: "start"  },
  { id: "scene",  label: "Scene Tracker", icon: "scene"  },
  { id: "npc",    label: "NPCs",          icon: "npc"    },
];

export default function App() {
  const [tab, setTab]     = useState(() => load("active-tab", "oracle"));
  const [chaos, setChaos] = useState(() => load("chaos", 5));
  const [startStep, setStartStep] = useState(0);
  const [startDone, setStartDone] = useState(new Set());

  useEffect(() => { save("active-tab", tab); }, [tab]);
  useEffect(() => { save("chaos", chaos); }, [chaos]);

  const handleStepChange = (step, done) => { setStartStep(step); setStartDone(done); };

  return (
    <div className="layout">
      <div className="header">
        <div className="header-brand">
          <h1>The Soloist's Workshop</h1>
          <span className="header-sub">A system-neutral toolkit for solo tabletop roleplaying</span>
        </div>
        <div className="header-chaos">
          <span className="chaos-label">Chaos</span>
          <div className="chaos-btns">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} className={"chaos-btn" + (chaos === n ? " active" : "")} onClick={() => setChaos(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="sidebar-section">Tools</div>
        {TABS.map(t => (
          <div key={t.id}>
            <button className={"nav-btn" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
              {Icons[t.icon]}
              {t.label}
            </button>
            {t.id === "start" && (
              <div className="start-progress">
                {START_STEPS.map((_, i) => (
                  <div key={i} className={"start-pip" + (startDone.has(i) ? " done" : "") + (startStep === i && !startDone.has(i) ? " active" : "")} />
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="chaos-mobile" style={{ padding: "0.5rem", flexDirection: "column", gap: "0.35rem" }}>
          <span className="chaos-label">Chaos Factor</span>
          <div className="chaos-btns" style={{ flexWrap: "wrap" }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} className={"chaos-btn" + (chaos === n ? " active" : "")} onClick={() => setChaos(n)}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="main">
        {tab === "oracle" && <OraclePanel chaos={chaos} />}
        {tab === "dice"   && <DicePanel />}
        {tab === "spark"  && <SparkPanel />}
        {tab === "start"  && <StartPanel onStepChange={handleStepChange} />}
        {tab === "scene"  && <ScenePanel />}
        {tab === "npc"    && <NPCPanel />}
      </div>
    </div>
  );
}

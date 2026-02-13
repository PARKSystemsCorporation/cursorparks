import "./research.css";
import Link from "next/link";

export const metadata = {
    title: "Research Hub — PARK Systems",
    description: "Published research findings, specifications, and technical reports.",
};

export default function ResearchPage() {
    return (
        <div className="research-hub">
            {/* HUD Corner Decorations */}
            <div className="rh-hud-corner rh-hud-tl" />
            <div className="rh-hud-corner rh-hud-tr" />
            <div className="rh-hud-corner rh-hud-bl" />
            <div className="rh-hud-corner rh-hud-br" />

            {/* Navigation */}
            <nav className="rh-nav">
                <a href="/research" className="rh-nav-brand">
                    <div className="rh-nav-icon" />
                    <span className="rh-nav-title">Research</span>
                </a>
                <ul className="rh-nav-links">
                    <li><Link href="/research" className="active">Feed</Link></li>
                    <li><Link href="#">Archive</Link></li>
                    <li><Link href="#">Systems</Link></li>
                    <li><Link href="/">Bazaar</Link></li>
                </ul>
                <div className="rh-nav-status">
                    <span className="rh-status-dot" />
                    SYS ONLINE
                </div>
            </nav>

            {/* Hero */}
            <header className="rh-hero">
                <p className="rh-hero-eyebrow">PARK Systems Research Division</p>
                <h1>
                    Research <span>Hub</span>
                </h1>
                <p className="rh-hero-sub">
                    Published findings, specifications, and technical reports.
                    Open knowledge for autonomous systems engineering.
                </p>
                <div className="rh-stats-bar">
                    <div className="rh-stat">
                        <span className="rh-stat-value">2</span>
                        <span className="rh-stat-label">Publications</span>
                    </div>
                    <div className="rh-stat">
                        <span className="rh-stat-value">9</span>
                        <span className="rh-stat-label">Files Spec&apos;d</span>
                    </div>
                    <div className="rh-stat">
                        <span className="rh-stat-value">ACTIVE</span>
                        <span className="rh-stat-label">Status</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="rh-content">
                {/* Left Sidebar */}
                <aside className="rh-sidebar-left">
                    <div className="rh-sidebar-section">
                        <h4 className="rh-sidebar-title">Classifications</h4>
                        <ul className="rh-tag-list">
                            <li className="rh-tag-item active">
                                <span className="rh-tag-dot" style={{ background: "#00aaff" }} />
                                Specifications
                                <span className="rh-tag-count">1</span>
                            </li>
                            <li className="rh-tag-item">
                                <span className="rh-tag-dot" style={{ background: "#7b5cff" }} />
                                Research
                                <span className="rh-tag-count">0</span>
                            </li>
                            <li className="rh-tag-item">
                                <span className="rh-tag-dot" style={{ background: "#ff6f3c" }} />
                                Reports
                                <span className="rh-tag-count">0</span>
                            </li>
                        </ul>
                    </div>
                    <div className="rh-sidebar-section">
                        <h4 className="rh-sidebar-title">Systems</h4>
                        <ul className="rh-tag-list">
                            <li className="rh-tag-item active">
                                <span className="rh-tag-dot" style={{ background: "#00e5ff" }} />
                                KIRA
                                <span className="rh-tag-count">1</span>
                            </li>
                            <li className="rh-tag-item">
                                <span className="rh-tag-dot" style={{ background: "#00e5ff" }} />
                                EXOKIN
                                <span className="rh-tag-count">1</span>
                            </li>
                            <li className="rh-tag-item">
                                <span className="rh-tag-dot" style={{ background: "#00e5ff" }} />
                                ARIA
                                <span className="rh-tag-count">0</span>
                            </li>
                            <li className="rh-tag-item">
                                <span className="rh-tag-dot" style={{ background: "#00e5ff" }} />
                                Unity Bridge
                                <span className="rh-tag-count">0</span>
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Feed */}
                <section className="rh-feed">
                    <div className="rh-feed-header">
                        <h3 className="rh-feed-title">Latest Publications</h3>
                        <div className="rh-feed-sort">
                            <button className="rh-sort-btn active">Latest</button>
                            <button className="rh-sort-btn">Top</button>
                        </div>
                    </div>

                    {/* ═══ POST: EARE — EXOKIN Autonomous Regulation Engine ═══ */}
                    <article className="rh-post">
                        <div className="rh-post-header">
                            <span className="rh-post-classification rh-class-spec">SPEC</span>
                            <span className="rh-post-meta">2026-02-13 · v1.0</span>
                        </div>

                        <h2 className="rh-post-title">
                            <a href="#">EARE — EXOKIN Autonomous Regulation Engine</a>
                        </h2>
                        <p className="rh-post-subtitle">
                            Anti-gravity prompt: convert EXOKIN from a static ruleset into a self-regulating, autonomous species layer. No manual tuning; roles and behavior emerge from experience.
                        </p>

                        <div className="rh-post-tags">
                            <span className="rh-post-tag">EXOKIN</span>
                            <span className="rh-post-tag">EARE</span>
                            <span className="rh-post-tag">AUTONOMOUS</span>
                            <span className="rh-post-tag">NEUROCHEMISTRY</span>
                            <span className="rh-post-tag">SELF-REGULATION</span>
                        </div>

                        <div className="rh-post-body">
                            <h3>Summary</h3>
                            <p>
                                The <strong>EXOKIN Autonomous Regulation Engine (EARE)</strong> is a persistent system layer that sits above morphology, color, and AI chat. It does not implement a single feature: it implements a <strong>living system</strong> that self-evaluates, self-balances, self-adjusts, and evolves behavior automatically. There are no manual stat sliders, hardcoded outcomes, or static classes—it behaves like an ecosystem, not a game mechanic.
                            </p>

                            <h3>What EARE Controls</h3>
                            <p>
                                The engine runs continuously and regulates: combat effectiveness calibration, temperament drift, neurochemical balance, interaction tendencies, role stabilization (warrior vs companion), and personality evolution. It interprets physical form, color, and chat and governs their outcomes rather than being driven by them.
                            </p>

                            <h3>Input Layers (What the System Watches)</h3>
                            <ul>
                                <li><strong>Physical:</strong> body structure, geometry, mass, limb configuration, balance.</li>
                                <li><strong>Visual identity:</strong> color spectrum, surface material, visual aggression vs warmth.</li>
                                <li><strong>Behavioral:</strong> combat frequency, chat frequency, roaming, proximity to user, wins/losses.</li>
                                <li><strong>Neurochemical (real-time synthetic levels):</strong> aggression, bonding, alertness, curiosity, territoriality, play drive.</li>
                            </ul>

                            <h3>Core Loop: Observe → Evaluate → Adjust → Stabilize → Repeat</h3>
                            <p>
                                EARE detects imbalances, adjusts neurochemistry, shifts behavioral tendencies, and updates combat calibration. Examples: repeated combat losses with high aggression → reduce aggression bias, increase caution and adaptability. Long social time with little combat → drift role toward Companion. Frequent wins and low bonding → reinforce Warrior tendencies.
                            </p>

                            <h3>Role Emergence (Not Assigned)</h3>
                            <p>
                                Warrior vs Companion is not selected—it emerges from structure, experience, neuro state, environment, and owner interaction. Roles drift slowly over time. Color and morphology are <strong>baselines only</strong> (starting biases); a warm-colored warrior or cold-colored companion can still emerge from behavior.
                            </p>

                            <h3>Neurochemistry as Feedback Economy</h3>
                            <p>
                                Neuro levels are not static sliders. They rise and decay naturally in loops: <em>stimulus → response → chemical shift → behavioral outcome → new stimulus</em>. Example: fight → adrenaline spike → aggression rise → victory → dominance reinforcement; or fight → loss → caution increase → bonding increase → reduced combat seeking.
                            </p>

                            <h3>Chat AI Governed by EARE</h3>
                            <p>
                                Chat is not standalone. It reads current neuro levels, role drift, combat confidence, and bonding state. Speech tone shifts dynamically with internal state.
                            </p>

                            <h3>Self-Balancing and Long-Term Evolution</h3>
                            <p>
                                The engine auto-corrects extremes: too aggressive → fatigue/instability; too passive → stimulation/curiosity; too dominant → unpredictability; too social → independence. It also tracks lifetime combat exposure, social interaction, owner dependency, and environmental stress to form a personality arc. No two EXOKIN converge—they diverge over time.
                            </p>

                            <h3>Implementation Directive</h3>
                            <p>
                                EARE must exist as a <strong>persistent system layer</strong>—not a visual feature or stat sheet. It runs in the background, rewriting internal weights, rebalancing tendencies, shifting behavior probabilities, and guiding chat tone and combat instincts. Design intent: not AI enemies, but a <strong>self-regulating robotic species</strong> that learns equilibrium, drifts, adapts, stabilizes, and becomes itself. This engine is the core governing intelligence layer of the EXOKIN schematic.
                            </p>
                        </div>

                        <div className="rh-post-footer">
                            <button className="rh-post-action">
                                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                0
                            </button>
                            <button className="rh-post-action">
                                <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" /></svg>
                                0
                            </button>
                            <button className="rh-post-action">
                                <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                                SHARE
                            </button>
                            <button className="rh-post-action" style={{ marginLeft: "auto" }}>
                                <svg viewBox="0 0 24 24"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" /></svg>
                                BOOKMARK
                            </button>
                        </div>
                    </article>

                    {/* ═══ POST: EURO-DRIVE ═══ */}
                    <article className="rh-post">
                        <div className="rh-post-header">
                            <span className="rh-post-classification rh-class-spec">SPEC</span>
                            <span className="rh-post-meta">2026-02-12 · v1.0</span>
                        </div>

                        <h2 className="rh-post-title">
                            <a href="#">EURO-DRIVE — Autonomous World Builder Engine</a>
                        </h2>
                        <p className="rh-post-subtitle">
                            Neuro-drive loop specification for continuous autonomous world-building in KIRA.
                        </p>

                        <div className="rh-post-tags">
                            <span className="rh-post-tag">KIRA</span>
                            <span className="rh-post-tag">NEURO-DRIVE</span>
                            <span className="rh-post-tag">AUTONOMOUS</span>
                            <span className="rh-post-tag">UNITY</span>
                            <span className="rh-post-tag">WORLD-BUILDER</span>
                        </div>

                        <div className="rh-post-body">
                            <h3>Context</h3>
                            <p>
                                KIRA currently behaves as a task executor: trigger → pipeline → stop.
                                The user wants a self-driven world builder: perceive → feel pressure/curiosity → decide → build → evaluate → adapt → repeat.
                            </p>
                            <p>
                                The core principle: <strong>KIRA cannot be idle.</strong> Idle increases pressure automatically.
                                KIRA must always be in one of: <code>observing</code>, <code>planning</code>, <code>building</code>, <code>repairing</code>, <code>learning</code>.
                                This requires a new <code>NeuroDriveLoop</code> that maintains continuous internal state (<code>KiraState</code>)
                                and uses deterministic intent selection to dispatch autonomous behavior every tick.
                            </p>
                            <p>
                                The existing <code>PersistentWorkLoop</code> (45s tick, mode-based routing) is the current autonomous engine.
                                The neuro-drive replaces it with a richer internal state model, intent-based dispatch,
                                environment awareness, and bidirectional Unity bridge communication.
                            </p>

                            <h3>Files to Create / Modify</h3>
                            <table>
                                <thead>
                                    <tr><th>#</th><th>File</th><th>Action</th><th>Purpose</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>1</td><td>src/kira/drive/kira_state.py</td><td>NEW</td><td>KiraState dataclass + IntentEngine</td></tr>
                                    <tr><td>2</td><td>src/kira/drive/environment_model.py</td><td>NEW</td><td>EnvironmentModel — tracks world state</td></tr>
                                    <tr><td>3</td><td>src/kira/loops/neuro_drive_loop.py</td><td>NEW</td><td>NeuroDriveLoop — the always-running brain</td></tr>
                                    <tr><td>4</td><td>src/kira/bridge/protocol.py</td><td>MODIFY</td><td>Add SCENE_QUERY, SCENE_RESPONSE, NEURO_STATE messages</td></tr>
                                    <tr><td>5</td><td>src/kira/bridge/server.py</td><td>MODIFY</td><td>Add query_scene(), broadcast_neuro_state()</td></tr>
                                    <tr><td>6</td><td>src/kira/bridge/unity_templates.py</td><td>MODIFY</td><td>Add generate_scene_reader() → KiraSceneReader.cs</td></tr>
                                    <tr><td>7</td><td>src/kira/config.py</td><td>MODIFY</td><td>Add NEURO_DRIVE_* constants</td></tr>
                                    <tr><td>8</td><td>src/kira/db/schema.py</td><td>MODIFY</td><td>Add neuro_drive_log table</td></tr>
                                    <tr><td>9</td><td>src/kira/main.py</td><td>MODIFY</td><td>Wire IntentEngine, EnvironmentModel, NeuroDriveLoop</td></tr>
                                </tbody>
                            </table>

                            <h3>Step 1 — kira_state.py</h3>
                            <p>Internal state model + intent selection engine.</p>
                            <pre><code>{`@dataclass
class KiraState:
    curiosity: float = 0.0           # desire to explore unknowns (0-1)
    pressure: float = 0.0            # urgency from errors/instability (0-1)
    stability: float = 1.0           # confidence in environment (0-1)
    novelty_reward: float = 0.0      # dopamine from successful builds (0-1)
    environment_density: float = 0.0 # how "full" the world is (0-1)
    unfinished_nodes: int = 0        # incomplete objects/systems
    idle_ticks: int = 0              # consecutive ticks with no action
    last_action_time: float = 0.0
    timestamp: float = 0.0

class Intent(str, Enum):
    REPAIR = "repair"       # fix broken/incomplete things
    EXPAND = "expand"       # add new objects/systems/knowledge
    EXPERIMENT = "experiment"# try novel combinations
    OBSERVE = "observe"     # scan environment, learn

@dataclass
class IntentDecision:
    intent: Intent
    confidence: float
    reason: str
    target: str = ""
    metadata: dict

class IntentEngine:
    def select(self, state: KiraState) -> IntentDecision:
        """Deterministic: pressure > curiosity > novelty > observe."""

    def apply_idle_pressure(self, state: KiraState) -> KiraState:
        """Ramp pressure by IDLE_PRESSURE_RATE * idle_ticks."""

    def record_outcome(self, intent, success, state) -> KiraState:
        """Success: +novelty, +stability, -pressure, reset idle.
         Failure: +pressure, -stability, -novelty."""`}</code></pre>
                            <p>
                                Key: <code>select()</code> implements the user&apos;s spec — <code>pressure &gt; threshold → REPAIR</code>,
                                <code>curiosity &gt; threshold → EXPAND</code>, <code>novelty_reward &lt; min → EXPERIMENT</code>, else → <code>OBSERVE</code>.
                            </p>

                            <h3>Step 2 — environment_model.py</h3>
                            <p>Tracks world state. Dual-mode: Unity scene data when bridge connected, code/knowledge metrics as fallback.</p>
                            <pre><code>{`@dataclass
class SceneSnapshot:
    objects: list[dict]           # [{name, type, position, components...}]
    empty_areas: list[dict]       # [{center, radius, density}]
    light_map: dict               # {average_intensity, coherence}
    unfinished_assets: list[dict] # [{name, missing: [...]}]
    timestamp: float = 0.0

@dataclass
class EnvironmentFitness:
    spatial_density: float = 0.0
    lighting_coherence: float = 0.0
    structural_connectivity: float = 0.0
    novelty_index: float = 0.0
    instability_penalty: float = 0.0
    total: float = 0.0           # weighted sum

class EnvironmentModel:
    def __init__(self, memory, bridge=None)

    async def update(self):
        """Pull from Unity if bridge.shell_ready, else fallback."""

    def compute_fitness(self) -> EnvironmentFitness:
        """total = density*0.25 + lighting*0.2 + connectivity*0.25
                + novelty*0.2 - instability*0.1"""`}</code></pre>

                            <h3>Step 3 — neuro_drive_loop.py</h3>
                            <p>The main brain loop. Implements the same API as <code>PersistentWorkLoop</code> for GUI compatibility.</p>
                            <pre><code>{`class NeuroDriveLoop:
    # tick_interval = 30s (faster than PersistentWorkLoop's 45s)

    async def run(self):
        """Main loop: restore state → tick every 30s → persist."""

    async def _tick(self):
        """1. _update_kira_state()
         2. intent_engine.select(kira_state) → IntentDecision
         3. dispatch to _behavior_{repair|expand|experiment|observe}
         4. intent_engine.record_outcome(intent, success, kira_state)
         5. if !success: apply_idle_pressure()
         6. broadcast neuro_state to bridge"""

    async def _behavior_repair(self, decision) -> bool
    async def _behavior_expand(self, decision) -> bool
    async def _behavior_experiment(self, decision) -> bool
    async def _behavior_observe(self, decision) -> bool`}</code></pre>

                            <h3>Step 4 — protocol.py (MODIFY)</h3>
                            <p>Add 3 new message types to <code>MessageType</code> enum:</p>
                            <pre><code>{`SCENE_QUERY = "scene_query"         # Python → Unity
SCENE_RESPONSE = "scene_response"   # Unity → Python
NEURO_STATE = "neuro_state"         # Python → Unity: broadcast KiraState`}</code></pre>

                            <h3>Step 5 — server.py (MODIFY)</h3>
                            <pre><code>{`async def query_scene(self, query_type: str) -> dict | None:
    """Send SCENE_QUERY, await SCENE_RESPONSE with 10s timeout."""

async def broadcast_neuro_state(self, state_dict: dict):
    """Push KiraState to Unity for visualization."""`}</code></pre>

                            <h3>Step 6 — unity_templates.py (MODIFY)</h3>
                            <p>Add <code>generate_scene_reader()</code> → <code>KiraSceneReader.cs</code>:</p>
                            <p>
                                <code>GetSceneObjects()</code>, <code>GetEmptyAreas()</code>, <code>GetLightMap()</code>, <code>GetUnfinishedAssets()</code>.
                                Route SCENE_QUERY messages from KiraBridge to KiraSceneReader, send SCENE_RESPONSE back.
                            </p>

                            <h3>Step 7 — config.py (MODIFY)</h3>
                            <pre><code>{`NEURO_DRIVE_ENABLED = True
NEURO_DRIVE_TICK_INTERVAL = 30.0
NEURO_DRIVE_PRESSURE_THRESHOLD = 0.5
NEURO_DRIVE_CURIOSITY_THRESHOLD = 0.4
NEURO_DRIVE_NOVELTY_MIN = 0.2
NEURO_DRIVE_IDLE_PRESSURE_RATE = 0.05`}</code></pre>

                            <h3>Step 8 — schema.py (MODIFY)</h3>
                            <pre><code>{`CREATE TABLE IF NOT EXISTS neuro_drive_log (
    id          TEXT PRIMARY KEY,
    tick        INTEGER NOT NULL,
    intent      TEXT NOT NULL,
    confidence  REAL,
    success     INTEGER DEFAULT 0,
    kira_state  TEXT,
    fitness     REAL,
    duration_ms INTEGER,
    created     INTEGER NOT NULL
);`}</code></pre>

                            <h3>Step 9 — main.py (MODIFY)</h3>
                            <p>Wire <code>IntentEngine</code>, <code>EnvironmentModel</code>, <code>NeuroDriveLoop</code>. Feature-flag swap with <code>PersistentWorkLoop</code>.</p>
                            <pre><code>{`if NEURO_DRIVE_ENABLED:
    active_loop = components["neuro_drive"]
    gui.terminal_write("Neuro-drive online", "ok")
else:
    active_loop = work_loop
    gui.terminal_write("Starting autonomous learning loop...", "ok")

drive_task = asyncio.create_task(active_loop.run())`}</code></pre>

                            <h3>Data Flow Per Tick</h3>
                            <div className="rh-data-flow">
                                <span className="node">MotivationEngine.update()</span>{'           '}<span className="node">EnvironmentModel.update()</span>{'\n'}
                                {'  │ '}<span className="field">curiosity_level</span>{'                    │ '}<span className="field">fitness, density, unfinished</span>{'\n'}
                                {'  │ '}<span className="field">pressure_level</span>{'                     │\n'}
                                {'  └──────────── '}<span className="label">merge</span>{' ─────────────────┘\n'}
                                {'                  │\n'}
                                {'                  ▼\n'}
                                {'             '}<span className="node">KiraState</span>{'\n'}
                                {'  ('}<span className="field">curiosity, pressure, stability, novelty_reward,</span>{'\n'}
                                {'   '}<span className="field">environment_density, unfinished_nodes, idle_ticks</span>{')\n'}
                                {'                  │\n'}
                                {'                  ▼\n'}
                                {'         '}<span className="node">IntentEngine.select()</span>{'\n'}
                                {'                  │\n'}
                                {'                  ▼\n'}
                                {'           '}<span className="decision">IntentDecision</span>{'\n'}
                                {'    ('}<span className="decision">REPAIR</span>{' | '}<span className="decision">EXPAND</span>{' | '}<span className="decision">EXPERIMENT</span>{' | '}<span className="decision">OBSERVE</span>{')\n'}
                                {'                  │\n'}
                                {'                  ▼\n'}
                                {'         '}<span className="label">Behavior Handler</span>{'\n'}
                                {'    ('}<span className="field">TaskGen+Executor | Bridge | LLM | Researcher</span>{')\n'}
                                {'                  │\n'}
                                {'                  ▼\n'}
                                {'          '}<span className="decision">Outcome (bool)</span>{'\n'}
                                {'                  │\n'}
                                {'                  ▼\n'}
                                {'    '}<span className="node">IntentEngine.record_outcome()</span>{'\n'}
                                {'    → '}<span className="field">Updated KiraState</span>{'\n'}
                                {'    → '}<span className="field">Broadcast to Unity bridge</span>
                            </div>
                        </div>

                        <div className="rh-post-footer">
                            <button className="rh-post-action">
                                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                12
                            </button>
                            <button className="rh-post-action">
                                <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" /></svg>
                                3
                            </button>
                            <button className="rh-post-action">
                                <svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                                SHARE
                            </button>
                            <button className="rh-post-action" style={{ marginLeft: "auto" }}>
                                <svg viewBox="0 0 24 24"><path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" /></svg>
                                BOOKMARK
                            </button>
                        </div>
                    </article>
                </section>

                {/* Right Sidebar */}
                <aside className="rh-sidebar-right">
                    <div className="rh-sidebar-section">
                        <h4 className="rh-sidebar-title">Recent Activity</h4>
                        <div className="rh-activity-item">
                            <span className="rh-activity-dot" style={{ background: "#00aaff" }} />
                            <div>
                                <span className="rh-activity-text">EARE — EXOKIN Autonomous Regulation Engine</span>
                                <span className="rh-activity-time">JUST NOW</span>
                            </div>
                        </div>
                        <div className="rh-activity-item">
                            <span className="rh-activity-dot" style={{ background: "#00aaff" }} />
                            <div>
                                <span className="rh-activity-text">EURO-DRIVE spec published</span>
                                <span className="rh-activity-time">2 MIN AGO</span>
                            </div>
                        </div>
                        <div className="rh-activity-item">
                            <span className="rh-activity-dot" style={{ background: "#7b5cff" }} />
                            <div>
                                <span className="rh-activity-text">ARIA generator v2 deployed</span>
                                <span className="rh-activity-time">34 MIN AGO</span>
                            </div>
                        </div>
                        <div className="rh-activity-item">
                            <span className="rh-activity-dot" style={{ background: "#00e5ff" }} />
                            <div>
                                <span className="rh-activity-text">Broker booth geometry added</span>
                                <span className="rh-activity-time">1 HR AGO</span>
                            </div>
                        </div>
                        <div className="rh-activity-item">
                            <span className="rh-activity-dot" style={{ background: "#ff6f3c" }} />
                            <div>
                                <span className="rh-activity-text">Avatar humanization complete</span>
                                <span className="rh-activity-time">3 HRS AGO</span>
                            </div>
                        </div>
                    </div>

                    <div className="rh-sidebar-section">
                        <h4 className="rh-sidebar-title">System Tags</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {["EARE", "EXOKIN", "NeuroDriveLoop", "KiraState", "IntentEngine", "EnvironmentModel", "Unity Bridge", "PersistentWorkLoop", "MotivationEngine", "TaskGenerator"].map((tag) => (
                                <span className="rh-post-tag" key={tag}>{tag}</span>
                            ))}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

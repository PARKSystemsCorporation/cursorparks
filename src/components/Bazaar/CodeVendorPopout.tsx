"use client";

import React, { useState, useCallback } from "react";

const KIRA_SPEC = `KIRA — Local Autonomous Coding Agent — Full Specification
Overview
KIRA is a fully local, free, autonomous coding agent and IDE (like Cursor but local). It runs on Windows, uses Ollama for LLM inference, SQLite for persistent memory, and has a tkinter-based Cursor-style GUI. KIRA can read/write files, execute commands, run tests, deploy to GitHub, browse the web, learn from code pasted in chat, and improve its own codebase.

Project directory: c:\\parks\\rnd\\localkira\\kira-local
Python version: 3.11+
Current version: v1.2.0
All 49 tests passing

Project Structure

kira-local/
├── pyproject.toml
├── requirements.txt
├── data/                          # Runtime (gitignored)
│   └── kira.db                    # SQLite database (created at runtime)
├── workspace/                     # KIRA's own coding sandbox (git-initialized)
├── src/
│   └── kira/
│       ├── __init__.py
│       ├── config.py              # Env vars, paths, constants, safety lists
│       ├── main.py                # Entry point — wires GUI + agent loop
│       ├── db/
│       │   ├── __init__.py
│       │   ├── connection.py      # DatabaseManager — SQLite + sqlite-vec
│       │   ├── schema.py          # SchemaManager — all CREATE TABLE statements
│       │   └── queries.py         # CRUD helpers for each table
│       ├── memory/
│       │   ├── __init__.py
│       │   ├── store.py           # MemoryStore — unified memory interface
│       │   ├── retrieval.py       # MemoryRetriever — hybrid vector+FTS search
│       │   ├── embeddings.py      # EmbeddingPipeline — Ollama embed API
│       │   ├── vector_store.py    # VectorStore — sqlite-vec KNN search
│       │   └── wordpairs.py       # WordPairMemory — 3-tier associative memory
│       ├── llm/
│       │   ├── __init__.py
│       │   ├── ollama_client.py   # OllamaClient — chat, stream, embed
│       │   └── prompts.py         # System prompts, prompt builders
│       ├── tools/
│       │   ├── __init__.py
│       │   ├── file_ops.py        # FileOps — sandboxed read/write/list/delete
│       │   ├── terminal.py        # TerminalTool — command execution with blocklist
│       │   ├── git_ops.py         # GitOps — snapshot, rollback, deploy to GitHub
│       │   ├── test_runner.py     # TestRunner — pytest/npm auto-detection
│       │   ├── web.py             # WebBrowser — fetch URLs, DuckDuckGo search
│       │   └── registry.py        # ToolRegistry — tool discovery + execution
│       ├── agent/
│       │   ├── __init__.py
│       │   ├── loop.py            # AgentLoop — fast response path, streaming
│       │   ├── planner.py         # AgentPlanner — intent classification
│       │   └── context.py         # ContextGatherer — project snapshot
│       ├── self_improve.py        # SelfImprover — analyze/patch/test/rollback
│       └── gui/
│           ├── __init__.py
│           ├── terminal.py        # KiraTerminal — Cursor-style IDE GUI
│           └── theme.py           # COLORS, FONTS, CHAT_TAGS, SYNTAX_PATTERNS
└── tests/
    ├── __init__.py
    ├── conftest.py                # Fixtures (temp DB, mocks)
    ├── test_db.py                 # 6 tests
    ├── test_memory.py             # 16 tests
    ├── test_tools.py              # 9 tests
    ├── test_agent.py              # 5 tests
    ├── test_self_improve.py       # 7 tests
    └── test_integration.py        # 3 tests + 3 more
Dependencies

httpx>=0.27.0           # Async HTTP for Ollama API + web browsing
sqlite-vec>=0.1.6       # Vector search in SQLite
numpy>=1.26.0           # Vector math
python-dotenv>=1.0.0    # .env loading
pytest>=8.0.0           # Testing
pytest-asyncio>=0.23.0  # Async test support
tkinter is bundled with Python on Windows. No external GUI library needed.

System prerequisites:

Ollama running locally (ollama serve)
Models: llama3:latest (or any Ollama model)
GitHub CLI (gh) for deploy feature
Configuration (config.py)
Constant	Default	Description
OLLAMA_HOST	http://localhost:11434	Ollama API URL
OLLAMA_MODEL	llama3:latest	Chat model
OLLAMA_EMBED_MODEL	llama3:latest	Embedding model
EMBEDDING_DIMENSIONS	768	Vector size
MAX_IMPROVE_ITERATIONS	3	Max self-improve cycles per run
AGENT_TICK_INTERVAL	10.0	Seconds between idle loop ticks
TEMPERATURE	0.7	LLM temperature
MAX_TOKENS	2048	LLM max output tokens
MAX_CONTEXT_MESSAGES	20	Max conversation history for prompts
TERMINAL_TIMEOUT	60	Seconds before command timeout
PROTECTED_FILES	main.py, loop.py, config.py	Cannot be self-modified
BLOCKED_COMMANDS	rm -rf /, format c:, ...	Refused by terminal tool
Database Schema (SQLite + sqlite-vec)
Single file: data/kira.db, WAL mode, foreign keys enabled.

conversations

CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    metadata TEXT  -- JSON
);
knowledge_blocks

CREATE TABLE knowledge_blocks (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    category TEXT NOT NULL,  -- 'fact','pattern','code_learned','web_learned','conversation_insight','code_insight'
    importance REAL NOT NULL DEFAULT 0.5,
    source_id TEXT,
    tags TEXT,  -- JSON array
    access_count INTEGER DEFAULT 0,
    created INTEGER NOT NULL,
    updated INTEGER NOT NULL
);
-- FTS5 search: knowledge_fts(content, category, tags)
improvement_log

CREATE TABLE improvement_log (
    id TEXT PRIMARY KEY,
    target_file TEXT NOT NULL,
    description TEXT NOT NULL,
    diff_before TEXT,
    diff_after TEXT,
    status TEXT NOT NULL CHECK(status IN ('proposed','applied','validated','rolled_back','failed')),
    test_result TEXT,
    git_commit_before TEXT,
    git_commit_after TEXT,
    iteration INTEGER NOT NULL,
    created INTEGER NOT NULL
);
failures

CREATE TABLE failures (
    id TEXT PRIMARY KEY,
    error_type TEXT NOT NULL,
    error_msg TEXT NOT NULL,
    context TEXT,
    file_path TEXT,
    traceback TEXT,
    resolved INTEGER DEFAULT 0,
    resolution TEXT,
    created INTEGER NOT NULL
);
Word-pair memory (3 tiers — same schema)

CREATE TABLE short/medium/long_term (
    id TEXT PRIMARY KEY,
    pk TEXT UNIQUE,      -- "word1|word2" pair key
    w1 TEXT, w2 TEXT,    -- the two words
    p1 TEXT, p2 TEXT,    -- POS tags (noun/verb/adj/other)
    rel TEXT,            -- relationship type
    sent TEXT,           -- source sentence
    score REAL,          -- association strength
    reinf INTEGER,       -- reinforcement count
    created INTEGER,
    updated INTEGER
);
-- Indexed on w1, w2 for each table
Vector table

CREATE VIRTUAL TABLE vec_knowledge USING vec0(embedding float[768]);
CREATE TABLE vec_map (vec_rowid INTEGER PRIMARY KEY, knowledge_id TEXT NOT NULL UNIQUE, created INTEGER NOT NULL);
Agent state

CREATE TABLE agent_state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL);
Module Specs
1. LLM Client (llm/ollama_client.py)
Class: OllamaClient

chat(messages, temperature, max_tokens) → str — single completion
stream_chat(messages, temperature, max_tokens) → AsyncGenerator[str] — token-by-token streaming via Ollama /api/chat with stream: true
embed(text) → list[float] — 768-dim embedding. Falls back to SHA512 hash-based pseudo-embeddings if embed model unavailable
embed_batch(texts) → list[list[float]]
list_models() → list[str]
is_available() → bool
_resolve_model() → str — tries configured model, base name variants, then first available
Uses httpx.AsyncClient, 120s timeout
2. Prompts (llm/prompts.py)
System prompt: KIRA personality — direct, technical, concise, 1-3 sentences. Explains actions. Commits before changes, rolls back on failure.

Prompt builders:

build_chat_prompt(message, memory_context, history) → messages list
build_analysis_prompt(file_content, file_path, codebase_summary) → messages list
build_improvement_prompt(weakness_desc, current_code, file_path) → messages list
build_tool_decision_prompt(message, available_tools, context) → messages list
3. Memory Store (memory/store.py)
Class: MemoryStore — unified interface for all memory operations.

add_conversation(role, content, session_id, metadata) → id
add_knowledge(content, category, importance, source_id, tags) → id — also generates and stores embedding
add_failure(error_type, error_msg, context, file_path, traceback_str) → id
log_improvement(target_file, description, status, iteration, **kwargs) → id
get_recent_conversations(limit, session_id) → list
get_improvement_history(limit) → list
get_unresolved_failures(limit) → list
get_stats() → dict — counts for knowledge, conversations, improvements, failures, vectors
4. Memory Retrieval (memory/retrieval.py)
Class: MemoryRetriever — hybrid search combining vector KNN + FTS keyword search.

retrieve(query, k=10) → {results, context_string, total}
Deduplicates results, ranks by score, builds context string for LLM injection
Increments access count on retrieved items
5. Word-Pair Memory (memory/wordpairs.py)
Class: WordPairMemory — lightweight 3-tier associative memory (ported from kiramolt JS).

process(text) → {added, reinforced} — tokenize, extract pairs in 5-word window, score by POS category + proximity, store/reinforce in tiers
context(text, max_pairs=12) → str — instant memory context string (~30ms)
search(word, limit=10) → list[dict] — find pairs containing a word
stats() → {short, medium, long_term, total}
Tier thresholds: score >= 0.65 → long_term, >= 0.25 → medium, else → short
Scoring: noun+noun=0.3, adj=0.2, other=0.1, plus proximity bonus (0.1-0.4)
Tokenization: Stop-word filtering, suffix-based POS heuristics (no external NLP)
6. Vector Store (memory/vector_store.py)
Class: VectorStore — sqlite-vec KNN search.

store(knowledge_id, embedding) → vec_rowid
search_similar(query_embedding, k) → list[{knowledge_id, distance, vec_rowid}]
delete(knowledge_id), count()
7. Embedding Pipeline (memory/embeddings.py)
Class: EmbeddingPipeline

embed(text) → list[float] — calls Ollama embed, pads/truncates to 768-dim
embed_batch(texts) → list[list[float]]
8. File Operations (tools/file_ops.py)
Class: FileOps — sandboxed file R/W.

read(path) → str
write(path, content) → str — creates parent directories
list_dir(path, pattern) → list[str] — glob pattern support
list_tree(path, max_depth=3) → str — ASCII tree view
exists(path) → bool
delete(path) → str — files only
Sandbox: All paths validated against allowed_dirs list
9. Terminal (tools/terminal.py)
Class: TerminalTool — command execution.

run(command) → {returncode, stdout, stderr, success, command} — async subprocess
run_sync(command) → same — blocking version
Safety: Blocked commands list, 60s timeout, cwd locked to workspace
10. Git Operations (tools/git_ops.py)
Class: GitOps

init() — ensure git repo initialized
snapshot(message) — git add -A && git commit
get_current_hash() → str
rollback(commit_hash) — git reset --hard
diff(file_path) → str
log(n) → str
status() → str
set_remote(url)
push(branch="main")
deploy_to_github(repo_name) — creates repo via gh CLI + pushes
11. Test Runner (tools/test_runner.py)
Class: TestRunner

run(target=None) → TestResult — auto-detects pytest or npm
run_specific(target) → TestResult
TestResult: {passed, output, failures, total, failed_count, error_count}
Parses pytest output for pass/fail counts
12. Web Browser (tools/web.py)
Class: WebBrowser

fetch(url, max_chars=8000) → {success, url, title, content, error}
search(query, max_results=5) → list[{title, url, snippet}] — DuckDuckGo HTML scraping
HTML-to-text extraction: strips tags, decodes entities, collapses whitespace
No API keys needed
13. Tool Registry (tools/registry.py)
Class: ToolRegistry — central hub for all tools.

Registered tools: read_file, write_file, list_dir, run_command, git_snapshot, git_status, git_deploy, run_tests, web_fetch, web_search
execute(tool_name, **kwargs) → ToolResult
list_tools() → list[ToolInfo]
get_tools_for_prompt() → list[dict] — for LLM tool descriptions
14. Agent Loop (agent/loop.py)
Class: AgentLoop — fast response path inspired by leanmolt.

Fast chat path (normal messages):

Store user message (instant)
Word-pair memory context (~30ms, no LLM)
Last 8 conversations from DB (instant)
Single streaming LLM call — NO planner LLM call, NO context gathering, NO vector retrieval
Store response + learn word pairs (post-response)
Extract knowledge in background
Slash command path:

Pure regex detection, zero latency → direct tool execution
Commands: /improve, /test, /deploy X, /status, /browse URL, /search Q, /upgrade-ide, /memory, /stats
Callbacks:

set_output_callback(fn) — chat output
set_thought_callback(fn) — internal thoughts
set_stream_callbacks(on_start, on_token, on_end) — token streaming
set_status_callback(fn) — task bar status updates
Knowledge extraction: Detects code in user messages (\`\`\` / def / class) and stores as code_learned knowledge.

15. Agent Planner (agent/planner.py)
Class: AgentPlanner — intent classification (used by self-improvement, not fast path).

plan(message, context, memory) → Action — slash command regex + LLM fallback
plan_autonomous(context, memory) → Action | None — currently returns None
Action types: respond, tool, improve, improve_ide, run_tests, show_stats
16. Context Gatherer (agent/context.py)
Class: ContextGatherer — builds project snapshot (used by self-improvement).

gather() → ProjectContext — directory tree, file count, git status, memory stats, recent improvements, summary string
17. Self-Improver (self_improve.py)
Class: SelfImprover — safe self-modification loop.

Cycle (up to 3 iterations):

Read all .py files from src/kira/
LLM analyzes for weaknesses (JSON array of issues)
Filter out protected files + previously failed fixes
Prioritize by severity (high > medium > low)
Git snapshot BEFORE modification
LLM generates improved code
Apply patch to file
Run tests
If pass → commit, log as "validated"
If fail → rollback to pre-snapshot commit, log as "rolled_back", store failure
Safety:

Protected files cannot be modified (main.py, loop.py, config.py)
GUI files ARE modifiable (KIRA can upgrade its own IDE)
Mandatory git commit before every modification
Automatic rollback on test failure
Failed improvements logged to avoid repeating
18. GUI (gui/terminal.py)
Class: KiraTerminal — Cursor-style IDE with tkinter.

Layout:

Top task bar: KIRA branding, live status dot (green=idle, yellow=busy, red=error), status text, quick action buttons (Test, Improve, Stats, Bugs)
Left sidebar: File explorer (Treeview, lazy-load, file type icons)
Center top: Code editor with tab bar, line numbers, Python syntax highlighting (debounced 300ms), scrollbar sync
Center bottom: Terminal output panel (color-coded: cmd, err, ok)
Right panel: Chat panel with input box, Send button, streaming support
Bottom status bar: Ollama status, model name, memory count, word-pair count, current file
Class: BugLogWindow — popup window for viewing failures.

Shows: timestamp, error type, message, context, truncated traceback
Refresh and Clear All buttons
Bug count badge in task bar
Streaming support:

on_stream_start() — shows "[KIRA]" label, disables send
on_stream_token(token) — appends token to chat
on_stream_end() — re-enables send
Features:

Dark theme (Catppuccin Mocha inspired)
File type icons (py, json, md, html, css, js, ts, etc.)
Enter to send, Shift+Enter for newline
Auto-scroll, scroll-lock on manual scroll-up
Thread-safe callbacks (all GUI updates via root.after())
Non-blocking: GUI in main thread, agent in asyncio thread
19. Theme (gui/theme.py)
COLORS: 40+ colors — base backgrounds, text, accents, syntax highlighting, chat colors, UI elements
FONTS: Consolas for code/chat, Segoe UI for UI elements
CHAT_TAGS: Formatting for user, kira, thought, error, system, tool messages
SYNTAX_PATTERNS: Python regex patterns for keywords, builtins, strings, comments, decorators, numbers, functions
Architecture Flow

User types message
    ↓
GUI (_on_send) → asyncio.run_coroutine_threadsafe → agent_loop.submit_message()
    ↓
AgentLoop.process_message():
    ├── Slash command? → regex match → _execute_action() → tool result → stream response
    └── Normal message? → FAST PATH:
            1. word_pairs.process(msg)        # ~5ms
            2. word_pairs.context(msg)        # ~25ms
            3. memory.get_recent(8)           # ~1ms
            4. build_chat_prompt()            # ~0ms
            5. llm.stream_chat()              # tokens appear immediately
            6. memory.add_conversation()      # post-response
            7. word_pairs.process(response)   # post-response
            8. _extract_knowledge()           # post-response
    ↓
Streaming tokens → on_stream_token() → GUI chat panel (real-time)
Threading Model
Main thread: tkinter GUI event loop (gui.run() → root.mainloop())
Agent thread: asyncio event loop in daemon thread
Communication: asyncio.run_coroutine_threadsafe() for GUI→agent, root.after() for agent→GUI
Thread-safe: all GUI updates go through root.after(0, callback)
Entry Point (main.py)

def main():
    agent_loop, gui, git, llm, memory, wordpairs = build_agent()
    async_loop = asyncio.new_event_loop()
    gui.connect_agent(agent_loop, async_loop, memory_store=memory)
    # Start agent in background thread
    agent_thread = threading.Thread(target=run_async_loop, ..., daemon=True)
    agent_thread.start()
    gui.run()  # Blocks until window closes
Slash Commands
Command	Action	Description
/improve	Self-improvement cycle	Analyzes own code, patches, tests
/upgrade-ide	IDE self-upgrade	Same cycle but focused on GUI
/test	Run test suite	Auto-detects pytest/npm
/deploy X	Deploy to GitHub	Creates repo X via gh CLI + push
/status	Git status	Shows workspace git state
/search Q	Web search	DuckDuckGo results
/browse URL	Fetch web page	Extracts text content
/memory or /stats	Memory stats	Knowledge blocks, pairs, failures
Safety Constraints
Protected files: main.py, loop.py, config.py — cannot be self-modified
Sandbox: File operations restricted to WORKSPACE_DIR and SRC_DIR
Blocked commands: rm -rf /, format c:, del /f /s /q, mkfs, dd if=, fork bombs, shutdown, restart
Git before modify: Mandatory snapshot before any self-improvement patch
Auto-rollback: Failed tests after self-modification trigger git reset --hard
Failure memory: Failed improvements logged to prevent repeating the same mistake
Max iterations: 3 per self-improvement cycle
Terminal timeout: 60 seconds per command
Test Suite (49 tests, all passing)
test_db.py (6): Connection, execute, schema creation, FTS
test_memory.py (16): Conversations, knowledge, improvements, failures, state, store, retrieval
test_tools.py (9): File ops (read/write/sandbox/list/delete), terminal (run/blocked/sync)
test_agent.py (5): Planner commands, LLM fallback, process_message
test_self_improve.py (7): Protected files, prioritize, parse weaknesses, run cycle, rollback
test_integration.py (6): Conversation-to-knowledge, improvement lifecycle, FTS roundtrip`;

export default function CodeVendorPopout({ onClose }: { onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(KIRA_SPEC);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const ta = document.createElement("textarea");
            ta.value = KIRA_SPEC;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, []);

    return (
        <div className="code-vendor-popout-backdrop" onClick={onClose}>
            <div
                className="code-vendor-popout"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title bar mimicking a .txt file window */}
                <div className="code-vendor-titlebar">
                    <div className="code-vendor-titlebar-icon">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="#00ff9d" strokeWidth="1.2" />
                            <path d="M5 5h6M5 8h6M5 11h4" stroke="#00ff9d" strokeWidth="0.8" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="code-vendor-titlebar-text">KIRA_SPEC.txt</span>
                    <span className="code-vendor-titlebar-badge">FREE</span>
                    <div className="code-vendor-titlebar-actions">
                        <button
                            className={`code-vendor-copy-btn ${copied ? "copied" : ""}`}
                            onClick={handleCopy}
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M3 8.5l3 3 7-7" stroke="#00ff9d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    COPIED
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                    COPY
                                </>
                            )}
                        </button>
                        <button
                            className="code-vendor-close-btn"
                            onClick={onClose}
                            title="Close"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* File content area */}
                <pre className="code-vendor-content">{KIRA_SPEC}</pre>
            </div>
        </div>
    );
}

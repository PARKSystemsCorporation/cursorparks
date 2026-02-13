const http = require("http");
const next = require("next");
const { Server } = require("socket.io");
const Database = require("better-sqlite3");
const path = require("path");
const { execSync } = require("child_process");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Initialize SQLite for Bazaar (sync, fast)
const dbPath = path.join(process.cwd(), "bazaar.db");
const db = new Database(dbPath);

// Create messages table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);

const insertMessage = db.prepare("INSERT INTO messages (content, x, y, z, timestamp) VALUES (?, ?, ?, ?, ?)");
const getRecentMessages = db.prepare("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50");
const pruneMessages = db.prepare("DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY timestamp DESC LIMIT 50)");

// Bazaar enter/set-password API (uses server/db + server/schema)
const { initSchema: initBazaarSchema } = require("./server/db");
const { enter: enterHandler, setPassword: setPasswordHandler } = require("./server/routes/enter");
const exokinRoutes = require("./server/routes/exokin");
initBazaarSchema();

let isReady = false;

function serveExokinApi(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname || req.url?.split("?")[0] || "";
  const isCreature = pathname === "/api/exokin/creature";
  const isChat = pathname === "/api/exokin/chat";
  if (!isCreature && !isChat) return false;

  const creatureId = parsedUrl.searchParams?.get("id") || parsedUrl.searchParams?.get("creatureId") || null;

  const sendJson = (status, obj) => {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(status);
    res.end(JSON.stringify(obj));
  };
  res.status = (code) => ({ json: (obj) => sendJson(code, obj) });

  if (req.method === "GET" && isCreature) {
    exokinRoutes.handleGetCreature(req, res, creatureId);
    return true;
  }
  if (req.method === "GET" && isChat) {
    exokinRoutes.handleGetChat(req, res, creatureId);
    return true;
  }
  if (req.method === "POST") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      let body = {};
      try {
        const raw = Buffer.concat(chunks).toString();
        if (raw) body = JSON.parse(raw);
      } catch (_) {}
      if (isCreature) exokinRoutes.handlePostCreature(req, res, body);
      else if (isChat) exokinRoutes.handlePostChat(req, res, body);
    });
    return true;
  }
  sendJson(405, { error: "Method not allowed" });
  return true;
}

function serveBazaarEnterApi(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname || req.url?.split("?")[0] || "";
  const isEnter = pathname === "/enter";
  const isSetPassword = pathname === "/set-password";
  if (req.method !== "POST" || (!isEnter && !isSetPassword)) return false;

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    let body = {};
    try {
      const raw = Buffer.concat(chunks).toString();
      if (raw) body = JSON.parse(raw);
    } catch (_) {}
    const fakeReq = { body };
    let statusCode = 200;
    const origWriteHead = res.writeHead.bind(res);
    const origEnd = res.end.bind(res);
    res.status = (code) => {
      statusCode = code;
      return res;
    };
    res.json = (obj) => {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(JSON.stringify(obj));
    };
    if (isEnter) enterHandler(fakeReq, res);
    else setPasswordHandler(fakeReq, res);
  });
  return true;
}

const server = http.createServer((req, res) => {
  if (!isReady) {
    res.writeHead(200);
    res.end("OK");
    return;
  }
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (serveExokinApi(req, res, parsedUrl)) return;
  if (serveBazaarEnterApi(req, res, parsedUrl)) return;
  handle(req, res);
});

// Listen immediately so the platform doesn't SIGTERM for slow startup
server.listen(PORT, () => {
  console.log(`> Listening on http://localhost:${PORT} (warming up...)`);
});

async function bootstrap() {
  if (process.env.SKIP_DB_PUSH !== "1") {
    try {
      execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", timeout: 60000 });
    } catch (err) {
      console.error("prisma db push failed:", err.message);
      if (process.env.NODE_ENV === "production") process.exit(1);
      console.warn("Continuing in dev (DB may be out of sync)");
    }
  }
  await app.prepare();
  isReady = true;
  console.log(`> Ready on http://localhost:${PORT}`);
}

const io = new Server(server, {
    path: "/socket",
    cors: { origin: "*" },
    perMessageDeflate: true
  });

  const { setIO } = require("./src/server/socket.js");
  const crypto = require("crypto");
  const { prisma } = require("./src/server/db.js");
  const { getEngine } = require("./src/server/marketEngine");
  const npcBrain = require("./src/server/npcBrain.js");
  setIO(io);

  npcBrain.initNpcBrain({ clearSession: false });

  setInterval(() => {
    npcBrain.runMinimalTick(io, onlineCount);
  }, 3000);

  let onlineCount = 0;
  let totalVisitors = 0;
  let messageCount = 0; // Optimization: Prune counter
  const engine = getEngine();

  engine.on("tick", (snapshot) => {
    io.emit("market:tick", snapshot);
  });

  const upgradeCache = new Map();
  async function getUserFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/ps_session=([^;]+)/);
    if (!match) return null;
    const token = match[1];
    const secret = process.env.SESSION_SECRET || "dev-secret";
    const tokenHash = crypto.createHash("sha256").update(token + secret).digest("hex");
    const session = await prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: true }
    });
    return session?.user || null;
  }

  async function getRiskProfile(userId) {
    if (!userId) return { maxSize: 100, slippageBoost: 1.2 };
    const cached = upgradeCache.get(userId);
    if (cached && cached.expires > Date.now()) return cached.value;
    const upgrades = await prisma.userUpgrade.findMany({
      where: { userId },
      include: { upgrade: true }
    });
    const lotsLevel = upgrades.find((u) => u.upgrade.key === "attr_lots")?.level || 0;
    const riskLevel = upgrades.find((u) => u.upgrade.key === "bot_risk")?.level || 0;
    const maxSize = 100 + lotsLevel * 50 + riskLevel * 50;
    const slippageBoost = Math.max(0.7, 1 - riskLevel * 0.05);
    const value = { maxSize, slippageBoost };
    upgradeCache.set(userId, { value, expires: Date.now() + 30_000 });
    return value;
  }

  io.on("connection", async (socket) => {
    onlineCount += 1;
    totalVisitors += 1;
    engine.online.retail = onlineCount;

    // Send FULL snapshot on connect
    socket.emit("market:snapshot", engine.getSnapshot());
    io.emit("presence:update", { online: onlineCount, total: totalVisitors });

    // Bazaar Init
    const recent = getRecentMessages.all();
    socket.emit("bazaar:init", { messages: recent });

    const assignUserRoom = (user) => {
      const userId = user?.id;
      const previousUserId = socket.data.userId;
      if (previousUserId && previousUserId !== userId) {
        socket.leave(`user:${previousUserId}`);
      }

      // Cache user on socket to avoid DB hits
      socket.data.user = user || null;
      socket.data.userId = userId || null;

      if (userId) socket.join(`user:${userId}`);
    };

    // Initial auth check
    const user = await getUserFromCookie(socket.handshake.headers.cookie || "");
    assignUserRoom(user);

    socket.on("session:refresh", async () => {
      const refreshedUser = await getUserFromCookie(socket.handshake.headers.cookie || "");
      assignUserRoom(refreshedUser);
    });

    // Performance: ping for client latency (roundtrip ms)
    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb();
    });

    socket.on("trade:submit", async (payload) => {
      const { side, size } = payload || {};
      if (!side || !size || !Number.isFinite(size)) return;
      const risk = await getRiskProfile(socket.data.userId);
      if (size > risk.maxSize) {
        socket.emit("trade:reject", { reason: "size_limit", maxSize: risk.maxSize });
        return;
      }
      const res = engine.submitTrade({ side, size, slippageBoost: risk.slippageBoost });
      const tape = engine.tradeTape[engine.tradeTape.length - 1];
      if (tape) io.emit("trade:tape", tape);
      socket.emit("trade:fill", { side, size, fill: res.fill, price: res.price });
    });

    // Bazaar Events
    socket.on("npc:perceive", (data) => {
      if (data && data.npcId) {
        try {
          npcBrain.applyPerception({
            npcId: data.npcId,
            actionObserved: data.actionObserved || null,
            entitySeen: data.entitySeen || null,
            phraseHeard: data.phraseHeard || null,
          });
        } catch (err) {
          console.error("NPC perceive error:", err);
        }
      }
    });

    socket.on("bazaar:shout", (data) => {
      if (!data || !data.content) return;

      const msg = {
        content: data.content.slice(0, 140), // Length limit
        x: data.x || (Math.random() * 10 - 5),
        y: data.y || (Math.random() * 5 + 1),
        z: data.z || (Math.random() * 10 - 5),
        timestamp: Date.now()
      };

      try {
        const info = insertMessage.run(msg.content, msg.x, msg.y, msg.z, msg.timestamp);
        msg.id = info.lastInsertRowid;

        // Prune optimization: only every 10th message
        messageCount++;
        if (messageCount % 10 === 0) {
          pruneMessages.run();
        }

        io.emit("bazaar:shout", msg);
      } catch (err) {
        console.error("Bazaar DB Error:", err);
      }
    });

    socket.on("disconnect", () => {
      onlineCount = Math.max(0, onlineCount - 1);
      engine.online.retail = onlineCount;
      io.emit("presence:update", { online: onlineCount, total: totalVisitors });
    });
  });

  function shutdown() {
    console.log("Shutting down...");
    engine.stop();
    io.close();
    npcBrain.closeNpcBrain();
    server.close(() => {
      db.close(); // Close SQLite
      prisma.$disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 5000);
  }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});

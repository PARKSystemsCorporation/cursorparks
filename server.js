const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    path: "/socket",
    cors: { origin: "*" }
  });

  const { setIO } = require("./src/server/socket.js");
  const crypto = require("crypto");
  const { prisma } = require("./src/server/db.js");
  const { getEngine } = require("./src/server/marketEngine");
  setIO(io);

  let onlineCount = 0;
  let totalVisitors = 0;
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
    socket.emit("market:snapshot", engine.getSnapshot());
    io.emit("presence:update", { online: onlineCount, total: totalVisitors });

    const user = await getUserFromCookie(socket.handshake.headers.cookie || "");
    socket.data.userId = user?.id || null;

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

    socket.on("disconnect", () => {
      onlineCount = Math.max(0, onlineCount - 1);
      engine.online.retail = onlineCount;
      io.emit("presence:update", { online: onlineCount, total: totalVisitors });
    });
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });

  function shutdown() {
    console.log("Shutting down...");
    engine.stop();
    io.close();
    server.close(() => {
      prisma.$disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 5000);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});

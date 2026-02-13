"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { getDb, initSchema } = require("../db");

initSchema(getDb());
const db = getDb();
const insert = db.prepare("INSERT OR IGNORE INTO codes (code, currency_value) VALUES (?, ?)");
insert.run("TEST-CODE-100", 100);
insert.run("GUMROAD-DEMO", 500);
console.log("Seeded codes: TEST-CODE-100 (100), GUMROAD-DEMO (500)");

import express from "express";
const app = express();
app.get("/health", (_req, res) => res.json({ ok: true, t: new Date().toISOString() }));
app.listen(8080, "0.0.0.0", () => console.log("mini up on 8080"));

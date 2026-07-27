import { randomUUID } from "crypto";
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.render("login");
});

router.post("/demo-login", (req, res) => {
  res.cookie("demoUserId", randomUUID(), { httpOnly: true, sameSite: "lax" });
  res.cookie("demoDisplayName", "Demo User", {
    httpOnly: true,
    sameSite: "lax",
  });
  res.redirect("/dashboard");
});

router.get("/dashboard", (req, res) => {
  const displayName = req.cookies?.demoDisplayName;
  if (!displayName) return res.redirect("/");
  res.render("dashboard", { displayName });
});

router.post("/logout", (req, res) => {
  res.clearCookie("demoUserId");
  res.clearCookie("demoDisplayName");
  res.redirect("/");
});

router.get("/voice-call", (req, res) => {
  if (!req.cookies?.demoUserId) return res.redirect("/");
  res.render("voice-call");
});

router.get("/video-call", (req, res) => {
  if (!req.cookies?.demoUserId) return res.redirect("/");
  res.render("video-call");
});

router.get("/meet", (req, res) => {
  if (!req.cookies?.demoUserId) return res.redirect("/");
  res.render("meet");
});

router.get("/chat", (req, res) => {
  if (!req.cookies?.demoUserId) return res.redirect("/");
  res.render("chat");
});

export default router;

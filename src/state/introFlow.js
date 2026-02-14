"use strict";

const ENTER_API = typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_BAZAAR_ENTER_API != null
  ? process.env.NEXT_PUBLIC_BAZAAR_ENTER_API
  : "";

const GUEST_SESSION_KEY = "parks_bazaar_guest_session";

export function getEnterApiBase() {
  return ENTER_API;
}

export function createGuestSessionId() {
  const id = "guest_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(GUEST_SESSION_KEY, id);
  } catch { }
  return id;
}

export function getGuestSessionId() {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage.getItem(GUEST_SESSION_KEY);
  } catch (_) { }
  return null;
}

export function isFirstTimeUser() {
  try {
    if (typeof localStorage === "undefined") return true;
    return !localStorage.getItem("parks_bazaar_intro_done");
  } catch {
    return true;
  }
}

export function markIntroDone() {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem("parks_bazaar_intro_done", "1");
  } catch (_) { }
}

export async function enterWithHandle(handle, password) {
  const base = getEnterApiBase();
  const url = base ? `${base.replace(/\/$/, "")}/enter` : "/enter";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: String(handle).trim(),
      password: password != null ? String(password) : "",
    }),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) { }
  if (!res.ok) {
    const msg = data.error || (res.status >= 500 ? "Server error. Try again." : `Enter failed (${res.status}).`);
    throw new Error(msg);
  }
  return data;
}

export async function setPasswordForHandle(handle, password) {
  const base = getEnterApiBase();
  const url = base ? `${base.replace(/\/$/, "")}/set-password` : "/set-password";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: String(handle).trim(),
      password: password != null ? String(password) : "",
    }),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) { }
  if (!res.ok) {
    const msg = data.error || (res.status === 404 ? "No account with that handle." : res.status >= 500 ? "Server error. Try again." : `Set password failed (${res.status}).`);
    throw new Error(msg);
  }
  return data;
}

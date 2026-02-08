// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Supabase Client (Shared)
// Single initialization. Imported by all pages.
// ════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ovkczouquovbozwizbtr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92a2N6b3VxdW92Ym96d2l6YnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NjE3MTAsImV4cCI6MjA3ODEzNzcxMH0.zVcVwFpfEC1oY7qC1MgkU3JwkkrQo_PVqyHfU2iYVv8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ───────────────────────────────────────
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function getProfile(userId) {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    return data;
}

export async function isPaidMember(userId) {
    const profile = await getProfile(userId);
    return profile?.is_paid || false;
}

// ── Shared escape helper ───────────────────────────────
export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Time formatting ────────────────────────────────────
export function timeAgo(timestamp) {
    if (!timestamp) return '--';
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
}

export function formatDate(timestamp) {
    if (!timestamp) return '--';
    const d = new Date(timestamp);
    return d.toISOString().split('T')[0];
}

export function formatDateShort(timestamp) {
    if (!timestamp) return '--';
    const d = new Date(timestamp);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

export function formatTimestamp(timestamp) {
    if (!timestamp) return '--';
    const d = new Date(timestamp);
    const date = d.toISOString().split('T')[0];
    const time = `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
    return `${date} · ${time} UTC`;
}
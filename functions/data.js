// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Data Fetcher
// All Supabase queries for build logs, builders, projects.
// Returns plain objects. No DOM manipulation here.
// ════════════════════════════════════════════════════════

import { supabase, getSession, getProfile } from './supabase-client.js';

// ── Fetch a single build log by ID ─────────────────────
// Returns: { log, builder, project, notes, metrics, siblings }
// `notes` will be null/empty if the user lacks member access (RLS enforced).
export async function fetchBuildLog(logId) {
    // 1. Get the build log itself
    const { data: log, error: logError } = await supabase
        .from('build_logs')
        .select('*')
        .eq('id', logId)
        .maybeSingle();

    if (logError || !log) return { error: logError?.message || 'Log not found' };

    // 2. Get the builder
    const { data: builder } = await supabase
        .from('builders')
        .select('*')
        .eq('id', log.builder_id)
        .maybeSingle();

    // 3. Get the project (if project_id exists on the log or builder)
    let project = null;
    const projectId = log.project_id || builder?.project_id;
    if (projectId) {
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .maybeSingle();
        project = data;
    }

    // 4. Get all logs for this project/builder (for the index + siblings)
    const { data: allLogs } = await supabase
        .from('build_logs')
        .select('id, title, status, created_at, log_index, is_public')
        .eq('builder_id', log.builder_id)
        .order('log_index', { ascending: true });

    // 5. Derive previous/next from index
    const logList = allLogs || [];
    const currentIdx = logList.findIndex(l => l.id === logId);
    const prevLog = currentIdx > 0 ? logList[currentIdx - 1] : null;
    const nextLog = currentIdx < logList.length - 1 ? logList[currentIdx + 1] : null;

    // 6. Attempt to fetch build_notes (RLS will block if not a member)
    let notes = [];
    const { data: notesData, error: notesError } = await supabase
        .from('build_notes')
        .select('*')
        .eq('build_log_id', logId)
        .order('created_at', { ascending: true });

    if (!notesError && notesData) {
        notes = notesData;
    }

    // 7. Get metrics for this log (safe — returns [] on failure)
    let metrics = [];
    try {
        const { data: metricsData, error: metricsErr } = await supabase
            .from('builder_metrics')
            .select('*')
            .eq('builder_id', log.builder_id);
        if (!metricsErr && metricsData) metrics = metricsData;
    } catch (e) {
        console.warn('builder_metrics not available, skipping');
    }

    // 8. Get the current auth state
    const session = await getSession();
    let isMember = false;
    if (session) {
        const profile = await getProfile(session.user.id);
        isMember = profile?.is_paid || false;
    }

    return {
        log,
        builder,
        project,
        notes,
        metrics,
        allLogs: logList,
        prevLog,
        nextLog,
        isMember,
        isAuthenticated: !!session,
    };
}

// ── Fetch a builder profile with all related data ──────
export async function fetchBuilderProfile(builderId) {
    const { data: builder, error } = await supabase
        .from('builders')
        .select('*')
        .eq('id', builderId)
        .maybeSingle();

    if (error || !builder) return { error: error?.message || 'Builder not found' };

    // Public logs
    const { data: publicLogs } = await supabase
        .from('build_logs')
        .select('*')
        .eq('builder_id', builderId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

    // Private notes (RLS enforced — returns [] if no access)
    let notes = [];
    try {
        const { data: notesData, error: notesErr } = await supabase
            .from('build_notes')
            .select('*')
            .eq('builder_id', builderId)
            .order('created_at', { ascending: false })
            .limit(20);
        if (!notesErr && notesData) notes = notesData;
    } catch (e) {
        console.warn('build_notes not available, skipping');
    }

    // Metrics (safe — returns [] if table empty/missing)
    let metrics = [];
    try {
        const { data: metricsData, error: metricsErr } = await supabase
            .from('builder_metrics')
            .select('*')
            .eq('builder_id', builderId);
        if (!metricsErr && metricsData) metrics = metricsData;
    } catch (e) {
        console.warn('builder_metrics not available, skipping');
    }

    // Modules (safe — returns [] if table empty/missing)
    let modules = [];
    try {
        const { data: modulesData, error: modulesErr } = await supabase
            .from('builder_modules')
            .select('*')
            .eq('builder_id', builderId)
            .order('name', { ascending: true });
        if (!modulesErr && modulesData) modules = modulesData;
    } catch (e) {
        console.warn('builder_modules not available, skipping');
    }

    // Flags (safe — returns [] if table empty/missing)
    let flags = [];
    try {
        const { data: flagsData, error: flagsErr } = await supabase
            .from('experimental_flags')
            .select('*')
            .eq('builder_id', builderId)
            .order('flag_name', { ascending: true });
        if (!flagsErr && flagsData) flags = flagsData;
    } catch (e) {
        console.warn('experimental_flags not available, skipping');
    }

    // Auth state
    const session = await getSession();
    let isMember = false;
    let isOwnProfile = false;
    if (session) {
        const profile = await getProfile(session.user.id);
        isMember = profile?.is_paid || false;
        isOwnProfile = builder.user_id === session.user.id;
    }

    return {
        builder,
        publicLogs: publicLogs || [],
        notes,
        metrics,
        modules,
        flags,
        isMember,
        isOwnProfile,
        isAuthenticated: !!session,
    };
}

// ── Fetch feed data (all builders with public logs) ────
export async function fetchFeed() {
    const { data: builders, error } = await supabase
        .from('builders')
        .select(`
            *,
            build_logs (
                id, log_type, message, title, created_at, is_public, status, log_index
            )
        `)
        .order('updated_at', { ascending: false });

    if (error || !builders) return { builders: [], error: error?.message };

    // Star counts
    const { data: starCounts } = await supabase
        .from('stars')
        .select('builder_id');

    const starMap = {};
    if (starCounts) {
        starCounts.forEach(s => {
            starMap[s.builder_id] = (starMap[s.builder_id] || 0) + 1;
        });
    }

    // Comment counts
    const { data: commentCounts } = await supabase
        .from('comments')
        .select('builder_id');

    const commentMap = {};
    if (commentCounts) {
        commentCounts.forEach(c => {
            commentMap[c.builder_id] = (commentMap[c.builder_id] || 0) + 1;
        });
    }

    const enriched = builders.map(b => {
        const publicLogs = (b.build_logs || []).filter(l => l.is_public);
        const latestLog = publicLogs.sort((a, c) =>
            new Date(c.created_at) - new Date(a.created_at)
        )[0];
        return {
            ...b,
            publicLogs,
            latestLog,
            logCount: publicLogs.length,
            starCount: starMap[b.id] || 0,
            commentCount: commentMap[b.id] || 0,
        };
    });

    return { builders: enriched };
}

// ── Fetch user syncs/validations ───────────────────────────
export async function fetchUserSyncs(userId) {
    const { data } = await supabase
        .from('syncs')
        .select('builder_id')
        .eq('user_id', userId);
    return new Set((data || []).map(s => s.builder_id));
}

export async function fetchUserValidations(userId) {
    const { data } = await supabase
        .from('validations')
        .select('builder_id')
        .eq('user_id', userId);
    return new Set((data || []).map(v => v.builder_id));
}

// ── Toggle validation ────────────────────────────────────────
export async function toggleValidation(userId, builderId, isCurrentlyValidated) {
    if (isCurrentlyValidated) {
        return supabase.from('validations').delete()
            .eq('user_id', userId).eq('builder_id', builderId);
    } else {
        return supabase.from('validations').insert({ user_id: userId, builder_id: builderId });
    }
}

// ── Toggle sync ──────────────────────────────────────
export async function toggleSync(userId, builderId, isCurrentlySynced) {
    if (isCurrentlySynced) {
        return supabase.from('syncs').delete()
            .eq('user_id', userId).eq('builder_id', builderId);
    } else {
        return supabase.from('syncs').insert({ user_id: userId, builder_id: builderId });
    }
}
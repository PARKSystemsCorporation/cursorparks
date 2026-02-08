// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Log Editor
// CRUD operations for build logs. Creates, updates, deletes.
// ════════════════════════════════════════════════════════

import { supabase, getSession, getProfile } from './supabase-client.js';
import { trackBuildLogCreated, trackBuildLogUpdated } from './analytics-tracker.js';
import { trackProjectAnalytics } from './project-analytics.js';
import { uploadMediaFile } from './media-upload.js';

// ── Create a new build log ─────────────────────────────
export async function createBuildLog(logData) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    // Get or create builder profile for this user
    let { data: builder, error: builderError } = await supabase
        .from('builders')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (builderError && builderError.code === 'PGRST116') {
        // No builder exists, create one
        const profile = await getProfile(session.user.id);
        const { data: newBuilder, error: createError } = await supabase
            .from('builders')
            .insert({
                user_id: session.user.id,
                name: profile?.display_name || profile?.username || 'Untitled Project',
                avatar_initials: (profile?.display_name || profile?.username || 'AN')
                    .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
                state: 'active'
            })
            .select()
            .maybeSingle();

        if (createError) return { error: createError.message };
        builder = newBuilder;
    } else if (builderError) {
        return { error: builderError.message };
    }

    // Get the next log index
    const { data: existingLogs } = await supabase
        .from('build_logs')
        .select('log_index')
        .eq('builder_id', builder.id)
        .order('log_index', { ascending: false })
        .limit(1);

    const nextIndex = (existingLogs?.[0]?.log_index || 0) + 1;

    // Create the log
    const { data: log, error: logError } = await supabase
        .from('build_logs')
        .insert({
            builder_id: builder.id,
            title: logData.title || `Build Log #${nextIndex}`,
            message: logData.message || logData.summary || '',
            summary: logData.summary || '',
            log_type: logData.log_type || 'update',
            status: logData.status || 'shipped',
            is_public: logData.is_public !== false,
            log_index: nextIndex,
            log_order: logData.log_order || nextIndex,
            project_id: logData.project_id || null,
            changes: logData.changes || [],
            rationale: logData.rationale || '',
            tags: logData.tags || [],
            components_touched: logData.components_touched || [],
            complexity: logData.complexity || 'medium',
            confidence: logData.confidence || 'medium',
            impact: logData.impact || 'medium',
            internal_reasoning: logData.internal_reasoning || '',
            tradeoffs: logData.tradeoffs || [],
            problems: logData.problems || [],
            next_moves: logData.next_moves || [],
            media_attachments: logData.media_attachments || []
        })
        .select()
        .maybeSingle();

    if (logError) return { error: logError.message };

    // Update builder timestamp
    await supabase
        .from('builders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', builder.id);

    // Track analytics
    await trackBuildLogCreated(builder.id, log.id, logData);
    
    // Track project analytics if project_id exists
    if (logData.project_id) {
        await trackProjectAnalytics(logData.project_id, builder.id);
    }

    return { log, builder };
}

// ── Update an existing build log ───────────────────────
export async function updateBuildLog(logId, updates) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    // Verify ownership
    const { data: existingLog, error: fetchError } = await supabase
        .from('build_logs')
        .select('*, builders!inner(user_id)')
        .eq('id', logId)
        .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (existingLog.builders.user_id !== session.user.id) {
        return { error: 'Not authorized to edit this log' };
    }

    const updateRecord = { updated_at: new Date().toISOString() };
    const allowedFields = [
        'title', 'message', 'summary', 'log_type', 'status', 'is_public',
        'changes', 'rationale', 'tags', 'components_touched',
        'complexity', 'confidence', 'impact',
        'internal_reasoning', 'tradeoffs', 'problems', 'next_moves',
        'media_attachments', 'project_id', 'log_order'
    ];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateRecord[field] = updates[field];
        }
    }

    const { data: log, error: updateError } = await supabase
        .from('build_logs')
        .update(updateRecord)
        .eq('id', logId)
        .select()
        .maybeSingle();

    if (updateError) return { error: updateError.message };

    await supabase
        .from('builders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingLog.builder_id);

    // Track analytics
    await trackBuildLogUpdated(existingLog.builder_id, logId, updates);
    
    // Track project analytics if project_id exists
    if (updates.project_id || existingLog.project_id) {
        const projectId = updates.project_id || existingLog.project_id;
        await trackProjectAnalytics(projectId, existingLog.builder_id);
    }

    return { log };
}

// ── Delete a build log ─────────────────────────────────
export async function deleteBuildLog(logId) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { data: existingLog, error: fetchError } = await supabase
        .from('build_logs')
        .select('*, builders!inner(user_id)')
        .eq('id', logId)
        .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (existingLog.builders.user_id !== session.user.id) {
        return { error: 'Not authorized to delete this log' };
    }

    await supabase.from('build_notes').delete().eq('build_log_id', logId);

    const { error: deleteError } = await supabase
        .from('build_logs')
        .delete()
        .eq('id', logId);

    if (deleteError) return { error: deleteError.message };
    return { success: true };
}

// ── Get user's builder profile ─────────────────────────
export async function getMyBuilder() {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { data: builder, error } = await supabase
        .from('builders')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (error && error.code === 'PGRST116') {
        return { builder: null };
    }
    if (error) return { error: error.message };
    return { builder };
}

// ── Get all logs for current user ──────────────────────
export async function getMyLogs() {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { builder, error: builderError } = await getMyBuilder();
    if (builderError) return { error: builderError };
    if (!builder) return { logs: [] };

    const { data: logs, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('builder_id', builder.id)
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { logs: logs || [], builder };
}
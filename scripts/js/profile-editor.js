// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Profile Editor
// CRUD operations for profiles and builders.
// ════════════════════════════════════════════════════════

import { supabase, getSession, getProfile } from './supabase-client.js';
import { uploadMediaFile } from './media-upload.js';

// ── Get current user's profile ─────────────────────────
export async function getMyProfile() {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    let profile = await getProfile(session.user.id);
    
    if (!profile) {
        // Auto-create a blank profile
        const { data, error } = await supabase
            .from('profiles')
            .insert({ id: session.user.id })
            .select()
            .maybeSingle();
        
        if (error) return { error: error.message };
        profile = data;
    }

    return { profile, user: session.user };
}

// ── Update user profile ────────────────────────────────
export async function updateProfile(updates) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const allowedFields = [
        'display_name', 'username', 'bio', 'website', 'twitter',
        'github', 'avatar_url', 'location', 'media_attachments'
    ];

    const updateRecord = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateRecord[field] = updates[field];
        }
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .update(updateRecord)
        .eq('id', session.user.id)
        .select()
        .maybeSingle();

    if (error) return { error: error.message };
    return { profile };
}

// ── Get current user's builder ─────────────────────────
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

// ── Update builder profile ─────────────────────────────
export async function updateBuilder(updates) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { builder, error: fetchError } = await getMyBuilder();
    if (fetchError) return { error: fetchError };
    if (!builder) return { error: 'No builder found' };

    const allowedFields = [
        'name', 'description', 'avatar_initials', 'role', 'state',
        'tags', 'stack', 'website', 'twitter', 'github', 'progress',
        'profile_visibility', 'show_public_logs', 'show_stats',
        'show_metrics', 'show_modules', 'show_analytics', 'show_notes'
    ];

    const updateRecord = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateRecord[field] = updates[field];
        }
    }

    // Auto-generate initials if name changes
    if (updates.name && !updates.avatar_initials) {
        updateRecord.avatar_initials = updates.name
            .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    const { data: updatedBuilder, error } = await supabase
        .from('builders')
        .update(updateRecord)
        .eq('id', builder.id)
        .select()
        .maybeSingle();

    if (error) return { error: error.message };
    return { builder: updatedBuilder };
}

// ── Create or update builder (upsert) ──────────────────
export async function upsertBuilder(data) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { builder: existing } = await getMyBuilder();

    if (existing) {
        return updateBuilder(data);
    }

    // Create new builder
    const profile = await getProfile(session.user.id);
    const { data: builder, error } = await supabase
        .from('builders')
        .insert({
            user_id: session.user.id,
            name: data.name || profile?.display_name || 'Untitled Project',
            description: data.description || '',
            avatar_initials: data.avatar_initials ||
                (data.name || profile?.display_name || 'AN')
                    .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            role: data.role || '',
            state: data.state || 'active',
            profile_visibility: data.profile_visibility || 'public',
            show_public_logs: data.show_public_logs !== false,
            show_stats: data.show_stats !== false,
            show_metrics: data.show_metrics !== false,
            show_modules: data.show_modules !== false,
            show_analytics: data.show_analytics !== false,
            show_notes: data.show_notes !== false,
            tags: data.tags || [],
            stack: data.stack || []
        })
        .select()
        .maybeSingle();

    if (error) return { error: error.message };
    return { builder };
}

// ── Delete builder and all associated data ─────────────
export async function deleteBuilder() {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { builder } = await getMyBuilder();
    if (!builder) return { error: 'No builder found' };

    // Delete in order: notes -> logs -> syncs -> validations -> comments -> builder
    await supabase.from('build_notes').delete().eq('builder_id', builder.id);
    await supabase.from('build_logs').delete().eq('builder_id', builder.id);
    await supabase.from('syncs').delete().eq('builder_id', builder.id);
    await supabase.from('validations').delete().eq('builder_id', builder.id);
    await supabase.from('comments').delete().eq('builder_id', builder.id);

    const { error } = await supabase
        .from('builders')
        .delete()
        .eq('id', builder.id);

    if (error) return { error: error.message };
    return { success: true };
}

// ── Sign out ───────────────────────────────────────────
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { success: true };
}
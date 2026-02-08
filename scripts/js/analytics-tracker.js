// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Analytics Tracker
// Automatically tracks metrics when build logs are created/updated
// ════════════════════════════════════════════════════════

import { supabase } from './supabase-client.js';

// ── Track Build Log Creation ────────────────────────────
export async function trackBuildLogCreated(builderId, logId, logData) {
    try {
        // Calculate immediate metrics
        const metrics = await calculateImmediateMetrics(builderId, logData);

        // Store metrics snapshot
        await supabase
            .from('builder_metrics')
            .insert({
                builder_id: builderId,
                build_log_id: logId,
                metric_type: 'build_created',
                metrics_snapshot: metrics,
                created_at: new Date().toISOString()
            });

        // Update builder's last activity timestamp
        await supabase
            .from('builders')
            .update({ 
                updated_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
            })
            .eq('id', builderId);

        return { success: true };
    } catch (error) {
        console.warn('Analytics tracking failed:', error);
        return { error: error.message };
    }
}

// ── Track Build Log Update ──────────────────────────────
export async function trackBuildLogUpdated(builderId, logId, updates) {
    try {
        const metrics = await calculateImmediateMetrics(builderId, updates);

        await supabase
            .from('builder_metrics')
            .insert({
                builder_id: builderId,
                build_log_id: logId,
                metric_type: 'build_updated',
                metrics_snapshot: metrics,
                created_at: new Date().toISOString()
            });

        await supabase
            .from('builders')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', builderId);

        return { success: true };
    } catch (error) {
        console.warn('Analytics tracking failed:', error);
        return { error: error.message };
    }
}

// ── Track Comment Activity ───────────────────────────────
export async function trackCommentActivity(builderId, buildLogId, action = 'comment') {
    try {
        await supabase
            .from('builder_metrics')
            .insert({
                builder_id: builderId,
                build_log_id: buildLogId,
                metric_type: `comment_${action}`,
                metrics_snapshot: {
                    timestamp: new Date().toISOString(),
                    action
                },
                created_at: new Date().toISOString()
            });

        return { success: true };
    } catch (error) {
        console.warn('Comment tracking failed:', error);
        return { error: error.message };
    }
}

// ── Track Sync/Validation Activity ──────────────────────────
export async function trackSocialActivity(builderId, action, targetBuilderId = null) {
    try {
        // Map old action names to new ones for backwards compatibility
        const actionMap = {
            'starred': 'validated',
            'unstarred': 'unvalidated',
            'followed': 'synced',
            'unfollowed': 'unsynced'
        };
        const mappedAction = actionMap[action] || action;
        
        await supabase
            .from('builder_metrics')
            .insert({
                builder_id: builderId,
                metric_type: `social_${mappedAction}`,
                metrics_snapshot: {
                    timestamp: new Date().toISOString(),
                    action: mappedAction,
                    target_builder_id: targetBuilderId
                },
                created_at: new Date().toISOString()
            });

        return { success: true };
    } catch (error) {
        console.warn('Social tracking failed:', error);
        return { error: error.message };
    }
}

// ── Calculate Immediate Metrics ──────────────────────────
async function calculateImmediateMetrics(builderId, logData) {
    // Get recent logs for context
    const { data: recentLogs } = await supabase
        .from('build_logs')
        .select('created_at, status, log_index')
        .eq('builder_id', builderId)
        .order('created_at', { ascending: false })
        .limit(10);

    const now = new Date();
    const logs = recentLogs || [];

    // Calculate time since last log
    const timeSinceLastLog = logs.length > 1
        ? (now - new Date(logs[1].created_at)) / (1000 * 60 * 60) // hours
        : 24;

    // Calculate velocity (logs per day)
    const last7Days = logs.filter(l => 
        (now - new Date(l.created_at)) / (1000 * 60 * 60 * 24) <= 7
    );
    const velocity = last7Days.length / 7;

    // Calculate momentum (based on recency)
    const momentum = Math.exp(-timeSinceLastLog / 24); // Decay over 24 hours

    // Calculate complexity score
    const complexity = logData.complexity === 'high' ? 3 :
                      logData.complexity === 'medium' ? 2 : 1;

    // Calculate confidence score
    const confidence = logData.confidence === 'high' ? 3 :
                      logData.confidence === 'medium' ? 2 : 1;

    return {
        timestamp: now.toISOString(),
        time_since_last_log_hours: timeSinceLastLog,
        velocity: velocity,
        momentum: momentum,
        complexity_score: complexity,
        confidence_score: confidence,
        log_count_7d: last7Days.length,
        log_count_total: logs.length + 1
    };
}

// ── Periodic Metrics Update ──────────────────────────────
export async function updatePeriodicMetrics(builderId) {
    try {
        const { data: logs } = await supabase
            .from('build_logs')
            .select('created_at, status, log_index')
            .eq('builder_id', builderId)
            .order('created_at', { ascending: true });

        if (!logs || logs.length === 0) return { success: true };

        const now = new Date();
        const firstLog = logs[0];
        const totalDays = (now - new Date(firstLog.created_at)) / (1000 * 60 * 60 * 24) || 1;

        // Calculate various metrics
        const metrics = {
            total_logs: logs.length,
            total_days: Math.floor(totalDays),
            average_logs_per_day: logs.length / totalDays,
            logs_last_7_days: logs.filter(l => 
                (now - new Date(l.created_at)) / (1000 * 60 * 60 * 24) <= 7
            ).length,
            logs_last_30_days: logs.filter(l => 
                (now - new Date(l.created_at)) / (1000 * 60 * 60 * 24) <= 30
            ).length,
            active_days: new Set(logs.map(l => 
                new Date(l.created_at).toISOString().split('T')[0]
            )).size,
            consistency_score: calculateConsistency(logs),
            last_activity: logs[logs.length - 1]?.created_at
        };

        // Store aggregated metrics
        await supabase
            .from('builder_metrics')
            .insert({
                builder_id: builderId,
                metric_type: 'periodic_update',
                metrics_snapshot: metrics,
                created_at: now.toISOString()
            });

        return { success: true, metrics };
    } catch (error) {
        console.warn('Periodic metrics update failed:', error);
        return { error: error.message };
    }
}

// ── Calculate Consistency Score ──────────────────────────
function calculateConsistency(logs) {
    if (logs.length < 2) return 0;

    const dates = logs.map(l => new Date(l.created_at).getTime()).sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)); // days
    }

    if (intervals.length === 0) return 0;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgInterval > 0 ? (stdDev / avgInterval) : 0;

    // Consistency score: 0-100, higher = more consistent
    return Math.max(0, Math.min(100, 100 - (cv * 100)));
}

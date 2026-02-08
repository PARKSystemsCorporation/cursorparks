// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Analytics Display System
// Context-aware analytics rendering with 3 spots
// ════════════════════════════════════════════════════════

import { getAllMetrics, getMetricsForContext, METRIC_CATEGORIES, METRICS } from './analytics.js';
import { createWidget, WIDGET_TYPES, injectWidgetStyles } from './analytics-widgets.js';
import { supabase, getSession } from './supabase-client.js';

// ── Analytics Spot Contexts ────────────────────────────
export const SPOT_CONTEXTS = {
    SPOT_1: 'spot1',  // Build/post analytics
    SPOT_2: 'spot2',  // Profile analytics  
    SPOT_3: 'spot3'   // Lifespan analytics
};

// ── Get User Analytics Configuration ────────────────────
export async function getUserAnalyticsConfig(builderId) {
    const session = await getSession();
    if (!session) return getDefaultConfig();

    try {
        const { data } = await supabase
            .from('analytics_config')
            .select('*')
            .eq('builder_id', builderId)
            .maybeSingle();

        if (data && data.config) {
            return data.config;
        }
    } catch (e) {
        console.warn('analytics_config table may not exist');
    }

    return getDefaultConfig();
}

// ── Save User Analytics Configuration ───────────────────
export async function saveUserAnalyticsConfig(builderId, config) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    try {
        const { error } = await supabase
            .from('analytics_config')
            .upsert({
                builder_id: builderId,
                config: config,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'builder_id'
            });

        if (error) return { error: error.message };
        return { success: true };
    } catch (e) {
        return { error: 'Failed to save config' };
    }
}

// ── Default Configuration ──────────────────────────────
function getDefaultConfig() {
    return {
        spot1: {
            metric: 'build_velocity',
            widgetType: WIDGET_TYPES.DIAL,
            context: METRIC_CATEGORIES.BUILD
        },
        spot2: {
            metric: 'profile_velocity',
            widgetType: WIDGET_TYPES.GAUGE,
            context: METRIC_CATEGORIES.PROFILE
        },
        spot3: {
            metric: 'lifespan_total_distance',
            widgetType: WIDGET_TYPES.NUMBER,
            context: METRIC_CATEGORIES.LIFESPAN
        }
    };
}

// ── Render Analytics Spots ──────────────────────────────
export async function renderAnalyticsSpots(container, builderId, buildLogId = null) {
    injectWidgetStyles();

    const config = await getUserAnalyticsConfig(builderId);
    const allMetrics = await getAllMetrics(builderId, buildLogId);

    // Render each spot
    const spot1 = await renderSpot('spot1', config.spot1, allMetrics, builderId, buildLogId);
    const spot2 = await renderSpot('spot2', config.spot2, allMetrics, builderId, buildLogId);
    const spot3 = await renderSpot('spot3', config.spot3, allMetrics, builderId, buildLogId);

    container.innerHTML = `
        <div class="analytics-spots">
            <div class="analytics-spot" data-spot="spot1">${spot1}</div>
            <div class="analytics-spot" data-spot="spot2">${spot2}</div>
            <div class="analytics-spot" data-spot="spot3">${spot3}</div>
        </div>
    `;
}

// ── Render Single Spot ──────────────────────────────────
async function renderSpot(spotId, spotConfig, allMetrics, builderId, buildLogId) {
    if (!spotConfig || !spotConfig.metric) {
        return '<div class="analytics-empty">No metric configured</div>';
    }

    const context = spotConfig.context || determineContextFromSpot(spotId);
    const metrics = allMetrics[context] || allMetrics.all || {};
    const metricValue = metrics[spotConfig.metric];

    if (!metricValue) {
        return '<div class="analytics-empty">Metric not available</div>';
    }

    const widgetType = spotConfig.widgetType || WIDGET_TYPES.DIAL;
    return createWidget(spotConfig.metric, metricValue, widgetType, spotConfig.options || {});
}

// ── Determine Context from Spot ────────────────────────
function determineContextFromSpot(spotId) {
    switch (spotId) {
        case 'spot1': return METRIC_CATEGORIES.BUILD;
        case 'spot2': return METRIC_CATEGORIES.PROFILE;
        case 'spot3': return METRIC_CATEGORIES.LIFESPAN;
        default: return METRIC_CATEGORIES.PROFILE;
    }
}

// ── Render Analytics Tab Content ────────────────────────
export async function renderAnalyticsTab(container, builderId, buildLogId = null) {
    injectWidgetStyles();

    const config = await getUserAnalyticsConfig(builderId);
    const allMetrics = await getAllMetrics(builderId, buildLogId);

    // Group metrics by category
    const buildMetrics = Object.entries(allMetrics.build || {}).map(([key, value]) => ({
        key,
        value,
        metric: METRICS[key]
    })).filter(m => m.metric);

    const profileMetrics = Object.entries(allMetrics.profile || {}).map(([key, value]) => ({
        key,
        value,
        metric: METRICS[key]
    })).filter(m => m.metric);

    const lifespanMetrics = Object.entries(allMetrics.lifespan || {}).map(([key, value]) => ({
        key,
        value,
        metric: METRICS[key]
    })).filter(m => m.metric);

    container.innerHTML = `
        <div class="analytics-tab-content">
            <div class="analytics-section">
                <h3 class="analytics-section-title">Build Analytics</h3>
                <div class="analytics-grid">
                    ${buildMetrics.map(m => createWidget(m.key, m.value, WIDGET_TYPES.DIAL)).join('')}
                </div>
            </div>
            <div class="analytics-section">
                <h3 class="analytics-section-title">Profile Analytics</h3>
                <div class="analytics-grid">
                    ${profileMetrics.map(m => createWidget(m.key, m.value, WIDGET_TYPES.GAUGE)).join('')}
                </div>
            </div>
            <div class="analytics-section">
                <h3 class="analytics-section-title">Lifespan Analytics</h3>
                <div class="analytics-grid">
                    ${lifespanMetrics.map(m => createWidget(m.key, m.value, WIDGET_TYPES.NUMBER)).join('')}
                </div>
            </div>
            <div class="analytics-actions">
                <a href="../analytics-dashboard/index.html" class="btn btn-accent">Configure Analytics</a>
            </div>
        </div>
    `;
}

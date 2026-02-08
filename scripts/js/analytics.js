// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Analytics Engine
// Tracks and calculates metrics for builds, profiles, and lifespan
// ════════════════════════════════════════════════════════

import { supabase, getSession } from './supabase-client.js';

// ── Metric Categories ──────────────────────────────────
export const METRIC_CATEGORIES = {
    BUILD: 'build',      // Relative to specific build log
    PROFILE: 'profile',   // Current profile metrics (velocity, trajectory)
    LIFESPAN: 'lifespan'  // Entire account history
};

// ── Available Metrics ───────────────────────────────────
export const METRICS = {
    // Build metrics (relative to specific build)
    build_velocity: {
        name: 'Build Velocity',
        category: METRIC_CATEGORIES.BUILD,
        unit: 'logs/day',
        description: 'Rate of build log creation',
        physicsTerm: 'Velocity'
    },
    build_momentum: {
        name: 'Build Momentum',
        category: METRIC_CATEGORIES.BUILD,
        unit: '',
        description: 'Consistency of build activity',
        physicsTerm: 'Momentum'
    },
    build_acceleration: {
        name: 'Build Acceleration',
        category: METRIC_CATEGORIES.BUILD,
        unit: 'logs/day²',
        description: 'Change in build rate',
        physicsTerm: 'Acceleration'
    },
    build_energy: {
        name: 'Build Energy',
        category: METRIC_CATEGORIES.BUILD,
        unit: '',
        description: 'Total activity energy',
        physicsTerm: 'Kinetic Energy'
    },
    
    // Profile metrics (current state)
    profile_velocity: {
        name: 'Profile Velocity',
        category: METRIC_CATEGORIES.PROFILE,
        unit: 'updates/week',
        description: 'Current update frequency',
        physicsTerm: 'Velocity'
    },
    profile_trajectory: {
        name: 'Trajectory',
        category: METRIC_CATEGORIES.PROFILE,
        unit: '°',
        description: 'Direction of progress',
        physicsTerm: 'Trajectory'
    },
    profile_momentum: {
        name: 'Momentum',
        category: METRIC_CATEGORIES.PROFILE,
        unit: '',
        description: 'Sustained activity momentum',
        physicsTerm: 'Momentum'
    },
    profile_force: {
        name: 'Force',
        category: METRIC_CATEGORIES.PROFILE,
        unit: 'N',
        description: 'Rate of change in momentum',
        physicsTerm: 'Force'
    },
    profile_impulse: {
        name: 'Impulse',
        category: METRIC_CATEGORIES.PROFILE,
        unit: 'N·s',
        description: 'Recent activity burst',
        physicsTerm: 'Impulse'
    },
    
    // Lifespan metrics (entire history)
    lifespan_total_energy: {
        name: 'Total Energy',
        category: METRIC_CATEGORIES.LIFESPAN,
        unit: 'J',
        description: 'Cumulative work done',
        physicsTerm: 'Total Energy'
    },
    lifespan_average_velocity: {
        name: 'Average Velocity',
        category: METRIC_CATEGORIES.LIFESPAN,
        unit: 'logs/week',
        description: 'Long-term average rate',
        physicsTerm: 'Average Velocity'
    },
    lifespan_max_velocity: {
        name: 'Peak Velocity',
        category: METRIC_CATEGORIES.LIFESPAN,
        unit: 'logs/week',
        description: 'Highest activity period',
        physicsTerm: 'Peak Velocity'
    },
    lifespan_consistency: {
        name: 'Consistency',
        category: METRIC_CATEGORIES.LIFESPAN,
        unit: '%',
        description: 'Regularity of activity',
        physicsTerm: 'Consistency'
    },
    lifespan_total_distance: {
        name: 'Total Distance',
        category: METRIC_CATEGORIES.LIFESPAN,
        unit: 'logs',
        description: 'Total builds completed',
        physicsTerm: 'Distance Traveled'
    }
};

// ── Calculate Build Metrics ──────────────────────────────
export async function calculateBuildMetrics(builderId, buildLogId = null) {
    const { data: logs } = await supabase
        .from('build_logs')
        .select('created_at, status, log_index')
        .eq('builder_id', builderId)
        .order('created_at', { ascending: true });

    if (!logs || logs.length === 0) {
        return getEmptyMetrics(METRIC_CATEGORIES.BUILD);
    }

    // Filter to specific build if provided
    let relevantLogs = logs;
    if (buildLogId) {
        const buildIndex = logs.findIndex(l => l.id === buildLogId);
        if (buildIndex >= 0) {
            // Include logs up to and including this build
            relevantLogs = logs.slice(0, buildIndex + 1);
        }
    }

    // Calculate time span
    const firstLog = relevantLogs[0];
    const lastLog = relevantLogs[relevantLogs.length - 1];
    const days = (new Date(lastLog.created_at) - new Date(firstLog.created_at)) / (1000 * 60 * 60 * 24) || 1;

    // Velocity: logs per day
    const velocity = relevantLogs.length / days;

    // Momentum: weighted by recency
    const momentum = calculateMomentum(relevantLogs);

    // Acceleration: change in velocity
    const acceleration = calculateAcceleration(relevantLogs, days);

    // Energy: velocity² * mass (mass = log count)
    const energy = velocity * velocity * relevantLogs.length;

    return {
        build_velocity: { value: velocity, max: Math.max(velocity * 2, 10) },
        build_momentum: { value: momentum, max: 1 },
        build_acceleration: { value: acceleration, max: Math.max(Math.abs(acceleration) * 2, 5) },
        build_energy: { value: energy, max: Math.max(energy * 1.5, 100) }
    };
}

// ── Calculate Profile Metrics ───────────────────────────
export async function calculateProfileMetrics(builderId) {
    const { data: logs } = await supabase
        .from('build_logs')
        .select('created_at, updated_at, status')
        .eq('builder_id', builderId)
        .order('created_at', { ascending: false })
        .limit(30); // Last 30 logs for current state

    if (!logs || logs.length < 2) {
        return getEmptyMetrics(METRIC_CATEGORIES.PROFILE);
    }

    // Recent activity window (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(l => new Date(l.created_at) >= weekAgo);

    // Velocity: updates per week
    const velocity = recentLogs.length;

    // Trajectory: trend direction (angle in degrees)
    const trajectory = calculateTrajectory(logs.slice(0, 10));

    // Momentum: sustained activity
    const momentum = calculateMomentum(recentLogs);

    // Force: rate of change in momentum
    const force = calculateForce(logs.slice(0, 14));

    // Impulse: recent burst activity
    const impulse = calculateImpulse(recentLogs);

    return {
        profile_velocity: { value: velocity, max: Math.max(velocity * 2, 20) },
        profile_trajectory: { value: trajectory, max: 180 },
        profile_momentum: { value: momentum, max: 1 },
        profile_force: { value: force, max: Math.max(Math.abs(force) * 2, 10) },
        profile_impulse: { value: impulse, max: Math.max(impulse * 1.5, 50) }
    };
}

// ── Calculate Lifespan Metrics ──────────────────────────
export async function calculateLifespanMetrics(builderId) {
    const { data: logs } = await supabase
        .from('build_logs')
        .select('created_at, status')
        .eq('builder_id', builderId)
        .order('created_at', { ascending: true });

    if (!logs || logs.length === 0) {
        return getEmptyMetrics(METRIC_CATEGORIES.LIFESPAN);
    }

    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const totalDays = (new Date(lastLog.created_at) - new Date(firstLog.created_at)) / (1000 * 60 * 60 * 24) || 1;
    const totalWeeks = totalDays / 7;

    // Total distance
    const totalDistance = logs.length;

    // Average velocity
    const avgVelocity = totalWeeks > 0 ? totalDistance / totalWeeks : 0;

    // Peak velocity (max logs in a week)
    const maxVelocity = calculatePeakVelocity(logs);

    // Consistency (coefficient of variation)
    const consistency = calculateConsistency(logs, totalWeeks);

    // Total energy (cumulative)
    const totalEnergy = logs.length * logs.length * 0.1; // Simplified

    return {
        lifespan_total_distance: { value: totalDistance, max: Math.max(totalDistance * 1.2, 100) },
        lifespan_average_velocity: { value: avgVelocity, max: Math.max(avgVelocity * 2, 10) },
        lifespan_max_velocity: { value: maxVelocity, max: Math.max(maxVelocity * 1.5, 20) },
        lifespan_consistency: { value: consistency, max: 100 },
        lifespan_total_energy: { value: totalEnergy, max: Math.max(totalEnergy * 1.5, 1000) }
    };
}

// ── Helper Functions ────────────────────────────────────
function calculateMomentum(logs) {
    if (logs.length === 0) return 0;
    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;
    
    logs.forEach((log, i) => {
        const age = (now - new Date(log.created_at)) / (1000 * 60 * 60 * 24); // days
        const weight = Math.exp(-age / 7); // Exponential decay, 7 day half-life
        weightedSum += weight;
        totalWeight += 1;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function calculateAcceleration(logs, days) {
    if (logs.length < 2) return 0;
    const midPoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midPoint);
    const secondHalf = logs.slice(midPoint);
    
    const firstHalfDays = days / 2;
    const secondHalfDays = days / 2;
    
    const v1 = firstHalf.length / firstHalfDays;
    const v2 = secondHalf.length / secondHalfDays;
    
    return (v2 - v1) / (days / 2); // Change in velocity per day
}

function calculateTrajectory(logs) {
    if (logs.length < 2) return 0;
    // Simple linear regression to get trend
    const times = logs.map((_, i) => i);
    const values = logs.map((_, i) => i);
    
    const n = times.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = times.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const angle = Math.atan(slope) * (180 / Math.PI);
    
    return angle;
}

function calculateForce(logs) {
    if (logs.length < 2) return 0;
    const recent = logs.slice(0, 7);
    const older = logs.slice(7);
    
    const recentMomentum = calculateMomentum(recent);
    const olderMomentum = calculateMomentum(older);
    
    return recentMomentum - olderMomentum; // Change in momentum
}

function calculateImpulse(logs) {
    if (logs.length === 0) return 0;
    const now = Date.now();
    let impulse = 0;
    
    logs.forEach(log => {
        const age = (now - new Date(log.created_at)) / (1000 * 60 * 60); // hours
        if (age < 24) { // Last 24 hours
            impulse += Math.exp(-age / 12); // Decay over 12 hours
        }
    });
    
    return impulse;
}

function calculatePeakVelocity(logs) {
    if (logs.length === 0) return 0;
    const weeklyCounts = new Map();
    
    logs.forEach(log => {
        const date = new Date(log.created_at);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);
    });
    
    return Math.max(...Array.from(weeklyCounts.values()), 0);
}

function calculateConsistency(logs, totalWeeks) {
    if (logs.length === 0 || totalWeeks === 0) return 0;
    const weeklyCounts = new Map();
    
    logs.forEach(log => {
        const date = new Date(log.created_at);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);
    });
    
    const counts = Array.from(weeklyCounts.values());
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
    
    return Math.max(0, 100 - cv); // Invert so higher = more consistent
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getEmptyMetrics(category) {
    const metrics = {};
    Object.entries(METRICS).forEach(([key, metric]) => {
        if (metric.category === category) {
            metrics[key] = { value: 0, max: 1 };
        }
    });
    return metrics;
}

// ── Get All Metrics for Context ────────────────────────
export async function getAllMetrics(builderId, buildLogId = null) {
    const [build, profile, lifespan] = await Promise.all([
        calculateBuildMetrics(builderId, buildLogId),
        calculateProfileMetrics(builderId),
        calculateLifespanMetrics(builderId)
    ]);

    return {
        build,
        profile,
        lifespan,
        all: { ...build, ...profile, ...lifespan }
    };
}

// ── Get Metrics for Specific Context ────────────────────
export async function getMetricsForContext(builderId, context, buildLogId = null) {
    switch (context) {
        case METRIC_CATEGORIES.BUILD:
            return calculateBuildMetrics(builderId, buildLogId);
        case METRIC_CATEGORIES.PROFILE:
            return calculateProfileMetrics(builderId);
        case METRIC_CATEGORIES.LIFESPAN:
            return calculateLifespanMetrics(builderId);
        default:
            return getAllMetrics(builderId, buildLogId);
    }
}

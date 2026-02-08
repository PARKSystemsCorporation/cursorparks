// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Analytics Visualization Widgets
// 5+ visualization types per metric: dial, bar, line, area, sparkline
// ════════════════════════════════════════════════════════

import { METRICS } from './analytics.js';

// ── Widget Types ────────────────────────────────────────
export const WIDGET_TYPES = {
    DIAL: 'dial',
    BAR: 'bar',
    LINE: 'line',
    AREA: 'area',
    SPARKLINE: 'sparkline',
    GAUGE: 'gauge',
    PROGRESS: 'progress',
    NUMBER: 'number'
};

// ── Create Widget ─────────────────────────────────────
export function createWidget(metricKey, metricValue, widgetType, options = {}) {
    const metric = METRICS[metricKey];
    if (!metric) return null;

    const { value, max, history = [] } = metricValue;
    const percent = max > 0 ? (value / max) * 100 : 0;

    switch (widgetType) {
        case WIDGET_TYPES.DIAL:
            return createDialWidget(metric, value, max, percent, options);
        case WIDGET_TYPES.BAR:
            return createBarWidget(metric, value, max, percent, options);
        case WIDGET_TYPES.LINE:
            return createLineWidget(metric, value, max, history, options);
        case WIDGET_TYPES.AREA:
            return createAreaWidget(metric, value, max, history, options);
        case WIDGET_TYPES.SPARKLINE:
            return createSparklineWidget(metric, value, max, history, options);
        case WIDGET_TYPES.GAUGE:
            return createGaugeWidget(metric, value, max, percent, options);
        case WIDGET_TYPES.PROGRESS:
            return createProgressWidget(metric, value, max, percent, options);
        case WIDGET_TYPES.NUMBER:
            return createNumberWidget(metric, value, max, options);
        default:
            return createDialWidget(metric, value, max, percent, options);
    }
}

// ── Dial Widget ────────────────────────────────────────
function createDialWidget(metric, value, max, percent, options) {
    const size = options.size || 120;
    const strokeWidth = options.strokeWidth || 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    const color = getColorForValue(percent, options.color);

    return `
        <div class="analytics-widget analytics-dial" data-metric="${metric.name}">
            <svg width="${size}" height="${size}" class="dial-svg">
                <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                    fill="none" stroke="var(--bg-secondary)" stroke-width="${strokeWidth}"/>
                <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                    fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${offset}"
                    stroke-linecap="round"
                    transform="rotate(-90 ${size/2} ${size/2})"/>
            </svg>
            <div class="dial-content">
                <div class="dial-value">${formatValue(value, metric.unit)}</div>
                <div class="dial-label">${metric.physicsTerm || metric.name}</div>
            </div>
        </div>
    `;
}

// ── Bar Widget ────────────────────────────────────────
function createBarWidget(metric, value, max, percent, options) {
    const height = options.height || 120;
    const color = getColorForValue(percent, options.color);

    return `
        <div class="analytics-widget analytics-bar" data-metric="${metric.name}">
            <div class="bar-container" style="height: ${height}px;">
                <div class="bar-fill" style="height: ${percent}%; background: ${color};"></div>
            </div>
            <div class="bar-label">${metric.physicsTerm || metric.name}</div>
            <div class="bar-value">${formatValue(value, metric.unit)}</div>
        </div>
    `;
}

// ── Line Widget ────────────────────────────────────────
function createLineWidget(metric, value, max, history, options) {
    const width = options.width || 200;
    const height = options.height || 80;
    const points = generateLinePoints(history || [value], width, height, max);

    return `
        <div class="analytics-widget analytics-line" data-metric="${metric.name}">
            <svg width="${width}" height="${height}" class="line-svg">
                <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2"/>
            </svg>
            <div class="line-label">${metric.physicsTerm || metric.name}</div>
            <div class="line-value">${formatValue(value, metric.unit)}</div>
        </div>
    `;
}

// ── Area Widget ────────────────────────────────────────
function createAreaWidget(metric, value, max, history, options) {
    const width = options.width || 200;
    const height = options.height || 80;
    const points = generateLinePoints(history || [value], width, height, max);
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    const color = options.color || 'var(--accent)';

    return `
        <div class="analytics-widget analytics-area" data-metric="${metric.name}">
            <svg width="${width}" height="${height}" class="area-svg">
                <polygon points="${areaPoints}" fill="${color}" opacity="0.3"/>
                <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>
            </svg>
            <div class="area-label">${metric.physicsTerm || metric.name}</div>
            <div class="area-value">${formatValue(value, metric.unit)}</div>
        </div>
    `;
}

// ── Sparkline Widget ───────────────────────────────────
function createSparklineWidget(metric, value, max, history, options) {
    const width = options.width || 100;
    const height = options.height || 30;
    const points = generateLinePoints(history || [value], width, height, max);
    const color = options.color || 'var(--accent)';

    return `
        <div class="analytics-widget analytics-sparkline" data-metric="${metric.name}">
            <svg width="${width}" height="${height}" class="sparkline-svg">
                <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5"/>
            </svg>
            <span class="sparkline-value">${formatValue(value, metric.unit)}</span>
        </div>
    `;
}

// ── Gauge Widget ───────────────────────────────────────
function createGaugeWidget(metric, value, max, percent, options) {
    const size = options.size || 120;
    const radius = size / 2 - 10;
    const angle = (percent / 100) * 180 - 90; // -90 to 90 degrees
    const x = size / 2 + radius * Math.cos(angle * Math.PI / 180);
    const y = size / 2 + radius * Math.sin(angle * Math.PI / 180);
    const color = getColorForValue(percent, options.color);

    return `
        <div class="analytics-widget analytics-gauge" data-metric="${metric.name}">
            <svg width="${size}" height="${size}" class="gauge-svg">
                <path d="M ${size/2 - radius} ${size/2} A ${radius} ${radius} 0 0 1 ${size/2 + radius} ${size/2}"
                    fill="none" stroke="var(--bg-secondary)" stroke-width="8"/>
                <path d="M ${size/2 - radius} ${size/2} A ${radius} ${radius} 0 0 1 ${x} ${y}"
                    fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
                <line x1="${size/2}" y1="${size/2}" x2="${x}" y2="${y}" 
                    stroke="${color}" stroke-width="3" stroke-linecap="round"/>
                <circle cx="${size/2}" cy="${size/2}" r="6" fill="${color}"/>
            </svg>
            <div class="gauge-label">${metric.physicsTerm || metric.name}</div>
            <div class="gauge-value">${formatValue(value, metric.unit)}</div>
        </div>
    `;
}

// ── Progress Widget ────────────────────────────────────
function createProgressWidget(metric, value, max, percent, options) {
    const color = getColorForValue(percent, options.color);

    return `
        <div class="analytics-widget analytics-progress" data-metric="${metric.name}">
            <div class="progress-header">
                <span class="progress-label">${metric.physicsTerm || metric.name}</span>
                <span class="progress-value">${formatValue(value, metric.unit)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percent}%; background: ${color};"></div>
            </div>
        </div>
    `;
}

// ── Number Widget ──────────────────────────────────────
function createNumberWidget(metric, value, max, options) {
    const size = options.size || 'large';
    const color = options.color || 'var(--text-primary)';

    return `
        <div class="analytics-widget analytics-number analytics-number-${size}" data-metric="${metric.name}">
            <div class="number-value" style="color: ${color};">${formatValue(value, metric.unit)}</div>
            <div class="number-label">${metric.physicsTerm || metric.name}</div>
        </div>
    `;
}

// ── Helper Functions ────────────────────────────────────
function generateLinePoints(values, width, height, max) {
    if (values.length === 0) return '';
    if (values.length === 1) {
        const x = width / 2;
        const y = height - (values[0] / max) * height;
        return `${x},${y}`;
    }

    const step = width / (values.length - 1);
    const actualMax = Math.max(...values, max);
    
    return values.map((val, i) => {
        const x = i * step;
        const y = height - (val / actualMax) * height;
        return `${x},${y}`;
    }).join(' ');
}

function getColorForValue(percent, customColor) {
    if (customColor) return customColor;
    
    if (percent >= 80) return 'var(--good)';
    if (percent >= 50) return 'var(--accent)';
    if (percent >= 25) return 'var(--warning)';
    return 'var(--bad)';
}

function formatValue(value, unit) {
    if (typeof value !== 'number') return '--';
    
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k${unit ? ' ' + unit : ''}`;
    }
    if (value >= 100) {
        return `${value.toFixed(0)}${unit ? ' ' + unit : ''}`;
    }
    if (value >= 1) {
        return `${value.toFixed(1)}${unit ? ' ' + unit : ''}`;
    }
    return `${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
}

// ── Inject Widget Styles ──────────────────────────────
export function injectWidgetStyles() {
    if (document.getElementById('analytics-widget-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'analytics-widget-styles';
    styles.textContent = `
        .analytics-widget {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        /* Dial */
        .analytics-dial {
            position: relative;
        }
        .dial-svg {
            display: block;
        }
        .dial-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        .dial-value {
            font-family: 'Oswald', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .dial-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        /* Bar */
        .analytics-bar {
            width: 100%;
        }
        .bar-container {
            width: 100%;
            background: var(--bg-secondary);
            position: relative;
        }
        .bar-fill {
            position: absolute;
            bottom: 0;
            width: 100%;
            transition: height 0.3s ease;
        }
        .bar-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-top: 8px;
        }
        .bar-value {
            font-family: 'Oswald', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }

        /* Line/Area */
        .analytics-line, .analytics-area {
            width: 100%;
        }
        .line-svg, .area-svg {
            width: 100%;
            height: auto;
        }
        .line-label, .area-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
        }
        .line-value, .area-value {
            font-family: 'Oswald', sans-serif;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
        }

        /* Sparkline */
        .analytics-sparkline {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
        }
        .sparkline-svg {
            flex: 1;
        }
        .sparkline-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--text-primary);
        }

        /* Gauge */
        .analytics-gauge {
            position: relative;
        }
        .gauge-svg {
            display: block;
        }
        .gauge-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-top: 8px;
        }
        .gauge-value {
            font-family: 'Oswald', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }

        /* Progress */
        .analytics-progress {
            width: 100%;
        }
        .progress-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .progress-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
        }
        .progress-value {
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
        }
        .progress-bar {
            height: 8px;
            background: var(--bg-secondary);
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }

        /* Number */
        .analytics-number {
            text-align: center;
        }
        .analytics-number-large .number-value {
            font-family: 'Oswald', sans-serif;
            font-size: 42px;
            font-weight: 600;
            line-height: 1;
        }
        .analytics-number-medium .number-value {
            font-family: 'Oswald', sans-serif;
            font-size: 28px;
            font-weight: 600;
            line-height: 1;
        }
        .analytics-number-small .number-value {
            font-family: 'Oswald', sans-serif;
            font-size: 18px;
            font-weight: 600;
            line-height: 1;
        }
        .number-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-top: 8px;
        }
    `;
    document.head.appendChild(styles);
}

// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Build Log Renderer
// Takes data from fetchBuildLog() and injects into the
// template DOM. Now includes comments with GIF support.
// ════════════════════════════════════════════════════════

import { escapeHtml, formatDate, formatDateShort, formatTimestamp } from './supabase-client.js';
import { renderCommentsSection, injectCommentsStyles } from './comments.js';

// ── Main entry point ───────────────────────────────────
export function renderBuildLog(data) {
    if (data.error) {
        document.querySelector('.log-page').innerHTML = `
            <div style="padding:80px 24px;text-align:center;">
                <div style="font-family:'Oswald',sans-serif;font-size:24px;color:var(--text-primary);margin-bottom:8px;">Log Not Found</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);">${escapeHtml(data.error)}</div>
            </div>
        `;
        return;
    }

    const { log, builder, project, notes, metrics, allLogs, prevLog, nextLog, isMember } = data;

    // Set access level on the page root
    const page = document.getElementById('log-page');
    page.dataset.access = isMember ? 'member' : 'public';

    renderBreadcrumb(log, project);
    renderProjectContext(project, allLogs, log);
    renderHeader(log, builder);
    renderProgressStrip(log, project, allLogs);
    renderPublicContent(log);
    renderVisualSnapshot(log);
    renderTags(log);
    renderPrivateContent(notes, log, isMember);
    renderContinuityNav(prevLog, nextLog);
    renderSidebar(log, builder, metrics);
    renderComments(log, builder); // NEW: Comments section
    renderSystemFooter(log, builder, project);
    renderStructuredData(log, builder, project, metrics);

    setupInteractions();
}

// ── Comments Section ───────────────────────────────────
function renderComments(log, builder) {
    // Inject styles once
    injectCommentsStyles();
    
    // Find or create comments container
    let commentsContainer = document.getElementById('comments-section');
    if (!commentsContainer) {
        // Add after continuity nav, before system footer
        const continuityNav = document.querySelector('.log-continuity');
        if (continuityNav) {
            commentsContainer = document.createElement('div');
            commentsContainer.id = 'comments-section';
            continuityNav.parentNode.insertBefore(commentsContainer, continuityNav.nextSibling);
        }
    }
    
    if (commentsContainer) {
        renderCommentsSection(commentsContainer, {
            builderId: builder?.id || log.builder_id,
            buildLogId: log.id
        });
    }
}

// ── Breadcrumb ─────────────────────────────────────────
function renderBreadcrumb(log, project) {
    const el = document.querySelector('.log-breadcrumb');
    if (!el) return;

    const projectName = project?.name || log.project_name || 'Project';
    const logLabel = log.log_index != null ? `Build Log #${log.log_index}` : 'Build Log';

    el.innerHTML = `
        <a href="feed.html" class="breadcrumb-item">Feed</a>
        <span class="breadcrumb-sep">/</span>
        <a href="feed.html" class="breadcrumb-item">Projects</a>
        <span class="breadcrumb-sep">/</span>
        <a href="builder-profile.html?id=${escapeHtml(log.builder_id)}" class="breadcrumb-item">${escapeHtml(projectName)}</a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-item current">${escapeHtml(logLabel)}</span>
    `;
}

// ── Project Context Panel ──────────────────────────────
function renderProjectContext(project, allLogs, currentLog) {
    const el = document.getElementById('project-context');
    if (!el) return;

    if (!project) {
        el.style.display = 'none';
        return;
    }

    const titleEl = el.querySelector('.project-context-title');
    if (titleEl) titleEl.textContent = project.name || 'Untitled Project';

    const phaseBadge = el.querySelector('.project-phase-badge');
    if (phaseBadge) {
        phaseBadge.textContent = project.phase || 'active';
        phaseBadge.dataset.phase = (project.phase || 'infrastructure').toLowerCase();
    }

    const statusBadge = el.querySelector('.project-context-header-left .status-badge');
    if (statusBadge) {
        statusBadge.textContent = project.status === 'active' ? 'Active' : (project.status || 'Active');
        statusBadge.dataset.status = project.status === 'active' ? 'in-progress' : (project.status || 'in-progress');
    }

    const nameEl = el.querySelector('.project-name');
    if (nameEl) nameEl.textContent = project.name || '';

    const descEl = el.querySelector('.project-desc');
    if (descEl) descEl.textContent = project.description || '';

    const stackContainer = el.querySelector('.project-stack-tags');
    if (stackContainer && project.stack) {
        const tags = Array.isArray(project.stack) ? project.stack : project.stack.split(',');
        stackContainer.innerHTML = tags.map(t =>
            `<span class="project-stack-tag">${escapeHtml(t.trim())}</span>`
        ).join('');
    }

    const metaRows = el.querySelectorAll('.project-meta-row');
    if (metaRows.length >= 3) {
        metaRows[0].querySelector('.project-meta-val').textContent = formatDate(project.started_at || project.created_at);
        metaRows[1].querySelector('.project-meta-val').textContent = formatDate(project.eta || '');
        metaRows[2].querySelector('.project-meta-val').textContent = `${allLogs.length} total`;
    }

    const pct = project.completion_pct || 0;
    const progressFill = el.querySelector('.progress-bar-fill');
    if (progressFill) progressFill.style.width = `${pct}%`;

    const progressPct = el.querySelector('.progress-pct');
    if (progressPct) progressPct.innerHTML = `${pct}<span class="progress-pct-unit">%</span>`;

    const focusEl = el.querySelector('.progress-focus');
    if (focusEl) focusEl.textContent = project.current_focus || '';

    const milestonesCol = el.querySelector('.milestones-col');
    if (milestonesCol && project.milestones && Array.isArray(project.milestones)) {
        const label = milestonesCol.querySelector('.milestones-label');
        milestonesCol.innerHTML = '';
        if (label) milestonesCol.appendChild(label);
        else milestonesCol.innerHTML = '<span class="milestones-label">Milestones</span>';

        project.milestones.forEach(m => {
            const state = m.state || 'upcoming';
            milestonesCol.innerHTML += `
                <div class="milestone-item ${state}">
                    <span class="milestone-dot ${state}"></span>
                    <span class="milestone-text">${escapeHtml(m.text)}</span>
                </div>
            `;
        });
    }

    const indexContainer = el.querySelector('.build-log-index');
    if (indexContainer && allLogs.length > 0) {
        indexContainer.innerHTML = `
            <span class="build-log-index-label">Build Log Index</span>
            ${allLogs.map(l => {
                const isActive = l.id === currentLog.id;
                const statusLabel = l.status || 'shipped';
                const statusClass = statusLabel.toLowerCase().replace(/\s+/g, '-');
                return `
                    <a href="build-log.html?id=${escapeHtml(l.id)}" class="log-index-item ${isActive ? 'active' : ''}">
                        <span class="log-index-date">${l.created_at ? formatDateShort(l.created_at) : '—'}</span>
                        <span class="log-index-title">${escapeHtml(l.title || 'Untitled')}</span>
                        <span class="log-index-status" data-s="${escapeHtml(statusClass)}">${escapeHtml(statusLabel)}</span>
                    </a>
                `;
            }).join('')}
        `;
    }
}

// ── Header ─────────────────────────────────────────────
function renderHeader(log, builder) {
    const projectLabel = document.querySelector('.log-project');
    if (projectLabel) projectLabel.textContent = log.project_name || builder?.name || 'Project';

    const titleEl = document.querySelector('.log-title');
    if (titleEl) titleEl.textContent = log.title || 'Untitled Build Log';

    const statusBadge = document.querySelector('.log-header-badges .status-badge');
    if (statusBadge) {
        const status = (log.status || 'shipped').toLowerCase();
        statusBadge.textContent = capitalize(status);
        statusBadge.dataset.status = status.replace(/\s+/g, '-');
    }

    const visBadge = document.querySelector('.log-header-badges .visibility-badge');
    if (visBadge) {
        const vis = log.is_public ? 'public' : 'members';
        visBadge.textContent = capitalize(vis);
        visBadge.dataset.vis = vis;
    }

    if (builder) {
        const avatarEl = document.querySelector('.log-builder-avatar');
        if (avatarEl) avatarEl.textContent = builder.avatar_initials || builder.name?.substring(0, 2).toUpperCase() || '--';

        const nameEl = document.querySelector('.log-builder-name');
        if (nameEl) nameEl.textContent = builder.name || 'Unknown Builder';

        const builderLink = document.querySelector('.log-builder');
        if (builderLink) builderLink.href = `builder-profile.html?id=${builder.id}`;
    }

    const tsEl = document.querySelector('.log-timestamp');
    if (tsEl) tsEl.textContent = formatTimestamp(log.created_at);
}

// ── Progress Signal Strip ──────────────────────────────
function renderProgressStrip(log, project, allLogs) {
    const strip = document.querySelector('.progress-signal-strip');
    if (!strip) return;

    const cells = strip.querySelectorAll('.pss-cell');
    if (cells.length < 4) return;

    const pct = project?.completion_pct || log.project_completion_pct || 0;
    cells[0].querySelector('.pss-number').textContent = pct;
    cells[0].querySelector('.pss-unit').textContent = '% complete';
    const barFill = cells[0].querySelector('.pss-bar-fill');
    if (barFill) barFill.style.width = `${pct}%`;

    const impact = (log.impact || 'medium').toLowerCase();
    const impactDots = cells[1].querySelector('.pss-impact-dots');
    const impactText = cells[1].querySelector('.pss-impact-text');
    if (impactDots) {
        const count = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
        impactDots.innerHTML = [1,2,3].map(i =>
            `<span class="pss-impact-dot ${i <= count ? 'filled' : ''} ${impact === 'high' ? 'high' : ''}"></span>`
        ).join('');
    }
    if (impactText) impactText.textContent = capitalize(impact);

    const confidence = (log.confidence || 'medium').toLowerCase();
    const confDelta = (log.confidence_delta || 'flat').toLowerCase();
    const arrowEl = cells[2].querySelector('.pss-delta-arrow');
    const deltaText = cells[2].querySelector('.pss-delta-text');
    if (arrowEl) {
        arrowEl.textContent = confDelta === 'up' ? '↑' : confDelta === 'down' ? '↓' : '→';
        arrowEl.className = `pss-delta-arrow ${confDelta}`;
    }
    if (deltaText) {
        const prev = log.confidence_previous ? ` (was ${capitalize(log.confidence_previous)})` : '';
        deltaText.textContent = `${capitalize(confidence)}${prev}`;
    }

    const logIndex = log.log_index || (allLogs.findIndex(l => l.id === log.id) + 1);
    cells[3].querySelector('.pss-number').textContent = logIndex;
    cells[3].querySelector('.pss-unit').textContent = `of ${allLogs.length}`;
}

// ── Public Content ─────────────────────────────────────
function renderPublicContent(log) {
    const summaryEl = document.querySelector('.log-summary');
    if (summaryEl) summaryEl.textContent = log.summary || log.message || '';

    const changeList = document.querySelector('.change-list');
    if (changeList) {
        const changes = log.changes || [];
        if (changes.length > 0) {
            changeList.innerHTML = changes.map(c =>
                `<li>${escapeHtml(c)}</li>`
            ).join('');
        } else if (log.changes_text) {
            changeList.innerHTML = log.changes_text.split('\n').filter(Boolean).map(c =>
                `<li>${escapeHtml(c.trim())}</li>`
            ).join('');
        }
    }

    const rationaleEl = document.querySelector('.log-rationale');
    if (rationaleEl) rationaleEl.textContent = log.rationale || '';

    const artifactList = document.querySelector('.artifact-list');
    if (artifactList) {
        const artifacts = log.artifacts || [];
        if (artifacts.length > 0) {
            artifactList.innerHTML = artifacts.map(a => `
                <a href="${escapeHtml(a.url || '#')}" class="artifact-item">
                    <span class="artifact-type">${escapeHtml(a.type || 'FILE')}</span>
                    <span class="artifact-name">${escapeHtml(a.name || 'Untitled')}</span>
                </a>
            `).join('');
        }
    }
}

// ── Visual Snapshot ────────────────────────────────────
function renderVisualSnapshot(log) {
    const container = document.querySelector('.visual-snapshot');
    if (!container) return;

    if (!log.visual_snapshot_url && !log.visual_snapshot_svg) {
        const section = container.closest('.log-section');
        if (section) section.style.display = 'none';
        return;
    }

    if (log.visual_snapshot_url) {
        const diagramEl = container.querySelector('.visual-snapshot-diagram');
        if (diagramEl) {
            const img = document.createElement('img');
            img.className = 'visual-snapshot-img';
            img.src = log.visual_snapshot_url;
            img.alt = log.visual_snapshot_caption || 'Build snapshot';
            diagramEl.replaceWith(img);
        }
    } else if (log.visual_snapshot_svg) {
        const diagramEl = container.querySelector('.visual-snapshot-diagram');
        if (diagramEl) {
            diagramEl.outerHTML = log.visual_snapshot_svg;
        }
    }

    const typeEl = container.querySelector('.visual-snapshot-type');
    if (typeEl) typeEl.textContent = log.visual_snapshot_type || 'IMG';

    const textEl = container.querySelector('.visual-snapshot-text');
    if (textEl) textEl.textContent = log.visual_snapshot_caption || '';
}

// ── Tags ───────────────────────────────────────────────
function renderTags(log) {
    const tagLists = document.querySelectorAll('.tag-list');
    const tags = log.tags || [];

    tagLists.forEach(list => {
        if (tags.length > 0) {
            list.innerHTML = tags.map(t =>
                `<span class="system-tag">${escapeHtml(t)}</span>`
            ).join('');
        }
    });
}

// ── Private Content (Members Only) ─────────────────────
function renderPrivateContent(notes, log, isMember) {
    const unlockedSection = document.querySelector('.members-unlocked');
    if (!unlockedSection) return;

    if (!isMember || !notes || notes.length === 0) return;

    const sections = {
        reasoning: [],
        tradeoffs: [],
        problems: [],
        next_moves: [],
        metrics: [],
    };

    notes.forEach(n => {
        const section = (n.section || n.note_type || 'reasoning').toLowerCase().replace(/[\s-]/g, '_');
        if (sections[section]) {
            sections[section].push(n);
        } else {
            sections.reasoning.push(n);
        }
    });

    const reasoningEl = unlockedSection.querySelector('.internal-text');
    if (reasoningEl && sections.reasoning.length > 0) {
        reasoningEl.textContent = sections.reasoning.map(n => n.content).join('\n\n');
    } else if (reasoningEl && log.internal_reasoning) {
        reasoningEl.textContent = log.internal_reasoning;
    }

    const tradeoffList = unlockedSection.querySelector('.tradeoff-list');
    if (tradeoffList && sections.tradeoffs.length > 0) {
        tradeoffList.innerHTML = sections.tradeoffs.map(n =>
            `<li>${escapeHtml(n.content)}</li>`
        ).join('');
    } else if (tradeoffList && log.tradeoffs) {
        const items = Array.isArray(log.tradeoffs) ? log.tradeoffs : log.tradeoffs.split('\n').filter(Boolean);
        tradeoffList.innerHTML = items.map(t => `<li>${escapeHtml(t)}</li>`).join('');
    }

    const problemsList = unlockedSection.querySelector('.problems-list');
    if (problemsList && sections.problems.length > 0) {
        problemsList.innerHTML = sections.problems.map(n =>
            `<li>${escapeHtml(n.content)}</li>`
        ).join('');
    } else if (problemsList && log.problems) {
        const items = Array.isArray(log.problems) ? log.problems : log.problems.split('\n').filter(Boolean);
        problemsList.innerHTML = items.map(p => `<li>${escapeHtml(p)}</li>`).join('');
    }

    const nextList = unlockedSection.querySelector('.next-list');
    if (nextList && sections.next_moves.length > 0) {
        nextList.innerHTML = sections.next_moves.map(n => {
            const done = n.is_done || n.state === 'done';
            return `
                <li>
                    <span class="next-check ${done ? 'done' : ''}"></span>
                    ${escapeHtml(n.content)}
                </li>
            `;
        }).join('');
    } else if (nextList && log.next_moves) {
        const items = Array.isArray(log.next_moves) ? log.next_moves : log.next_moves.split('\n').filter(Boolean);
        nextList.innerHTML = items.map(m => `
            <li>
                <span class="next-check"></span>
                ${escapeHtml(m)}
            </li>
        `).join('');
    }

    const signalsRow = unlockedSection.querySelector('.signals-row');
    if (signalsRow && log.metrics_snapshot) {
        const ms = log.metrics_snapshot;
        signalsRow.innerHTML = Object.entries(ms).map(([key, val]) => `
            <div class="signal-item">
                <span class="signal-key">${escapeHtml(formatMetricKey(key))}</span>
                <span class="signal-val">${escapeHtml(String(val.value || val))}${val.unit ? `<span class="signal-unit">${escapeHtml(val.unit)}</span>` : ''}</span>
            </div>
        `).join('');
    }
}

// ── Continuity Navigation ──────────────────────────────
function renderContinuityNav(prevLog, nextLog) {
    const nav = document.querySelector('.log-continuity');
    if (!nav) return;

    nav.innerHTML = '';

    if (prevLog) {
        nav.innerHTML += `
            <a href="build-log.html?id=${escapeHtml(prevLog.id)}" class="log-continuity-item prev">
                <span class="log-continuity-dir">← Previous Log</span>
                <span class="log-continuity-title">${escapeHtml(prevLog.title || 'Previous Log')}</span>
                <span class="log-continuity-date">${formatDate(prevLog.created_at)}</span>
            </a>
        `;
    } else {
        nav.innerHTML += `<div class="log-continuity-empty"></div>`;
    }

    if (nextLog) {
        nav.innerHTML += `
            <a href="build-log.html?id=${escapeHtml(nextLog.id)}" class="log-continuity-item next">
                <span class="log-continuity-dir">Next Log →</span>
                <span class="log-continuity-title">${escapeHtml(nextLog.title || 'Next Log')}</span>
                <span class="log-continuity-date">${formatDate(nextLog.created_at)}</span>
            </a>
        `;
    } else {
        nav.innerHTML += `<div class="log-continuity-empty"></div>`;
    }
}

// ── Sidebar ────────────────────────────────────────────
function renderSidebar(log, builder, metrics) {
    const sidebar = document.querySelector('.log-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = '';

    const status = (log.status || 'shipped').toLowerCase();
    sidebar.innerHTML += sidebarBlock('Status',
        `<span class="status-badge" data-status="${escapeHtml(status.replace(/\s+/g, '-'))}">${escapeHtml(capitalize(status))}</span>`
    );

    sidebar.innerHTML += sidebarBlock('Project',
        `<div class="sidebar-value"><a href="builder-profile.html?id=${escapeHtml(log.builder_id)}">${escapeHtml(log.project_name || builder?.name || 'Project')}</a></div>`
    );

    if (builder) {
        sidebar.innerHTML += sidebarBlock('Builder',
            `<div class="sidebar-value"><a href="builder-profile.html?id=${escapeHtml(builder.id)}">${escapeHtml(builder.name || 'Unknown')}</a></div>`
        );
    }

    sidebar.innerHTML += sidebarBlock('Created',
        `<div class="sidebar-value">${escapeHtml(formatTimestamp(log.created_at))}</div>`
    );

    const components = log.components_touched || log.components || [];
    if (components.length > 0) {
        sidebar.innerHTML += sidebarBlock('Components',
            `<div class="sidebar-kv">${components.map(c =>
                `<div class="sidebar-value">${escapeHtml(c)}</div>`
            ).join('')}</div>`
        );
    }

    const complexity = log.complexity || 'medium';
    const confidence = log.confidence || 'medium';
    sidebar.innerHTML += sidebarBlock('Assessment', `
        <div class="sidebar-kv">
            <div class="sidebar-kv-row">
                <span class="sidebar-kv-key">Complexity</span>
                <span class="sidebar-kv-val" data-level="${escapeHtml(complexity.toLowerCase())}">${escapeHtml(capitalize(complexity))}</span>
            </div>
            <div class="sidebar-kv-row">
                <span class="sidebar-kv-key">Confidence</span>
                <span class="sidebar-kv-val" data-level="${escapeHtml(confidence.toLowerCase())}">${escapeHtml(capitalize(confidence))}</span>
            </div>
        </div>
    `);

    if (log.parent_log_id || log.parent_log_title) {
        sidebar.innerHTML += sidebarBlock('Parent Logs',
            `<div class="sidebar-value"><a href="build-log.html?id=${escapeHtml(log.parent_log_id || '')}">${escapeHtml(log.parent_log_title || 'Parent Log')}</a></div>`
        );
    }

    if (log.metrics_history) {
        sidebar.innerHTML += sidebarBlock('Trends (Last 7 Logs)',
            renderMicroCharts(log.metrics_history, log.metrics_snapshot)
        );
    }

    const tags = log.tags || [];
    if (tags.length > 0) {
        sidebar.innerHTML += sidebarBlock('Tags',
            `<div class="tag-list">${tags.map(t =>
                `<span class="system-tag">${escapeHtml(t)}</span>`
            ).join('')}</div>`
        );
    }
}

function sidebarBlock(label, content) {
    return `
        <div class="sidebar-block">
            <div class="sidebar-label">${escapeHtml(label)}</div>
            ${content}
        </div>
    `;
}

// ── Micro Charts ───────────────────────────────────────
function renderMicroCharts(history, snapshot) {
    const charts = [];
    const chartConfig = {
        test_coverage: { label: 'Test Coverage', unit: '%', color: '#32d74b' },
        build_time_ms: { label: 'Build Time', unit: 's', color: '#ff6600', transform: v => (v / 1000).toFixed(1) },
        deploy_duration_s: { label: 'Deploy', unit: 's', color: '#888888' },
        lines_changed: { label: 'Lines Changed', unit: '', color: '#ff6600' },
    };

    for (const [key, config] of Object.entries(chartConfig)) {
        const data = history[key];
        if (!data || data.length === 0) continue;

        const currentVal = snapshot?.[key]?.value ?? data[data.length - 1];
        const displayVal = config.transform ? config.transform(currentVal) : currentVal;

        const points = sparklinePoints(data, 80, 32);
        const areaPoints = `0,32 ${points} 80,32`;

        charts.push(`
            <div class="micro-chart-row">
                <div class="micro-chart-info">
                    <span class="micro-chart-label">${config.label}</span>
                    <span class="micro-chart-value">${displayVal}${config.unit ? `<span class="micro-chart-unit">${config.unit}</span>` : ''}</span>
                </div>
                <svg class="micro-chart-svg" width="80" height="32" viewBox="0 0 80 32">
                    <polygon class="chart-area" points="${areaPoints}" fill="${config.color}"/>
                    <polyline points="${points}" stroke="${config.color}"/>
                </svg>
            </div>
        `);
    }

    return `<div class="micro-charts-grid">${charts.join('')}</div>`;
}

function sparklinePoints(data, width, height) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1 || 1);

    return data.map((val, i) => {
        const x = (i * step).toFixed(1);
        const y = (height - ((val - min) / range) * (height - 4) - 2).toFixed(1);
        return `${x},${y}`;
    }).join(' ');
}

// ── System Footer ──────────────────────────────────────
function renderSystemFooter(log, builder, project) {
    const grid = document.querySelector('.system-meta-grid');
    if (!grid) return;

    const items = [
        ['Log ID', log.id],
        ['Builder ID', builder?.id || log.builder_id],
        ['Project ID', project?.id || log.project_id || ''],
        ['Created', log.created_at],
        ['Updated', log.updated_at || log.created_at],
        ['Schema Version', log.schema_version || '1.0'],
        ['Parent Logs', log.parent_log_id || ''],
        ['Components', (log.components_touched || []).join(', ')],
        ['Complexity', log.complexity || ''],
        ['Confidence', log.confidence || ''],
        ['Visibility', log.is_public ? 'public' : 'members'],
        ['Permalink', `builderos.dev/log/${log.id}`],
    ];

    grid.innerHTML = items.filter(([, v]) => v).map(([key, val]) => `
        <div class="system-meta-item">
            <span class="system-meta-key">${escapeHtml(key)}</span>
            <span class="system-meta-val">${escapeHtml(String(val))}</span>
        </div>
    `).join('');
}

// ── Structured Data (JSON-LD) ──────────────────────────
function renderStructuredData(log, builder, project, metrics) {
    const el = document.getElementById('log-structured-data');
    if (!el) return;

    el.textContent = JSON.stringify({
        "@context": "https://builderos.dev/schema",
        "@type": "BuildLog",
        "id": log.id,
        "version": log.schema_version || "1.0",
        "builder": {
            "id": builder?.id || log.builder_id,
            "name": builder?.name || '',
            "role": builder?.role || '',
        },
        "project": project ? {
            "id": project.id,
            "name": project.name,
            "status": project.status,
            "phase": project.phase,
            "completion_pct": project.completion_pct,
        } : null,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
        "status": log.status,
        "visibility": log.is_public ? 'public' : 'members',
        "tags": log.tags || [],
    }, null, 4);
}

// ── Setup Interactions ─────────────────────────────────
function setupInteractions() {
    const footerEl = document.getElementById('system-footer');
    const footerToggle = document.getElementById('footer-toggle');
    if (footerEl && footerToggle) {
        footerToggle.addEventListener('click', () => footerEl.classList.toggle('open'));
    }

    const projectCtx = document.getElementById('project-context');
    const projectToggle = document.getElementById('project-toggle');
    if (projectCtx && projectToggle) {
        projectToggle.addEventListener('click', () => projectCtx.classList.toggle('open'));
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'v' && !e.metaKey && !e.ctrlKey && e.target === document.body) {
            const page = document.getElementById('log-page');
            if (page) {
                page.dataset.access = page.dataset.access === 'public' ? 'member' : 'public';
            }
        }
    });
}

// ── Helpers ────────────────────────────────────────────
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatMetricKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
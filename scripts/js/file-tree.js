// ════════════════════════════════════════════════════════
// PARKS SYSTEM — File Tree Component
// Visualizes projects as folders with logs as files
// Data tree structure for reclaim visualization
// ════════════════════════════════════════════════════════

import { supabase, escapeHtml } from './supabase-client.js';
import { fetchProject, fetchUserProjects } from './data.js';

// ── Render File Tree ─────────────────────────────────────
export async function renderFileTree(container, userId, onProjectSelect = null, onLogSelect = null) {
    const { projects, error } = await fetchUserProjects(userId);
    
    if (error) {
        container.innerHTML = `<div class="file-tree-error">${escapeHtml(error)}</div>`;
        return;
    }

    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="file-tree-empty">
                <div class="file-tree-empty-icon">📁</div>
                <div class="file-tree-empty-text">No projects yet</div>
            </div>
        `;
        return;
    }

    // Fetch logs for each project
    const projectsWithLogs = await Promise.all(
        projects.map(async (project) => {
            const { logs } = await fetchProject(project.id);
            return { ...project, logs: logs || [] };
        })
    );

    // Build tree structure (group by parent)
    const tree = buildProjectTree(projectsWithLogs);

    container.innerHTML = renderTreeHTML(tree, onProjectSelect, onLogSelect);
    
    // Bind expand/collapse handlers
    bindTreeHandlers(container);
}

// ── Build Project Tree Structure ────────────────────────
function buildProjectTree(projects) {
    const projectMap = new Map();
    const rootProjects = [];

    // Create map of all projects
    projects.forEach(p => {
        projectMap.set(p.id, { ...p, children: [] });
    });

    // Build tree
    projects.forEach(p => {
        const node = projectMap.get(p.id);
        if (p.parent_project_id && projectMap.has(p.parent_project_id)) {
            // Has parent - add to parent's children
            projectMap.get(p.parent_project_id).children.push(node);
        } else {
            // Root project
            rootProjects.push(node);
        }
    });

    return rootProjects;
}

// ── Render Tree HTML ────────────────────────────────────
function renderTreeHTML(tree, onProjectSelect, onLogSelect, depth = 0) {
    return tree.map(node => {
        const isReclaimed = !!node.reclaimed_from_project_id;
        const indent = depth * 20;
        
        return `
            <div class="file-tree-node" style="padding-left: ${indent}px;" data-project-id="${node.id}">
                <div class="file-tree-folder ${node.children.length > 0 ? 'has-children' : ''}" 
                     data-project-id="${node.id}">
                    <button type="button" class="file-tree-expand" ${node.children.length === 0 ? 'disabled' : ''}>
                        ${node.children.length > 0 ? '▶' : ''}
                    </button>
                    <svg class="file-tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="file-tree-name" ${onProjectSelect ? `onclick="window.selectProject('${node.id}')"` : ''}>
                        ${escapeHtml(node.name)}
                    </span>
                    ${isReclaimed ? '<span class="file-tree-badge" title="Reclaimed project">↗</span>' : ''}
                </div>
                <div class="file-tree-children" style="display: none;">
                    ${node.logs.length > 0 ? `
                        ${node.logs.map(log => `
                            <div class="file-tree-file" data-log-id="${log.id}">
                                <svg class="file-tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <span class="file-tree-name" ${onLogSelect ? `onclick="window.selectLog('${log.id}')"` : ''}>
                                    ${escapeHtml(log.title || `Log #${log.log_order || log.log_index}`)}
                                </span>
                            </div>
                        `).join('')}
                    ` : `
                        <div class="file-tree-empty-folder">No logs yet</div>
                    `}
                    ${node.children.length > 0 ? renderTreeHTML(node.children, onProjectSelect, onLogSelect, depth + 1) : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ── Bind Tree Handlers ───────────────────────────────────
function bindTreeHandlers(container) {
    // Expand/collapse folders
    container.querySelectorAll('.file-tree-expand').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const folder = btn.closest('.file-tree-folder');
            const children = folder.nextElementSibling;
            const isExpanded = children.style.display !== 'none';
            
            children.style.display = isExpanded ? 'none' : 'block';
            btn.textContent = isExpanded ? '▶' : '▼';
            folder.classList.toggle('expanded', !isExpanded);
        });
    });

    // Project selection
    if (window.selectProject) {
        container.querySelectorAll('.file-tree-folder .file-tree-name').forEach(el => {
            el.style.cursor = 'pointer';
        });
    }

    // Log selection
    if (window.selectLog) {
        container.querySelectorAll('.file-tree-file .file-tree-name').forEach(el => {
            el.style.cursor = 'pointer';
        });
    }
}

// ── Inject File Tree Styles ─────────────────────────────
export function injectFileTreeStyles() {
    if (document.getElementById('file-tree-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'file-tree-styles';
    styles.textContent = `
        .file-tree {
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: var(--text-secondary);
        }
        .file-tree-node {
            margin-bottom: 2px;
        }
        .file-tree-folder,
        .file-tree-file {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            transition: all 0.15s ease;
        }
        .file-tree-folder:hover,
        .file-tree-file:hover {
            background: var(--bg-panel);
            color: var(--text-primary);
        }
        .file-tree-expand {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 10px;
            padding: 0;
        }
        .file-tree-expand:disabled {
            cursor: default;
            opacity: 0;
        }
        .file-tree-expand:hover:not(:disabled) {
            color: var(--accent);
        }
        .file-tree-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            color: var(--accent);
        }
        .file-tree-name {
            flex: 1;
            user-select: none;
        }
        .file-tree-badge {
            font-size: 10px;
            color: var(--accent);
            padding: 2px 6px;
            background: rgba(255, 102, 0, 0.1);
            border: 1px solid var(--accent);
            margin-left: auto;
        }
        .file-tree-children {
            margin-left: 24px;
        }
        .file-tree-empty-folder {
            padding: 8px 16px;
            color: var(--text-muted);
            font-size: 11px;
            font-style: italic;
        }
        .file-tree-error {
            padding: 16px;
            text-align: center;
            color: var(--bad);
        }
        .file-tree-empty {
            padding: 40px 20px;
            text-align: center;
        }
        .file-tree-empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        .file-tree-empty-text {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(styles);
}

// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Project Selector Component
// File-tree style project selector for log editor
// Must be at the very top, dead simple
// ════════════════════════════════════════════════════════

import { supabase, getSession, escapeHtml } from './supabase-client.js';
import { fetchUserProjects, createProject, reclaimProject } from './data.js';

// ── Create Project Selector Component ──────────────────
export async function createProjectSelector(container, onProjectSelected, currentProjectId = null) {
    const session = await getSession();
    if (!session) {
        container.innerHTML = '<div class="project-selector-error">Please sign in to select a project</div>';
        return;
    }

    // Fetch user's projects
    const { projects, error } = await fetchUserProjects(session.user.id);
    
    if (error) {
        container.innerHTML = `<div class="project-selector-error">${escapeHtml(error)}</div>`;
        return;
    }

    const projectsList = projects || [];
    const selectedProject = currentProjectId 
        ? projectsList.find(p => p.id === currentProjectId)
        : null;

    container.innerHTML = `
        <div class="project-selector">
            <div class="project-selector-header">
                <span class="project-selector-label">Project</span>
                <button type="button" class="project-selector-new-btn" id="new-project-btn">+ New Project</button>
            </div>
            <div class="project-selector-content">
                ${projectsList.length === 0 ? `
                    <div class="project-selector-empty">
                        <div class="project-selector-empty-icon">📁</div>
                        <div class="project-selector-empty-text">No projects yet</div>
                        <button type="button" class="project-selector-empty-btn" id="create-first-project">Create Your First Project</button>
                    </div>
                ` : `
                    <div class="project-selector-list">
                        ${projectsList.map(project => `
                            <div class="project-selector-item ${selectedProject?.id === project.id ? 'selected' : ''}" 
                                 data-project-id="${project.id}"
                                 data-project-name="${escapeHtml(project.name)}">
                                <svg class="project-selector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span class="project-selector-name">${escapeHtml(project.name)}</span>
                                ${project.reclaimed_from_project_id ? `
                                    <span class="project-selector-badge" title="Reclaimed project">↗</span>
                                ` : ''}
                                <button type="button" class="project-selector-reclaim-btn" 
                                        data-project-id="${project.id}"
                                        title="Reclaim this project to build on top of it">
                                    Reclaim
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;

    // Select project handler
    container.querySelectorAll('.project-selector-item').forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.dataset.projectId;
            const projectName = item.dataset.projectName;
            
            // Update selected state
            container.querySelectorAll('.project-selector-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Call callback
            if (onProjectSelected) {
                onProjectSelected(projectId, projectName);
            }
        });
    });

    // New project handlers
    const newProjectBtn = container.querySelector('#new-project-btn');
    const createFirstBtn = container.querySelector('#create-first-project');
    
    const handleNewProject = async () => {
        const name = prompt('Project name:');
        if (!name || !name.trim()) return;
        
        const { project, error } = await createProject(name.trim());
        if (error) {
            alert(`Failed to create project: ${error}`);
            return;
        }
        
        // Re-render selector with new project
        await createProjectSelector(container, onProjectSelected, project.id);
        
        // Select the new project
        if (onProjectSelected) {
            onProjectSelected(project.id, project.name);
        }
    };
    
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', handleNewProject);
    }
    if (createFirstBtn) {
        createFirstBtn.addEventListener('click', handleNewProject);
    }

    // Reclaim button handlers
    container.querySelectorAll('.project-selector-reclaim-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = btn.dataset.projectId;
            const project = projectsList.find(p => p.id === projectId);
            
            if (!project) return;
            
            if (!confirm(`Reclaim "${project.name}"? This will create a new project based on this one that you can build on top of.`)) {
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Reclaiming...';
            
            const { project: newProject, error } = await reclaimProject(projectId);
            
            if (error) {
                alert(`Failed to reclaim project: ${error}`);
                btn.disabled = false;
                btn.textContent = 'Reclaim';
                return;
            }
            
            // Re-render selector with new reclaimed project selected
            await createProjectSelector(container, onProjectSelected, newProject.id);
            
            if (onProjectSelected) {
                onProjectSelected(newProject.id, newProject.name);
            }
        });
    });

    // Return selected project ID
    return selectedProject?.id || (projectsList.length > 0 ? projectsList[0].id : null);
}

// ── Inject Project Selector Styles ─────────────────────
export function injectProjectSelectorStyles() {
    if (document.getElementById('project-selector-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'project-selector-styles';
    styles.textContent = `
        .project-selector {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            margin-bottom: 24px;
        }
        .project-selector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
        }
        .project-selector-label {
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-primary);
        }
        .project-selector-new-btn {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 6px 12px;
            background: var(--accent);
            border: 1px solid var(--accent);
            color: var(--bg-primary);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .project-selector-new-btn:hover {
            background: var(--accent-dark);
            border-color: var(--accent-dark);
        }
        .project-selector-content {
            padding: 8px;
        }
        .project-selector-empty {
            padding: 40px 20px;
            text-align: center;
        }
        .project-selector-empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        .project-selector-empty-text {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 16px;
        }
        .project-selector-empty-btn {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 8px 16px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .project-selector-empty-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        .project-selector-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .project-selector-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            cursor: pointer;
            transition: all 0.15s ease;
            border: 1px solid transparent;
        }
        .project-selector-item:hover {
            background: var(--bg-panel);
            border-color: var(--border);
        }
        .project-selector-item.selected {
            background: var(--bg-panel);
            border-color: var(--accent);
        }
        .project-selector-icon {
            width: 18px;
            height: 18px;
            color: var(--accent);
            flex-shrink: 0;
        }
        .project-selector-name {
            flex: 1;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: var(--text-primary);
        }
        .project-selector-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--accent);
            padding: 2px 6px;
            background: rgba(255, 102, 0, 0.1);
            border: 1px solid var(--accent);
        }
        .project-selector-reclaim-btn {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 4px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.15s ease;
            margin-left: auto;
        }
        .project-selector-reclaim-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        .project-selector-reclaim-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .project-selector-error {
            padding: 16px;
            text-align: center;
            color: var(--bad);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
        }
    `;
    document.head.appendChild(styles);
}

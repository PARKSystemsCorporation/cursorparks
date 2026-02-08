// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Notes Manager
// Project-level notes with sync-based access
// Notes folder UI component
// ════════════════════════════════════════════════════════

import { supabase, getSession, escapeHtml } from './supabase-client.js';
import { fetchUserProjects, fetchProject } from './data.js';

// ── Fetch Notes for Project ────────────────────────────
export async function fetchProjectNotes(projectId) {
    const { data, error } = await supabase
        .from('build_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
    
    if (error) return { error: error.message };
    return { notes: data || [] };
}

// ── Create Note ─────────────────────────────────────────
export async function createNote(projectId, builderId, content, buildLogId = null) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };
    
    const { data: note, error } = await supabase
        .from('build_notes')
        .insert({
            project_id: projectId,
            builder_id: builderId,
            build_log_id: buildLogId,
            content: content.trim()
        })
        .select()
        .maybeSingle();
    
    if (error) return { error: error.message };
    return { note };
}

// ── Update Note ────────────────────────────────────────
export async function updateNote(noteId, content) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };
    
    const { data: note, error } = await supabase
        .from('build_notes')
        .update({
            content: content.trim(),
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .maybeSingle();
    
    if (error) return { error: error.message };
    return { note };
}

// ── Delete Note ─────────────────────────────────────────
export async function deleteNote(noteId) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };
    
    const { error } = await supabase
        .from('build_notes')
        .delete()
        .eq('id', noteId);
    
    if (error) return { error: error.message };
    return { success: true };
}

// ── Render Notes Folder UI ──────────────────────────────
export async function renderNotesFolder(container, builderId, userId) {
    const session = await getSession();
    if (!session) {
        container.innerHTML = '<div class="notes-error">Please sign in to view notes</div>';
        return;
    }

    // Fetch user's projects
    const { projects, error: projectsError } = await fetchUserProjects(userId);
    
    if (projectsError) {
        container.innerHTML = `<div class="notes-error">${escapeHtml(projectsError)}</div>`;
        return;
    }

    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="notes-empty">
                <div class="notes-empty-icon">📝</div>
                <div class="notes-empty-text">No projects yet</div>
                <div class="notes-empty-sub">Create a project to add notes</div>
            </div>
        `;
        return;
    }

    // Fetch notes for each project
    const projectsWithNotes = await Promise.all(
        projects.map(async (project) => {
            const { notes } = await fetchProjectNotes(project.id);
            return { ...project, notes: notes || [] };
        })
    );

    // Filter to only projects that belong to this builder or are synced
    // (RLS will handle access control, but we can filter client-side too)
    const accessibleProjects = projectsWithNotes.filter(p => {
        // User owns the project OR is synced to the builder
        return p.user_id === userId;
    });

    if (accessibleProjects.length === 0) {
        container.innerHTML = `
            <div class="notes-empty">
                <div class="notes-empty-icon">🔒</div>
                <div class="notes-empty-text">No accessible projects</div>
                <div class="notes-empty-sub">Sync to this builder to see their project notes</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="notes-folder">
            ${accessibleProjects.map(project => `
                <div class="notes-project" data-project-id="${project.id}">
                    <div class="notes-project-header">
                        <svg class="notes-project-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="notes-project-name">${escapeHtml(project.name)}</span>
                        <span class="notes-project-count">${project.notes.length}</span>
                        <button type="button" class="notes-add-btn" data-project-id="${project.id}" title="Add note">
                            +
                        </button>
                    </div>
                    <div class="notes-project-content" style="display: ${project.notes.length > 0 ? 'block' : 'none'};">
                        ${project.notes.length > 0 ? `
                            ${project.notes.map(note => `
                                <div class="notes-item" data-note-id="${note.id}">
                                    <div class="notes-item-content">${escapeHtml(note.content)}</div>
                                    <div class="notes-item-meta">
                                        <span class="notes-item-time">${new Date(note.created_at).toLocaleString()}</span>
                                        <button type="button" class="notes-item-edit" data-note-id="${note.id}">Edit</button>
                                        <button type="button" class="notes-item-delete" data-note-id="${note.id}">Delete</button>
                                    </div>
                                </div>
                            `).join('')}
                        ` : `
                            <div class="notes-empty-project">No notes yet</div>
                        `}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Bind handlers
    bindNotesHandlers(container, builderId);
}

// ── Bind Notes Handlers ──────────────────────────────────
function bindNotesHandlers(container, builderId) {
    const session = getSession();
    if (!session) return;

    // Add note button
    container.querySelectorAll('.notes-add-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const projectId = btn.dataset.projectId;
            const content = prompt('Enter note:');
            if (!content || !content.trim()) return;

            const { note, error } = await createNote(projectId, builderId, content);
            if (error) {
                alert(`Failed to create note: ${error}`);
                return;
            }

            // Re-render notes folder
            const userId = (await session).user.id;
            await renderNotesFolder(container, builderId, userId);
        });
    });

    // Edit note button
    container.querySelectorAll('.notes-item-edit').forEach(btn => {
        btn.addEventListener('click', async () => {
            const noteId = btn.dataset.noteId;
            const noteItem = btn.closest('.notes-item');
            const contentEl = noteItem.querySelector('.notes-item-content');
            const currentContent = contentEl.textContent;

            const newContent = prompt('Edit note:', currentContent);
            if (!newContent || newContent.trim() === currentContent) return;

            const { note, error } = await updateNote(noteId, newContent);
            if (error) {
                alert(`Failed to update note: ${error}`);
                return;
            }

            contentEl.textContent = note.content;
        });
    });

    // Delete note button
    container.querySelectorAll('.notes-item-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const noteId = btn.dataset.noteId;
            if (!confirm('Delete this note?')) return;

            const { error } = await deleteNote(noteId);
            if (error) {
                alert(`Failed to delete note: ${error}`);
                return;
            }

            btn.closest('.notes-item').remove();
        });
    });

    // Toggle project content
    container.querySelectorAll('.notes-project-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('notes-add-btn')) return;
            const project = header.closest('.notes-project');
            const content = project.querySelector('.notes-project-content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
    });
}

// ── Inject Notes Styles ────────────────────────────────
export function injectNotesStyles() {
    if (document.getElementById('notes-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notes-styles';
    styles.textContent = `
        .notes-folder {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .notes-project {
            border: 1px solid var(--border);
            background: var(--bg-panel);
        }
        .notes-project-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .notes-project-header:hover {
            background: var(--bg-secondary);
        }
        .notes-project-icon {
            width: 18px;
            height: 18px;
            color: var(--accent);
            flex-shrink: 0;
        }
        .notes-project-name {
            flex: 1;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
        }
        .notes-project-count {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
            padding: 2px 8px;
            background: var(--bg-secondary);
            border-radius: 2px;
        }
        .notes-add-btn {
            font-family: 'JetBrains Mono', monospace;
            font-size: 16px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--accent);
            border: none;
            color: var(--bg-primary);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .notes-add-btn:hover {
            background: var(--accent-dark);
        }
        .notes-project-content {
            padding: 8px 16px 16px;
            border-top: 1px solid var(--border);
        }
        .notes-item {
            padding: 12px;
            margin-bottom: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
        }
        .notes-item-content {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            color: var(--text-primary);
            margin-bottom: 8px;
            white-space: pre-wrap;
        }
        .notes-item-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
        }
        .notes-item-time {
            flex: 1;
        }
        .notes-item-edit,
        .notes-item-delete {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 4px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .notes-item-edit:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        .notes-item-delete:hover {
            border-color: var(--bad);
            color: var(--bad);
        }
        .notes-empty-project {
            padding: 20px;
            text-align: center;
            color: var(--text-muted);
            font-size: 12px;
            font-style: italic;
        }
        .notes-empty {
            padding: 40px 20px;
            text-align: center;
        }
        .notes-empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        .notes-empty-text {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: var(--text-primary);
            margin-bottom: 8px;
        }
        .notes-empty-sub {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
        }
        .notes-error {
            padding: 16px;
            text-align: center;
            color: var(--bad);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
        }
    `;
    document.head.appendChild(styles);
}

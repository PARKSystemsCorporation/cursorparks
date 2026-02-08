// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Log Reordering Component
// Drag-and-drop and up/down buttons for reordering logs
// Uses log_order field
// ════════════════════════════════════════════════════════

import { supabase, getSession, escapeHtml } from './supabase-client.js';

// ── Reorder Logs ─────────────────────────────────────────
export async function reorderLogs(logs, newOrder) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    // Update log_order for each log
    const updates = newOrder.map((logId, index) => {
        return supabase
            .from('build_logs')
            .update({ log_order: index })
            .eq('id', logId);
    });

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
        return { error: errors[0].error.message };
    }

    return { success: true };
}

// ── Render Reorder UI ────────────────────────────────────
export function renderReorderUI(container, logs, onReorder) {
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="reorder-empty">No logs to reorder</div>';
        return;
    }

    // Sort logs by log_order
    const sortedLogs = [...logs].sort((a, b) => {
        const orderA = a.log_order ?? a.log_index ?? 0;
        const orderB = b.log_order ?? b.log_index ?? 0;
        return orderA - orderB;
    });

    container.innerHTML = `
        <div class="reorder-list" id="reorder-list">
            ${sortedLogs.map((log, index) => `
                <div class="reorder-item" data-log-id="${log.id}" draggable="true">
                    <div class="reorder-handle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M8 9h8M8 15h8M8 12h8"></path>
                        </svg>
                    </div>
                    <div class="reorder-content">
                        <div class="reorder-title">${escapeHtml(log.title || `Log #${log.log_order ?? log.log_index ?? index + 1}`)}</div>
                        <div class="reorder-meta">
                            <span class="reorder-type">${escapeHtml(log.log_type || 'update')}</span>
                            <span class="reorder-date">${new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="reorder-actions">
                        <button type="button" class="reorder-btn reorder-up" 
                                data-log-id="${log.id}" 
                                ${index === 0 ? 'disabled' : ''}
                                title="Move up">
                            ↑
                        </button>
                        <button type="button" class="reorder-btn reorder-down" 
                                data-log-id="${log.id}" 
                                ${index === sortedLogs.length - 1 ? 'disabled' : ''}
                                title="Move down">
                            ↓
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="reorder-actions-bar">
            <button type="button" class="reorder-save-btn" id="reorder-save">Save Order</button>
            <button type="button" class="reorder-cancel-btn" id="reorder-cancel">Cancel</button>
        </div>
    `;

    // Bind handlers
    bindReorderHandlers(container, sortedLogs, onReorder);
}

// ── Bind Reorder Handlers ───────────────────────────────
function bindReorderHandlers(container, logs, onReorder) {
    const list = container.querySelector('#reorder-list');
    let currentOrder = logs.map(l => l.id);
    let hasChanges = false;

    // Drag and drop
    let draggedElement = null;

    list.querySelectorAll('.reorder-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedElement = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedElement = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggedElement);
            } else {
                list.insertBefore(draggedElement, afterElement);
            }
        });

        item.addEventListener('drop', () => {
            hasChanges = true;
            updateOrderFromDOM();
        });
    });

    // Up/Down buttons
    container.querySelectorAll('.reorder-up').forEach(btn => {
        btn.addEventListener('click', () => {
            const logId = btn.dataset.logId;
            const index = currentOrder.indexOf(logId);
            if (index > 0) {
                [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
                hasChanges = true;
                updateUI();
            }
        });
    });

    container.querySelectorAll('.reorder-down').forEach(btn => {
        btn.addEventListener('click', () => {
            const logId = btn.dataset.logId;
            const index = currentOrder.indexOf(logId);
            if (index < currentOrder.length - 1) {
                [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
                hasChanges = true;
                updateUI();
            }
        });
    });

    // Save button
    container.querySelector('#reorder-save').addEventListener('click', async () => {
        if (!hasChanges) {
            if (onReorder) onReorder(currentOrder);
            return;
        }

        const { error } = await reorderLogs(logs, currentOrder);
        if (error) {
            alert(`Failed to save order: ${error}`);
            return;
        }

        if (onReorder) onReorder(currentOrder);
    });

    // Cancel button
    container.querySelector('#reorder-cancel').addEventListener('click', () => {
        if (onReorder) onReorder(null);
    });

    function updateOrderFromDOM() {
        currentOrder = Array.from(list.querySelectorAll('.reorder-item')).map(item => item.dataset.logId);
        updateUI();
    }

    function updateUI() {
        currentOrder.forEach((logId, index) => {
            const item = list.querySelector(`[data-log-id="${logId}"]`);
            const upBtn = item.querySelector('.reorder-up');
            const downBtn = item.querySelector('.reorder-down');
            
            if (upBtn) upBtn.disabled = index === 0;
            if (downBtn) downBtn.disabled = index === currentOrder.length - 1;
        });
    }
}

// ── Get Drag After Element ─────────────────────────────
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.reorder-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ── Inject Reorder Styles ───────────────────────────────
export function injectReorderStyles() {
    if (document.getElementById('reorder-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'reorder-styles';
    styles.textContent = `
        .reorder-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        .reorder-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--bg-panel);
            border: 1px solid var(--border);
            cursor: move;
            transition: all 0.15s ease;
        }
        .reorder-item:hover {
            border-color: var(--accent);
            background: var(--bg-secondary);
        }
        .reorder-item.dragging {
            opacity: 0.5;
        }
        .reorder-handle {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            cursor: grab;
        }
        .reorder-handle:active {
            cursor: grabbing;
        }
        .reorder-content {
            flex: 1;
        }
        .reorder-title {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        .reorder-meta {
            display: flex;
            gap: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
        }
        .reorder-type {
            text-transform: uppercase;
        }
        .reorder-actions {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .reorder-btn {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            cursor: pointer;
            font-size: 14px;
            transition: all 0.15s ease;
        }
        .reorder-btn:hover:not(:disabled) {
            border-color: var(--accent);
            color: var(--accent);
        }
        .reorder-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        .reorder-actions-bar {
            display: flex;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
        }
        .reorder-save-btn,
        .reorder-cancel-btn {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 8px 16px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .reorder-save-btn {
            background: var(--accent);
            border-color: var(--accent);
            color: var(--bg-primary);
        }
        .reorder-save-btn:hover {
            background: var(--accent-dark);
            border-color: var(--accent-dark);
        }
        .reorder-cancel-btn:hover {
            border-color: var(--text-muted);
            color: var(--text-primary);
        }
        .reorder-empty {
            padding: 40px 20px;
            text-align: center;
            color: var(--text-muted);
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
        }
    `;
    document.head.appendChild(styles);
}

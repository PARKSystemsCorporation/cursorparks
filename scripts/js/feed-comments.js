// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Feed Comments Integration
// Adds comment counts to feed cards and quick comment modal
// ════════════════════════════════════════════════════════

import { supabase, getSession, escapeHtml, timeAgo } from './supabase-client.js';
import { postComment, searchGifs, getTrendingGifs, injectCommentsStyles } from './comments.js';

// ── Get comment counts for multiple builders ───────────
export async function getCommentCounts(builderIds) {
    if (!builderIds || builderIds.length === 0) return {};

    const { data, error } = await supabase
        .from('comments')
        .select('builder_id')
        .in('builder_id', builderIds);

    if (error) return {};

    const counts = {};
    data.forEach(c => {
        counts[c.builder_id] = (counts[c.builder_id] || 0) + 1;
    });
    return counts;
}

// ── Get recent comments for a builder (preview) ────────
export async function getRecentComments(builderId, limit = 3) {
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles:user_id (
                id,
                display_name
            )
        `)
        .eq('builder_id', builderId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return { comments: [] };
    return { comments: comments || [] };
}

// ── Quick Comment Modal ────────────────────────────────
// Opens a modal to quickly post a comment with GIF support
export async function openQuickCommentModal(builderId, builderName) {
    injectCommentsStyles();
    injectQuickCommentStyles();

    const session = await getSession();
    if (!session) {
        window.location.href = '../../legacy/login/index.html';
        return;
    }

    // Remove existing modal if any
    const existing = document.getElementById('quick-comment-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'quick-comment-modal';
    modal.className = 'qc-modal-overlay';
    modal.innerHTML = `
        <div class="qc-modal">
            <div class="qc-modal-header">
                <span class="qc-modal-title">Comment on ${escapeHtml(builderName || 'Project')}</span>
                <button class="qc-modal-close" type="button">×</button>
            </div>
            <div class="qc-modal-body">
                <div class="qc-recent-comments"></div>
                <div class="qc-composer">
                    <textarea class="qc-input" placeholder="Write a comment..." rows="2"></textarea>
                    <div class="qc-gif-preview" style="display: none;">
                        <img class="qc-gif-preview-img" src="">
                        <button type="button" class="qc-gif-preview-remove">×</button>
                    </div>
                    <div class="qc-actions">
                        <button type="button" class="qc-gif-btn">
                            <span class="gif-label">GIF</span>
                        </button>
                        <button type="button" class="qc-submit-btn" disabled>Post</button>
                    </div>
                    <div class="qc-gif-picker" style="display: none;"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Load recent comments
    const recentContainer = modal.querySelector('.qc-recent-comments');
    const { comments } = await getRecentComments(builderId, 5);
    
    if (comments.length > 0) {
        recentContainer.innerHTML = comments.map(c => {
            const name = c.profiles?.display_name || 'Anonymous';
            return `
                <div class="qc-comment">
                    <span class="qc-comment-author">${escapeHtml(name)}</span>
                    <span class="qc-comment-time">${timeAgo(c.created_at)}</span>
                    ${c.content ? `<div class="qc-comment-text">${escapeHtml(c.content)}</div>` : ''}
                    ${c.gif_url ? `<img class="qc-comment-gif" src="${escapeHtml(c.gif_url)}">` : ''}
                </div>
            `;
        }).join('');
    } else {
        recentContainer.innerHTML = '<div class="qc-no-comments">No comments yet. Be the first!</div>';
    }

    // Elements
    const closeBtn = modal.querySelector('.qc-modal-close');
    const textarea = modal.querySelector('.qc-input');
    const submitBtn = modal.querySelector('.qc-submit-btn');
    const gifBtn = modal.querySelector('.qc-gif-btn');
    const gifPicker = modal.querySelector('.qc-gif-picker');
    const gifPreview = modal.querySelector('.qc-gif-preview');
    const gifPreviewImg = modal.querySelector('.qc-gif-preview-img');
    const gifPreviewRemove = modal.querySelector('.qc-gif-preview-remove');

    let selectedGif = null;
    let searchTimeout = null;

    // Close modal
    function closeModal() {
        modal.remove();
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });

    // Update submit state
    function updateSubmitState() {
        submitBtn.disabled = !textarea.value.trim() && !selectedGif;
    }

    textarea.addEventListener('input', updateSubmitState);

    // GIF picker
    gifBtn.addEventListener('click', async () => {
        if (gifPicker.style.display === 'none') {
            gifPicker.style.display = 'block';
            gifPicker.innerHTML = '<div class="qc-gif-loading">Loading trending GIFs...</div>';
            
            const { gifs } = await getTrendingGifs(20);
            renderGifGrid(gifs);
        } else {
            gifPicker.style.display = 'none';
        }
    });

    function renderGifGrid(gifs) {
        if (!gifs || gifs.length === 0) {
            gifPicker.innerHTML = '<div class="qc-gif-empty">No GIFs found</div>';
            return;
        }

        gifPicker.innerHTML = `
            <div class="qc-gif-search">
                <input type="text" class="qc-gif-search-input" placeholder="Search Tenor...">
            </div>
            <div class="qc-gif-grid">
                ${gifs.map(g => `
                    <div class="qc-gif-item" data-url="${g.url}" data-id="${g.id}">
                        <img src="${g.preview}" loading="lazy">
                    </div>
                `).join('')}
            </div>
        `;

        // Search handler
        const searchInput = gifPicker.querySelector('.qc-gif-search-input');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = e.target.value.trim();
                if (!query) {
                    const { gifs } = await getTrendingGifs(20);
                    renderGifGrid(gifs);
                } else {
                    gifPicker.querySelector('.qc-gif-grid').innerHTML = '<div class="qc-gif-loading">Searching...</div>';
                    const { gifs } = await searchGifs(query, 20);
                    const grid = gifPicker.querySelector('.qc-gif-grid');
                    grid.innerHTML = gifs.map(g => `
                        <div class="qc-gif-item" data-url="${g.url}" data-id="${g.id}">
                            <img src="${g.preview}" loading="lazy">
                        </div>
                    `).join('');
                    attachGifClickHandlers();
                }
            }, 300);
        });

        attachGifClickHandlers();
    }

    function attachGifClickHandlers() {
        gifPicker.querySelectorAll('.qc-gif-item').forEach(item => {
            item.addEventListener('click', () => {
                selectedGif = { url: item.dataset.url, id: item.dataset.id };
                gifPreviewImg.src = selectedGif.url;
                gifPreview.style.display = 'flex';
                gifPicker.style.display = 'none';
                updateSubmitState();
            });
        });
    }

    // Remove GIF
    gifPreviewRemove.addEventListener('click', () => {
        selectedGif = null;
        gifPreview.style.display = 'none';
        gifPreviewImg.src = '';
        updateSubmitState();
    });

    // Submit
    submitBtn.addEventListener('click', async () => {
        const content = textarea.value.trim();
        if (!content && !selectedGif) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        const { comment, error } = await postComment({
            builderId,
            buildLogId: null,
            content,
            gifUrl: selectedGif?.url,
            gifId: selectedGif?.id
        });

        if (error) {
            alert(error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post';
            return;
        }

        // Add to recent comments
        const name = comment.profiles?.display_name || 'You';
        const newComment = document.createElement('div');
        newComment.className = 'qc-comment';
        newComment.innerHTML = `
            <span class="qc-comment-author">${escapeHtml(name)}</span>
            <span class="qc-comment-time">just now</span>
            ${comment.content ? `<div class="qc-comment-text">${escapeHtml(comment.content)}</div>` : ''}
            ${comment.gif_url ? `<img class="qc-comment-gif" src="${escapeHtml(comment.gif_url)}">` : ''}
        `;
        
        const noComments = recentContainer.querySelector('.qc-no-comments');
        if (noComments) noComments.remove();
        recentContainer.insertBefore(newComment, recentContainer.firstChild);

        // Reset
        textarea.value = '';
        selectedGif = null;
        gifPreview.style.display = 'none';
        submitBtn.textContent = 'Post';
        updateSubmitState();

        // Update comment count on the card
        const card = document.querySelector(`.log-card[data-builder-id="${builderId}"]`);
        if (card) {
            const countEl = card.querySelector('.comment-action span');
            if (countEl) {
                countEl.textContent = parseInt(countEl.textContent || 0) + 1;
            }
        }
    });
}

// ── Styles for quick comment modal ─────────────────────
function injectQuickCommentStyles() {
    if (document.getElementById('quick-comment-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'quick-comment-styles';
    styles.textContent = `
        .qc-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }
        .qc-modal {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            width: 100%;
            max-width: 480px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }
        .qc-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
        }
        .qc-modal-title {
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-primary);
        }
        .qc-modal-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 20px;
            cursor: pointer;
            padding: 0 4px;
        }
        .qc-modal-close:hover {
            color: var(--text-primary);
        }
        .qc-modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        .qc-recent-comments {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 16px;
            max-height: 200px;
            overflow-y: auto;
        }
        .qc-comment {
            padding: 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
        }
        .qc-comment-author {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-primary);
        }
        .qc-comment-time {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-dim);
            margin-left: 8px;
        }
        .qc-comment-text {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 6px;
            line-height: 1.4;
        }
        .qc-comment-gif {
            max-width: 150px;
            max-height: 100px;
            margin-top: 8px;
            border-radius: 4px;
        }
        .qc-no-comments {
            text-align: center;
            padding: 20px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
        }
        .qc-composer {
            border-top: 1px solid var(--border);
            padding-top: 16px;
        }
        .qc-input {
            width: 100%;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            padding: 10px 12px;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: var(--text-primary);
            resize: none;
            min-height: 60px;
        }
        .qc-input:focus {
            outline: none;
            border-color: var(--accent);
        }
        .qc-gif-preview {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 10px;
            padding: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
        }
        .qc-gif-preview-img {
            max-width: 150px;
            max-height: 100px;
            border-radius: 4px;
        }
        .qc-gif-preview-remove {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            color: var(--text-muted);
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .qc-gif-preview-remove:hover {
            color: var(--bad);
            border-color: var(--bad);
        }
        .qc-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }
        .qc-gif-btn {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 8px 12px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
        }
        .qc-gif-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        .qc-submit-btn {
            margin-left: auto;
            background: var(--accent);
            border: 1px solid var(--accent);
            color: var(--bg-primary);
            padding: 8px 16px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            text-transform: uppercase;
        }
        .qc-submit-btn:hover:not(:disabled) {
            background: var(--accent-dark);
        }
        .qc-submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .qc-gif-picker {
            margin-top: 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            max-height: 250px;
            overflow-y: auto;
        }
        .qc-gif-search {
            padding: 8px;
            border-bottom: 1px solid var(--border);
        }
        .qc-gif-search-input {
            width: 100%;
            background: var(--bg-panel);
            border: 1px solid var(--border);
            padding: 8px 10px;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            color: var(--text-primary);
        }
        .qc-gif-search-input:focus {
            outline: none;
            border-color: var(--accent);
        }
        .qc-gif-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
            padding: 8px;
        }
        .qc-gif-item {
            aspect-ratio: 1;
            cursor: pointer;
            overflow: hidden;
            border: 2px solid transparent;
        }
        .qc-gif-item:hover {
            border-color: var(--accent);
        }
        .qc-gif-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .qc-gif-loading, .qc-gif-empty {
            text-align: center;
            padding: 20px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
        }
    `;
    document.head.appendChild(styles);
}

// ── Bind comment buttons on feed cards ─────────────────
// Call this after rendering feed cards
export function bindFeedCommentButtons() {
    document.querySelectorAll('.comment-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.log-card');
            const builderId = card?.dataset.builderId;
            const builderName = card?.querySelector('.log-title h3')?.textContent;
            if (builderId) {
                openQuickCommentModal(builderId, builderName);
            }
        });
    });
}
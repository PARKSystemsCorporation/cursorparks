// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Comments Module
// Comments with GIF support (Tenor API - same as Discord)
// ════════════════════════════════════════════════════════

import { supabase, getSession, getProfile, escapeHtml, timeAgo } from './supabase-client.js';

// Tenor API key (free tier - get your own at https://developers.google.com/tenor)
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; // Google's public demo key

// ── Fetch comments for a build log ─────────────────────
export async function getComments(buildLogId) {
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles:user_id (
                id,
                display_name,
                avatar_url
            )
        `)
        .eq('build_log_id', buildLogId)
        .order('created_at', { ascending: true });

    if (error) return { error: error.message };
    return { comments: comments || [] };
}

// ── Fetch comments for a builder (all logs) ────────────
export async function getBuilderComments(builderId) {
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles:user_id (
                id,
                display_name,
                avatar_url
            ),
            build_logs:build_log_id (
                id,
                title
            )
        `)
        .eq('builder_id', builderId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return { error: error.message };
    return { comments: comments || [] };
}

// ── Post a comment ─────────────────────────────────────
export async function postComment({ builderId, buildLogId, content, gifUrl, gifId }) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    if (!content && !gifUrl) return { error: 'Comment cannot be empty' };

    const { data: comment, error } = await supabase
        .from('comments')
        .insert({
            user_id: session.user.id,
            builder_id: builderId,
            build_log_id: buildLogId || null,
            content: content || '',
            gif_url: gifUrl || null,
            gif_id: gifId || null
        })
        .select(`
            *,
            profiles:user_id (
                id,
                display_name,
                avatar_url
            )
        `)
        .maybeSingle();

    if (error) return { error: error.message };
    return { comment };
}

// ── Delete a comment ───────────────────────────────────
export async function deleteComment(commentId) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session.user.id);

    if (error) return { error: error.message };
    return { success: true };
}

// ── Search Tenor GIFs ──────────────────────────────────
export async function searchGifs(query, limit = 20) {
    if (!query) return { gifs: [] };
    
    try {
        const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${limit}&media_filter=gif,tinygif`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results) return { gifs: [] };
        
        return {
            gifs: data.results.map(gif => ({
                id: gif.id,
                title: gif.title || query,
                preview: gif.media_formats.tinygif?.url || gif.media_formats.gif?.url,
                url: gif.media_formats.gif?.url,
                width: gif.media_formats.gif?.dims?.[0] || 200,
                height: gif.media_formats.gif?.dims?.[1] || 200
            }))
        };
    } catch (err) {
        console.error('Tenor search error:', err);
        return { error: 'Failed to search GIFs', gifs: [] };
    }
}

// ── Get trending GIFs ──────────────────────────────────
export async function getTrendingGifs(limit = 20) {
    try {
        const url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=${limit}&media_filter=gif,tinygif`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results) return { gifs: [] };
        
        return {
            gifs: data.results.map(gif => ({
                id: gif.id,
                title: gif.title || 'Trending',
                preview: gif.media_formats.tinygif?.url || gif.media_formats.gif?.url,
                url: gif.media_formats.gif?.url,
                width: gif.media_formats.gif?.dims?.[0] || 200,
                height: gif.media_formats.gif?.dims?.[1] || 200
            }))
        };
    } catch (err) {
        console.error('Tenor trending error:', err);
        return { error: 'Failed to load trending GIFs', gifs: [] };
    }
}

// ── GIF Picker Component ───────────────────────────────
// Call createGifPicker(container, onSelect) to render
export function createGifPicker(container, onSelect) {
    let searchTimeout = null;
    
    container.innerHTML = `
        <div class="gif-picker">
            <div class="gif-picker-header">
                <div class="gif-search-wrap">
                    <svg class="gif-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" class="gif-search-input" placeholder="Search Tenor">
                </div>
                <button class="gif-picker-close" type="button">×</button>
            </div>
            <div class="gif-picker-content">
                <div class="gif-grid"></div>
            </div>
            <div class="gif-picker-footer">
                <span class="tenor-attribution">Powered by Tenor</span>
            </div>
        </div>
    `;

    const input = container.querySelector('.gif-search-input');
    const grid = container.querySelector('.gif-grid');
    const closeBtn = container.querySelector('.gif-picker-close');

    // Load trending on open
    loadTrending();

    async function loadTrending() {
        grid.innerHTML = '<div class="gif-loading">Loading...</div>';
        const { gifs } = await getTrendingGifs(30);
        renderGifs(gifs);
    }

    async function search(query) {
        if (!query.trim()) {
            loadTrending();
            return;
        }
        grid.innerHTML = '<div class="gif-loading">Searching...</div>';
        const { gifs } = await searchGifs(query, 30);
        renderGifs(gifs);
    }

    function renderGifs(gifs) {
        if (!gifs || gifs.length === 0) {
            grid.innerHTML = '<div class="gif-empty">No GIFs found</div>';
            return;
        }
        grid.innerHTML = gifs.map(gif => `
            <div class="gif-item" data-id="${gif.id}" data-url="${gif.url}">
                <img src="${gif.preview}" alt="${escapeHtml(gif.title)}" loading="lazy">
            </div>
        `).join('');

        grid.querySelectorAll('.gif-item').forEach(item => {
            item.addEventListener('click', () => {
                onSelect({
                    id: item.dataset.id,
                    url: item.dataset.url
                });
            });
        });
    }

    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => search(e.target.value), 300);
    });

    closeBtn.addEventListener('click', () => {
        container.innerHTML = '';
        container.style.display = 'none';
    });

    return {
        close: () => {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    };
}

// ── Comments Section Component ─────────────────────────
// Call renderCommentsSection(container, { builderId, buildLogId }) 
export async function renderCommentsSection(container, { builderId, buildLogId }) {
    const session = await getSession();
    const isAuthenticated = !!session;
    
    container.innerHTML = `
        <div class="comments-section">
            <div class="comments-header">
                <span class="comments-title">Comments</span>
                <span class="comments-count">—</span>
            </div>
            
            ${isAuthenticated ? `
            <div class="comment-composer">
                <div class="comment-input-row">
                    <textarea class="comment-input" placeholder="Write a comment..." rows="1"></textarea>
                    <div class="comment-actions">
                        <button type="button" class="comment-gif-btn" title="Add GIF">
                            <span class="gif-label">GIF</span>
                        </button>
                        <button type="button" class="comment-submit-btn" disabled>Post</button>
                    </div>
                </div>
                <div class="gif-preview-container" style="display: none;">
                    <img class="gif-preview-img" src="">
                    <button type="button" class="gif-preview-remove">×</button>
                </div>
                <div class="gif-picker-container" style="display: none;"></div>
            </div>
            ` : `
            <div class="comment-login-prompt">
                <a href="/legacy/login">Login</a> to comment
            </div>
            `}
            
            <div class="comments-list">
                <div class="comments-loading">Loading comments...</div>
            </div>
        </div>
    `;

    const commentsList = container.querySelector('.comments-list');
    const commentsCount = container.querySelector('.comments-count');

    // Load comments
    const { comments, error } = buildLogId 
        ? await getComments(buildLogId)
        : await getBuilderComments(builderId);

    if (error) {
        commentsList.innerHTML = `<div class="comments-error">${escapeHtml(error)}</div>`;
        return;
    }

    commentsCount.textContent = comments.length;
    renderCommentsList(comments);

    function renderCommentsList(comments) {
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="comments-empty">No comments yet. Be the first!</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const profile = comment.profiles || {};
            const initials = (profile.display_name || 'AN')
                .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const isOwner = session?.user?.id === comment.user_id;

            return `
                <div class="comment-item" data-id="${comment.id}">
                    <div class="comment-avatar">${escapeHtml(initials)}</div>
                    <div class="comment-body">
                        <div class="comment-meta">
                            <span class="comment-author">${escapeHtml(profile.display_name || 'Anonymous')}</span>
                            <span class="comment-time">${timeAgo(comment.created_at)}</span>
                            ${isOwner ? `<button class="comment-delete" data-id="${comment.id}">Delete</button>` : ''}
                        </div>
                        ${comment.content ? `<div class="comment-text">${escapeHtml(comment.content)}</div>` : ''}
                        ${comment.gif_url ? `<div class="comment-gif"><img src="${escapeHtml(comment.gif_url)}" alt="GIF"></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Delete handlers
        commentsList.querySelectorAll('.comment-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this comment?')) return;
                const { error } = await deleteComment(btn.dataset.id);
                if (!error) {
                    btn.closest('.comment-item').remove();
                    commentsCount.textContent = parseInt(commentsCount.textContent) - 1;
                }
            });
        });
    }

    // Composer logic (if authenticated)
    if (isAuthenticated) {
        const textarea = container.querySelector('.comment-input');
        const submitBtn = container.querySelector('.comment-submit-btn');
        const gifBtn = container.querySelector('.comment-gif-btn');
        const gifPickerContainer = container.querySelector('.gif-picker-container');
        const gifPreviewContainer = container.querySelector('.gif-preview-container');
        const gifPreviewImg = container.querySelector('.gif-preview-img');
        const gifPreviewRemove = container.querySelector('.gif-preview-remove');

        let selectedGif = null;

        // Auto-resize textarea
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
            updateSubmitState();
        });

        function updateSubmitState() {
            submitBtn.disabled = !textarea.value.trim() && !selectedGif;
        }

        // GIF picker
        gifBtn.addEventListener('click', () => {
            if (gifPickerContainer.style.display === 'none') {
                gifPickerContainer.style.display = 'block';
                createGifPicker(gifPickerContainer, (gif) => {
                    selectedGif = gif;
                    gifPreviewImg.src = gif.url;
                    gifPreviewContainer.style.display = 'flex';
                    gifPickerContainer.style.display = 'none';
                    gifPickerContainer.innerHTML = '';
                    updateSubmitState();
                });
            } else {
                gifPickerContainer.style.display = 'none';
                gifPickerContainer.innerHTML = '';
            }
        });

        // Remove GIF preview
        gifPreviewRemove.addEventListener('click', () => {
            selectedGif = null;
            gifPreviewContainer.style.display = 'none';
            gifPreviewImg.src = '';
            updateSubmitState();
        });

        // Submit comment
        submitBtn.addEventListener('click', async () => {
            const content = textarea.value.trim();
            if (!content && !selectedGif) return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            const { comment, error } = await postComment({
                builderId,
                buildLogId,
                content,
                gifUrl: selectedGif?.url,
                gifId: selectedGif?.id
            });

            submitBtn.textContent = 'Post';

            if (error) {
                alert(error);
                submitBtn.disabled = false;
                return;
            }

            // Add to list
            const profile = comment.profiles || {};
            const initials = (profile.display_name || 'AN')
                .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

            const emptyMsg = commentsList.querySelector('.comments-empty');
            if (emptyMsg) emptyMsg.remove();

            const newComment = document.createElement('div');
            newComment.className = 'comment-item';
            newComment.dataset.id = comment.id;
            newComment.innerHTML = `
                <div class="comment-avatar">${escapeHtml(initials)}</div>
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="comment-author">${escapeHtml(profile.display_name || 'You')}</span>
                        <span class="comment-time">just now</span>
                        <button class="comment-delete" data-id="${comment.id}">Delete</button>
                    </div>
                    ${comment.content ? `<div class="comment-text">${escapeHtml(comment.content)}</div>` : ''}
                    ${comment.gif_url ? `<div class="comment-gif"><img src="${escapeHtml(comment.gif_url)}" alt="GIF"></div>` : ''}
                </div>
            `;
            commentsList.appendChild(newComment);

            newComment.querySelector('.comment-delete').addEventListener('click', async () => {
                if (!confirm('Delete this comment?')) return;
                const { error } = await deleteComment(comment.id);
                if (!error) newComment.remove();
            });

            // Reset
            textarea.value = '';
            textarea.style.height = 'auto';
            selectedGif = null;
            gifPreviewContainer.style.display = 'none';
            gifPreviewImg.src = '';
            commentsCount.textContent = parseInt(commentsCount.textContent) + 1;
            updateSubmitState();
        });
    }

    // Realtime subscription
    const channel = supabase
        .channel(`comments-${buildLogId || builderId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'comments',
                filter: buildLogId ? `build_log_id=eq.${buildLogId}` : `builder_id=eq.${builderId}`
            }, 
            async (payload) => {
                // Reload to get full comment with profile
                const { comments } = buildLogId 
                    ? await getComments(buildLogId)
                    : await getBuilderComments(builderId);
                commentsCount.textContent = comments.length;
                renderCommentsList(comments);
            }
        )
        .subscribe();

    // Return cleanup function
    return () => {
        supabase.removeChannel(channel);
    };
}

// ── CSS for comments (inject once) ─────────────────────
export function injectCommentsStyles() {
    if (document.getElementById('comments-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'comments-styles';
    styles.textContent = `
        .comments-section {
            margin-top: 32px;
            border-top: 1px solid var(--border);
            padding-top: 24px;
        }
        .comments-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
        }
        .comments-title {
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-primary);
        }
        .comments-count {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
            padding: 2px 6px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
        }

        /* Composer */
        .comment-composer {
            margin-bottom: 24px;
        }
        .comment-input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        .comment-input {
            flex: 1;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            padding: 10px 12px;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            color: var(--text-primary);
            resize: none;
            min-height: 40px;
            max-height: 120px;
            line-height: 1.4;
        }
        .comment-input:focus {
            outline: none;
            border-color: var(--accent);
        }
        .comment-actions {
            display: flex;
            gap: 6px;
        }
        .comment-gif-btn {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 8px 10px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.15s ease;
        }
        .comment-gif-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        .gif-label {
            background: linear-gradient(90deg, #00dcff, #ff007a);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .comment-submit-btn {
            background: var(--accent);
            border: 1px solid var(--accent);
            color: var(--bg-primary);
            padding: 8px 16px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.15s ease;
        }
        .comment-submit-btn:hover:not(:disabled) {
            background: var(--accent-dark);
        }
        .comment-submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* GIF Preview */
        .gif-preview-container {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 10px;
            padding: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
        }
        .gif-preview-img {
            max-width: 200px;
            max-height: 150px;
            border-radius: 4px;
        }
        .gif-preview-remove {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            color: var(--text-muted);
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .gif-preview-remove:hover {
            color: var(--bad);
            border-color: var(--bad);
        }

        /* GIF Picker */
        .gif-picker-container {
            margin-top: 10px;
        }
        .gif-picker {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            max-height: 400px;
            display: flex;
            flex-direction: column;
        }
        .gif-picker-header {
            display: flex;
            gap: 8px;
            padding: 10px;
            border-bottom: 1px solid var(--border);
        }
        .gif-search-wrap {
            flex: 1;
            position: relative;
        }
        .gif-search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 14px;
            height: 14px;
            color: var(--text-muted);
        }
        .gif-search-input {
            width: 100%;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            padding: 8px 10px 8px 32px;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            color: var(--text-primary);
        }
        .gif-search-input:focus {
            outline: none;
            border-color: var(--accent);
        }
        .gif-picker-close {
            background: none;
            border: 1px solid var(--border);
            color: var(--text-muted);
            width: 32px;
            cursor: pointer;
            font-size: 18px;
        }
        .gif-picker-close:hover {
            color: var(--text-primary);
            border-color: var(--text-muted);
        }
        .gif-picker-content {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        .gif-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 6px;
        }
        .gif-item {
            cursor: pointer;
            aspect-ratio: 1;
            overflow: hidden;
            background: var(--bg-secondary);
            border: 2px solid transparent;
            transition: border-color 0.15s ease;
        }
        .gif-item:hover {
            border-color: var(--accent);
        }
        .gif-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .gif-loading, .gif-empty {
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
        }
        .gif-picker-footer {
            padding: 8px 10px;
            border-top: 1px solid var(--border);
            text-align: right;
        }
        .tenor-attribution {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-dim);
        }

        /* Comments List */
        .comments-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .comments-loading, .comments-empty, .comments-error {
            text-align: center;
            padding: 24px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
        }
        .comment-item {
            display: flex;
            gap: 12px;
        }
        .comment-avatar {
            width: 32px;
            height: 32px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--accent);
            flex-shrink: 0;
        }
        .comment-body {
            flex: 1;
            min-width: 0;
        }
        .comment-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }
        .comment-author {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
        }
        .comment-time {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-dim);
        }
        .comment-delete {
            background: none;
            border: none;
            color: var(--text-dim);
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
        }
        .comment-delete:hover {
            color: var(--bad);
        }
        .comment-text {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: var(--text-secondary);
            word-break: break-word;
        }
        .comment-gif {
            margin-top: 8px;
        }
        .comment-gif img {
            max-width: 300px;
            max-height: 200px;
            border-radius: 4px;
            border: 1px solid var(--border);
        }
        .comment-login-prompt {
            padding: 16px;
            text-align: center;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 20px;
        }
        .comment-login-prompt a {
            color: var(--accent);
            text-decoration: none;
        }
        .comment-login-prompt a:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(styles);
}
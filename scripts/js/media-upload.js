// ════════════════════════════════════════════════════════
// PARKS SYSTEM — Media Upload Utility
// Handles photos, videos, GIFs, emojis with Supabase Storage
// ════════════════════════════════════════════════════════

import { supabase, getSession } from './supabase-client.js';

// Storage bucket names
const STORAGE_BUCKETS = {
    photos: 'media-photos',
    videos: 'media-videos',
    gifs: 'media-gifs',
    emojis: 'media-emojis'
};

// File size limits (in bytes)
const MAX_FILE_SIZES = {
    photo: 10 * 1024 * 1024,      // 10MB
    video: 100 * 1024 * 1024,     // 100MB (for comments, will check duration separately)
    video_profile: 3600 * 1024 * 1024, // 3.6GB (1 hour at reasonable bitrate)
    gif: 10 * 1024 * 1024,        // 10MB
    emoji: 1 * 1024 * 1024        // 1MB
};

// Video duration limits (in seconds)
const MAX_VIDEO_DURATIONS = {
    comment: 60,      // 1 minute for comments
    profile: 3600     // 1 hour for profiles
};

// ── Get video duration from file ────────────────────────
function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
    });
}

// ── Validate file before upload ─────────────────────────
export async function validateMediaFile(file, context = 'comment') {
    const fileType = file.type.toLowerCase();
    const fileSize = file.size;
    
    // Determine media type
    let mediaType = null;
    if (fileType.startsWith('image/')) {
        if (fileType === 'image/gif') {
            mediaType = 'gif';
        } else {
            mediaType = 'photo';
        }
    } else if (fileType.startsWith('video/')) {
        mediaType = 'video';
    } else {
        return { error: 'Unsupported file type. Please upload an image or video.' };
    }

    // Check file size
    const maxSize = mediaType === 'video' 
        ? (context === 'profile' ? MAX_FILE_SIZES.video_profile : MAX_FILE_SIZES.video)
        : MAX_FILE_SIZES[mediaType];
    
    if (fileSize > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
        return { error: `File too large. Maximum size: ${maxMB}MB` };
    }

    // Check video duration
    if (mediaType === 'video') {
        try {
            const duration = await getVideoDuration(file);
            const maxDuration = context === 'profile' 
                ? MAX_VIDEO_DURATIONS.profile 
                : MAX_VIDEO_DURATIONS.comment;
            
            if (duration > maxDuration) {
                const maxMinutes = Math.floor(maxDuration / 60);
                return { error: `Video too long. Maximum duration: ${maxMinutes} minute${maxMinutes > 1 ? 's' : ''}` };
            }
            
            return { 
                valid: true, 
                mediaType, 
                duration,
                fileSize 
            };
        } catch (err) {
            return { error: 'Could not read video file. Please try again.' };
        }
    }

    return { 
        valid: true, 
        mediaType, 
        fileSize 
    };
}

// ── Upload media file to Supabase Storage ───────────────
export async function uploadMediaFile(file, context = 'comment') {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    // Validate file
    const validation = await validateMediaFile(file, context);
    if (validation.error) return validation;
    if (!validation.valid) return { error: 'Invalid file' };

    const { mediaType, duration, fileSize } = validation;

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${session.user.id}/${timestamp}-${random}.${extension}`;

    // Determine bucket
    const bucket = STORAGE_BUCKETS[mediaType === 'photo' ? 'photos' : mediaType === 'gif' ? 'gifs' : 'videos'];

    try {
        // Upload file
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            // If bucket doesn't exist, try to create it
            if (uploadError.message.includes('Bucket not found')) {
                return { error: `Storage bucket '${bucket}' not found. Please create it in Supabase Storage.` };
            }
            return { error: uploadError.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

        const publicUrl = urlData.publicUrl;

        // Generate thumbnail for videos
        let thumbnailUrl = null;
        if (mediaType === 'video') {
            thumbnailUrl = await generateVideoThumbnail(file);
        }

        return {
            success: true,
            media: {
                type: mediaType,
                url: publicUrl,
                thumbnail: thumbnailUrl,
                duration: duration || null,
                fileSize,
                filename
            }
        };
    } catch (error) {
        return { error: error.message || 'Upload failed' };
    }
}

// ── Generate video thumbnail ────────────────────────────
function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            video.currentTime = 1; // Get frame at 1 second
        };
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    // Upload thumbnail
                    const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                    uploadThumbnail(thumbnailFile).then(resolve);
                } else {
                    resolve(null);
                }
                window.URL.revokeObjectURL(video.src);
            }, 'image/jpeg', 0.8);
        };
        video.onerror = () => {
            resolve(null);
            window.URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(file);
    });
}

// ── Upload thumbnail ─────────────────────────────────────
async function uploadThumbnail(file) {
    const session = await getSession();
    if (!session) return null;

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const filename = `${session.user.id}/thumbnails/${timestamp}-${random}.jpg`;

    try {
        const { error } = await supabase.storage
            .from(STORAGE_BUCKETS.photos)
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) return null;

        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKETS.photos)
            .getPublicUrl(filename);

        return urlData.publicUrl;
    } catch (err) {
        return null;
    }
}

// ── Delete media file ───────────────────────────────────
export async function deleteMediaFile(url) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    // Extract bucket and filename from URL
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.findIndex(p => p.includes('media-'));
        if (bucketIndex === -1) return { error: 'Invalid media URL' };

        const bucket = pathParts[bucketIndex];
        const filename = pathParts.slice(bucketIndex + 1).join('/');

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filename]);

        if (error) return { error: error.message };
        return { success: true };
    } catch (err) {
        return { error: 'Failed to delete media' };
    }
}

// ── Emoji picker data ────────────────────────────────────
const EMOJI_CATEGORIES = {
    'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔'],
    'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'],
    'Food & Drink': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨'],
    'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥃', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸'],
    'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'],
    'Flags': ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇯🇵', '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇰🇷', '🇷🇺', '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱']
};

export function getEmojiCategories() {
    return EMOJI_CATEGORIES;
}

export function searchEmojis(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]) => {
        emojis.forEach(emoji => {
            // Simple search - could be enhanced with emoji names
            if (lowerQuery === '' || Math.random() > 0.7) { // Placeholder - add proper emoji name matching
                results.push({ emoji, category });
            }
        });
    });
    
    return results.slice(0, 50);
}

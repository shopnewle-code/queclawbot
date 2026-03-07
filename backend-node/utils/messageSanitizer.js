/**
 * Message Sanitizer for Telegram
 * Removes unsupported HTML tags and formats messages safely
 */

// Telegram supported HTML tags
const TELEGRAM_SUPPORTED_TAGS = [
  'b', 'i', 'u', 's', 'a', 'code', 'pre', 'blockquote', 'tg-spoiler'
];

/**
 * Remove unsupported HTML tags from text
 * Keeps only Telegram-supported tags
 */
export function sanitizeHTML(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Pattern to find all HTML tags
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g;
  
  return text.replace(tagPattern, (match, tagName) => {
    if (TELEGRAM_SUPPORTED_TAGS.includes(tagName.toLowerCase())) {
      return match; // Keep supported tags
    }
    // Remove unsupported tags but keep the content
    return '';
  });
}

/**
 * Escape special characters for Telegram HTML
 */
export function escapeHTML(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safe message formatting for Telegram
 * Removes problematic content and formats safely
 */
export function formatTelegramMessage(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let formatted = text;

  // Option 1: Escape HTML completely (safest)
  if (options.escapeHTML) {
    formatted = escapeHTML(formatted);
  } 
  // Option 2: Sanitize unsupported tags
  else if (options.sanitize) {
    formatted = sanitizeHTML(formatted);
  }

  // Truncate if too long (Telegram limit is 4096)
  if (options.maxLength && formatted.length > options.maxLength) {
    const limit = options.maxLength - 10;
    formatted = formatted.substring(0, limit) + '\n\n...';
  }

  return formatted;
}

/**
 * Safe markdown formatting
 * Escapes text that might break markdown parsing
 */
export function sanitizeMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[`*_[\]()~`]/g, '\\$&') // Escape markdown special chars
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Create a safe message envelope
 * Wraps content safely for Telegram
 */
export function createSafeMessage(content, { 
  title = null, 
  subtitle = null, 
  footer = null,
  formatMode = 'HTML',
  escapeContent = false
} = {}) {
  
  const parts = [];

  if (title) {
    parts.push(`<b>${escapeHTML(title)}</b>`);
  }

  if (subtitle) {
    parts.push(`\n${escapeHTML(subtitle)}`);
  }

  // Handle content based on format mode
  if (formatMode === 'HTML') {
    if (escapeContent) {
      parts.push(`\n${escapeHTML(content)}`);
    } else {
      parts.push(`\n${sanitizeHTML(content)}`);
    }
  } else if (formatMode === 'Markdown') {
    parts.push(`\n${sanitizeMarkdown(content)}`);
  } else {
    parts.push(`\n${content}`);
  }

  if (footer) {
    parts.push(`\n\n<i>${escapeHTML(footer)}</i>`);
  }

  return parts.join('');
}

export default {
  sanitizeHTML,
  escapeHTML,
  formatTelegramMessage,
  sanitizeMarkdown,
  createSafeMessage,
};

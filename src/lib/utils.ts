export function formatDisplayDate(date: string | Date | null) {
  if (!date) return 'TBA';
  const iso = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(iso);
}

export function formatReadingTime(words: number) {
  return `${words <= 1 ? 1 : words} min read`;
}

export function countWords(text: string) {
  return text
    .trim()
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean).length;
}

export function generateReadingTime(html: string) {
  const words = countWords(html);
  return Math.max(1, Math.round(words / 200));
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function slugify(value: string) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractHeadingsFromHtml(html: string) {
  const headingRegex = /<(h[2-4])[^>]*>(.*?)<\/\1>/gi;
  const headings: Array<{ id: string; title: string; level: number }> = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = Number(match[1].substring(1));
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const id = slugify(title);
    headings.push({ id, title, level });
  }

  return headings;
}

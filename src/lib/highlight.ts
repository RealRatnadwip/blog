import { getHighlighter } from 'shiki';

const highlighterPromise = getHighlighter({
  theme: 'nord',
  langs: ['bash', 'css', 'html', 'javascript', 'typescript', 'tsx', 'json', 'python', 'markdown', 'sql'],
});

function decodeHtml(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function highlightHtmlContent(html: string) {
  const highlighter = await highlighterPromise;

  return html.replace(/<pre><code class="language-([^"\s]+)">([\s\S]*?)<\/code><\/pre>/g, (_match, language, code) => {
    const decoded = decodeHtml(code);
    try {
      return highlighter.codeToHtml(decoded, { lang: language });
    } catch {
      return highlighter.codeToHtml(decoded, { lang: 'text' });
    }
  });
}

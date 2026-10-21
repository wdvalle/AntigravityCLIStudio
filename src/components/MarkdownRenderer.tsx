import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Custom renderer for GFM code blocks, links, and tables
const customRenderer = new marked.Renderer();

// Custom code block with language badge & copy button
customRenderer.code = function (token: any) {
  const code = typeof token === 'object' && token !== null ? token.text : arguments[0];
  const lang = typeof token === 'object' && token !== null ? token.lang : arguments[1];
  const cleanLang = (lang || 'code').trim();
  const escapedCode = escapeHtml(code || '');

  return `
    <div class="agy-code-wrap">
      <div class="agy-code-header">
        <span class="agy-code-lang">${escapeHtml(cleanLang)}</span>
        <button type="button" class="agy-copy-code-btn" title="Copiar bloco de código">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span>Copiar</span>
        </button>
      </div>
      <pre><code class="language-${escapeHtml(cleanLang)}">${escapedCode}</code></pre>
    </div>
  `;
};

// Custom link renderer with rel & external indication
customRenderer.link = function (token: any) {
  const href = typeof token === 'object' && token !== null ? token.href : arguments[0];
  const title = typeof token === 'object' && token !== null ? token.title : arguments[1];
  const text = typeof token === 'object' && token !== null ? token.text : arguments[2];

  const isFile = href && href.startsWith('file:');
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  const fileClass = isFile ? ' agy-file-link' : ' agy-web-link';

  return `<a href="${escapeHtml(href || '')}" class="agy-md-link${fileClass}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

// Configure marked instance
marked.use({
  gfm: true,
  breaks: true,
  renderer: customRenderer,
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content);
    } catch {
      return escapeHtml(content);
    }
  }, [content]);

  // Delegated click handler for copy buttons and file/external links
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle code copy button
    const copyBtn = target.closest('.agy-copy-code-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const codeWrap = copyBtn.closest('.agy-code-wrap');
      const codeElement = codeWrap?.querySelector('code');
      if (codeElement) {
        const rawCode = codeElement.textContent || '';
        navigator.clipboard.writeText(rawCode).then(() => {
          const span = copyBtn.querySelector('span');
          if (span) {
            const original = span.textContent;
            span.textContent = 'Copiado!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              span.textContent = original;
              copyBtn.classList.remove('copied');
            }, 1800);
          }
        });
      }
      return;
    }

    // Handle markdown links (file:// or web)
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (link && link.href) {
      e.preventDefault();
      const href = link.href;

      if (href.startsWith('file:')) {
        if (window.electronAPI?.openPath) {
          window.electronAPI.openPath(href);
        } else {
          window.open(href, '_blank');
        }
      } else {
        if (window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(href);
        } else {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    }
  };

  return (
    <div
      className="agy-markdown-body"
      dangerouslySetInnerHTML={{ __html: htmlContent as string }}
      onClick={handleClick}
    />
  );
};

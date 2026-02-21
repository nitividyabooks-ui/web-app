"use client";

interface MarkdownRendererProps {
    content: string;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function markdownToHtml(md: string): string {
    let html = escapeHtml(md);

    // Headers
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Horizontal rule
    html = html.replace(/^---+$/gm, "<hr />");

    // Unordered list items
    html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
    // Ordered list items
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

    // Wrap consecutive <li> blocks in <ul> (split by lines to avoid dotAll flag)
    html = html
        .split("\n")
        .reduce((acc: string[], line, idx, arr) => {
            const isLi = line.trim().startsWith("<li>");
            const prevIsLi = idx > 0 && arr[idx - 1].trim().startsWith("<li>");
            const nextIsLi = idx < arr.length - 1 && arr[idx + 1].trim().startsWith("<li>");
            if (isLi && !prevIsLi) acc.push("<ul>");
            acc.push(line);
            if (isLi && !nextIsLi) acc.push("</ul>");
            return acc;
        }, [])
        .join("\n");

    // Paragraphs — lines that aren't already wrapped
    const lines = html.split("\n");
    const result: string[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (
            trimmed === "" ||
            trimmed.startsWith("<h") ||
            trimmed.startsWith("<ul") ||
            trimmed.startsWith("<li") ||
            trimmed.startsWith("</ul") ||
            trimmed.startsWith("<hr") ||
            trimmed.startsWith("<p")
        ) {
            result.push(line);
        } else {
            result.push(`<p>${trimmed}</p>`);
        }
    }

    return result.join("\n");
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const html = markdownToHtml(content);

    return (
        <div
            className="prose prose-slate max-w-none text-sm leading-relaxed"
            style={{
                // Scoped styles for the rendered markdown
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

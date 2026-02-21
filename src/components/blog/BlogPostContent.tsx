"use client";

import ReactMarkdown from "react-markdown";

export function BlogPostContent({ content }: { content: string }) {
    return (
        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-heading prose-headings:text-ink prose-a:text-forest prose-a:font-semibold">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}

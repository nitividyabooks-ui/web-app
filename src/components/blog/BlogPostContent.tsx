"use client";

import ReactMarkdown from "react-markdown";

export function BlogPostContent({ content }: { content: string }) {
    return (
        <div className="article-content">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}

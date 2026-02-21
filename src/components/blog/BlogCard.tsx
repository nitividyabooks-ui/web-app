import Link from "next/link";
import Image from "next/image";
import { getStorageUrl } from "@/lib/storage";
import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
    const formattedDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            {post.coverImage && (
                <div className="relative h-48 bg-pale-green">
                    <Image
                        src={getStorageUrl(post.coverImage)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                </div>
            )}
            <div className="p-5 space-y-2">
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-pale-green text-forest text-xs font-semibold"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <h3 className="font-heading text-lg font-bold text-ink group-hover:text-forest transition-colors line-clamp-2">
                    {post.title}
                </h3>
                <p className="text-sm text-ink-secondary line-clamp-2">
                    {post.excerpt}
                </p>
                {formattedDate && (
                    <p className="text-xs text-ink-secondary">{formattedDate}</p>
                )}
            </div>
        </Link>
    );
}

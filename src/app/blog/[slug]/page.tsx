import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { BlogEmailCapture } from "@/components/blog/BlogEmailCapture";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const BASE_URL = "https://www.nitividyabooks.com";

export async function generateStaticParams() {
    const posts = await getAllBlogPosts();
    return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post) return { title: "Post Not Found" };

    return {
        title: post.metaTitle || `${post.title} - NitiVidya Blog`,
        description: post.metaDescription || post.excerpt,
        alternates: { canonical: `/blog/${slug}` },
        openGraph: {
            title: post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt,
            type: "article",
            publishedTime: post.publishedAt?.toISOString(),
            authors: [post.author],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post || !post.published) {
        notFound();
    }

    const formattedDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : null;

    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription || post.excerpt,
        author: { "@type": "Person", name: post.author },
        publisher: {
            "@type": "Organization",
            name: "NitiVidya Books",
            logo: { "@type": "ImageObject", url: `${BASE_URL}/images/logo.png` },
        },
        datePublished: post.publishedAt?.toISOString(),
        dateModified: (post.updatedAt || post.publishedAt)?.toISOString(),
        mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
    };

    return (
        <div className="min-h-screen bg-paper py-8 px-4">
            <JsonLd data={articleJsonLd} />
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Blog", path: "/blog" },
                    { name: post.title, path: `/blog/${post.slug}` },
                ])}
            />
            <article className="max-w-3xl mx-auto">
                {/* Back link */}
                <Link
                    href="/blog"
                    className="inline-flex items-center text-ink-soft hover:text-evergreen transition-colors font-medium text-sm mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Blog
                </Link>

                {/* Header */}
                <header className="mb-10 space-y-4">
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full bg-evergreen-soft text-evergreen-deep text-xs font-semibold"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-ink leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-ink-soft">
                        <span className="font-semibold">{post.author}</span>
                        {formattedDate && (
                            <>
                                <span className="text-hairline-strong">|</span>
                                <span>{formattedDate}</span>
                            </>
                        )}
                    </div>
                </header>

                {/* Content */}
                <BlogPostContent content={post.content} />

                {/* Email capture */}
                <BlogEmailCapture />
            </article>
        </div>
    );
}

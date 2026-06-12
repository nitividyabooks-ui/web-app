import { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";

export const metadata: Metadata = {
    title: "Blog - NitiVidya",
    description:
        "Parenting tips, book recommendations, and Indian cultural activities for toddlers. Read the NitiVidya blog.",
};

export default async function BlogPage() {
    const posts = await getAllBlogPosts();

    return (
        <div className="min-h-screen bg-paper-deep py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-evergreen text-marigold text-sm font-bold">
                        Blog
                    </span>
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold text-ink">
                        Parenting Tips & Book Guides
                    </h1>
                    <p className="text-lg text-ink-soft font-medium max-w-xl mx-auto">
                        Ideas, activities, and stories to help your toddler grow with Indian culture.
                    </p>
                </div>

                {/* Posts Grid */}
                {posts.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <BlogCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                        <p className="text-xl font-heading font-bold text-ink mb-2">
                            Coming soon!
                        </p>
                        <p className="text-ink-soft">
                            We&apos;re writing our first posts. Check back soon.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

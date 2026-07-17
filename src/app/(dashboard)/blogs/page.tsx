import { Search } from "lucide-react";
import connectToDB from "@/lib/mongoose";
import { Blog } from "@/models/Blog";
import { BlogRow } from "@/components/blogs/BlogRow";
import { CreateBlog } from "@/components/blogs/CreateBlog";

export default async function BlogsPage() {
  await connectToDB();
  const rawBlogs = await Blog.find().sort({ createdAt: -1 }).lean() as any[];
  const blogs = JSON.parse(JSON.stringify(rawBlogs));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Blogs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {blogs.length} post{blogs.length !== 1 ? "s" : ""} published
          </p>
        </div>
        <CreateBlog />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 block w-full pl-9 py-2.5 outline-none transition placeholder:text-slate-400"
              placeholder="Search posts…"
            />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-slate-50">
          {blogs.length > 0 ? (
            blogs.map((blog: any) => (
              <BlogRow
                key={blog._id.toString()}
                blog={{
                  _id: blog._id.toString(),
                  title: blog.title,
                  shortDescription: blog.shortDescription,
                  longDescription: blog.longDescription,
                  image: blog.image,
                  author: blog.author,
                  readTime: blog.readTime,
                  createdAt: blog.createdAt?.toString(),
                  date: blog.date,
                  href: blog.href,
                }}
              />
            ))
          ) : (
            <div className="p-16 text-center text-sm text-slate-400">No blog posts found.</div>
          )}
        </div>

        {blogs.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            {blogs.length} post{blogs.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

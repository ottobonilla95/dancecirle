"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import BlogEditor from "@/components/admin/blog/BlogEditor";

export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [posts, setPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch the clicked post first
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) {
          setError("Post not found");
          return;
        }
        const data = await res.json();
        const post = data.post;

        // Fetch all posts with the same slug (other locale versions)
        const allRes = await fetch(`/api/admin/blog?slug=${encodeURIComponent(post.slug)}&limit=10`);
        if (allRes.ok) {
          const allData = await allRes.json();
          setPosts(allData.posts);
        } else {
          // Fallback to just the single post
          setPosts([post]);
        }
      } catch (err) {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-error">{error}</h2>
        </div>
      </div>
    );
  }

  return <BlogEditor initialPosts={posts || []} />;
}

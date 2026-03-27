"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import BlogEditor from "@/components/admin/blog/BlogEditor";

export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) {
          setError("Post not found");
          return;
        }
        const data = await res.json();
        setPost(data.post);
      } catch (err) {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
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

  return <BlogEditor initialPost={post} />;
}

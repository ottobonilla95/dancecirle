"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { FaNewspaper, FaPlus, FaEdit, FaSearch, FaTrash, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "@/navigation";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  locale: string;
  category: string;
  excerpt: string;
  coverImage: string;
  body: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [page, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/blog?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete || deleteConfirmText !== "delete") return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blog/${postToDelete._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setPostToDelete(null);
        setDeleteConfirmText("");
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaNewspaper className="text-primary" />
            Blog Management
          </h1>
          <p className="text-base-content/70 mt-1">
            Create and manage blog posts
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/blog/new")}
          className="btn btn-primary gap-2"
        >
          <FaPlus />
          Add Post
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Locale</th>
                <th>Category</th>
                <th>Published</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-base-content/60">
                    No posts found
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <span className="font-semibold">{post.title}</span>
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm">
                        {post.locale.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm capitalize">
                        {post.category}
                      </span>
                    </td>
                    <td>
                      {post.isPublished ? (
                        <span className="badge badge-success gap-1">
                          <FaCheck className="text-xs" /> Published
                        </span>
                      ) : (
                        <span className="badge badge-warning gap-1">
                          <FaTimes className="text-xs" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="text-sm">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {post.slug && (
                          <a
                            href={`/${post.locale}/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm gap-1"
                          >
                            <FaExternalLinkAlt /> View
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/admin/blog/${post._id}/edit`)}
                          className="btn btn-ghost btn-sm gap-1"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(post)}
                          className="btn btn-ghost btn-sm gap-1 text-error hover:bg-error hover:text-error-content"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <span className="flex items-center px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && postToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 text-error">
              Delete Post: {postToDelete.title}
            </h3>

            <div className="space-y-4">
              <div className="alert alert-warning">
                <FaTrash />
                <div>
                  <p className="font-semibold">This action cannot be undone!</p>
                  <p className="text-sm">
                    This will permanently delete the post &quot;{postToDelete.title}&quot;.
                  </p>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Type <code className="bg-base-300 px-2 py-1 rounded">delete</code> to confirm:
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Type 'delete' here"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="input input-bordered"
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPostToDelete(null);
                  setDeleteConfirmText("");
                }}
                className="btn btn-ghost"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-error"
                disabled={deleteConfirmText !== "delete" || deleting}
              >
                {deleting ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <FaTrash /> Delete Post
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              if (!deleting) {
                setShowDeleteModal(false);
                setPostToDelete(null);
                setDeleteConfirmText("");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

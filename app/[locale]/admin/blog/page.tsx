"use client";

import { useState, useEffect } from "react";
import { FaNewspaper, FaPlus, FaEdit, FaSearch, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

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
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "guides", label: "Guides" },
  { value: "travel", label: "Travel" },
  { value: "dance-tips", label: "Dance Tips" },
  { value: "culture", label: "Culture" },
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
];

const defaultFormData = {
  title: "",
  locale: "en",
  category: "guides",
  excerpt: "",
  coverImage: "",
  body: "",
  isPublished: false,
  metaTitle: "",
  metaDescription: "",
  keywords: "",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState(defaultFormData);

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

  const handleAddPost = () => {
    setEditingPost(null);
    setFormData({ ...defaultFormData });
    setShowModal(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      locale: post.locale,
      category: post.category,
      excerpt: post.excerpt || "",
      coverImage: post.coverImage || "",
      body: post.body || "",
      isPublished: post.isPublished,
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      keywords: post.keywords || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingPost
        ? `/api/admin/blog/${editingPost._id}`
        : "/api/admin/blog";

      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchPosts();
      } else {
        alert("Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving post");
    } finally {
      setSaving(false);
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
        <button onClick={handleAddPost} className="btn btn-primary gap-2">
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
                        <button
                          onClick={() => handleEditPost(post)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              {editingPost ? "Edit Post" : "Add New Post"}
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title *</span>
                </label>
                <input
                  type="text"
                  placeholder="Post title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              {/* Locale & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Locale *</span>
                  </label>
                  <select
                    value={formData.locale}
                    onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                    className="select select-bordered"
                  >
                    {LOCALES.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Category *</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select select-bordered"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Excerpt</span>
                </label>
                <textarea
                  placeholder="Short summary of the post..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="textarea textarea-bordered"
                  rows={2}
                />
              </div>

              {/* Cover Image */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Cover Image URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              {/* Body (Markdown) */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Body (Markdown)</span>
                </label>
                <textarea
                  placeholder="Write your post content in markdown..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="textarea textarea-bordered font-mono text-sm"
                  rows={12}
                />
              </div>

              {/* Published */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">Published</span>
                </label>
              </div>

              {/* SEO Section */}
              <div className="divider">SEO</div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Meta Title</span>
                </label>
                <input
                  type="text"
                  placeholder="SEO title (defaults to post title)"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Meta Description</span>
                </label>
                <input
                  type="text"
                  placeholder="SEO description"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Keywords</span>
                </label>
                <input
                  type="text"
                  placeholder="comma, separated, keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? <span className="loading loading-spinner"></span> : "Save"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

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

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="text-sm mb-2">
                  <strong>Post Details:</strong>
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Locale: {postToDelete.locale.toUpperCase()}</li>
                  <li>• Category: {postToDelete.category}</li>
                  <li>• Status: {postToDelete.isPublished ? "Published" : "Draft"}</li>
                </ul>
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

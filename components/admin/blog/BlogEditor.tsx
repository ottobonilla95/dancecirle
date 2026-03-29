"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, Link } from "@/navigation";
import ImageBlockUploader from "./ImageBlockUploader";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaFont,
  FaImage,
  FaColumns,
  FaChevronDown,
  FaChevronUp,
  FaExchangeAlt,
} from "react-icons/fa";

interface Block {
  id: string;
  type: "text" | "image" | "two-column";
  // text block
  content?: string;
  // image block
  url?: string;
  alt?: string;
  // two-column block
  text?: string;
  image?: { url: string; alt: string };
  imagePosition?: "left" | "right";
}

interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string;
  coverImage: string;
  locale: string;
  category: string;
  isPublished: boolean;
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string };
  // Legacy flat SEO fields
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

interface BlogEditorProps {
  initialPost?: BlogPost;
}

const CATEGORIES = [
  { value: "guides", label: "Guides" },
  { value: "travel", label: "Travel" },
  { value: "dance-tips", label: "Dance Tips" },
  { value: "culture", label: "Culture" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function parseBodyToBlocks(body: string): Block[] {
  if (!body?.trim()) {
    return [{ id: generateId(), type: "text", content: "" }];
  }

  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return parsed.map((b: any) => ({ ...b, id: b.id || generateId() }));
    }
  } catch {
    // Legacy markdown body — wrap in a single text block
  }

  return [{ id: generateId(), type: "text", content: body }];
}

function blocksToJson(blocks: Block[]): string {
  const cleaned = blocks.map((b) => {
    const { id, ...rest } = b;
    return rest;
  });
  return JSON.stringify(cleaned);
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none ${className}`}
      rows={3}
    />
  );
}

export default function BlogEditor({ initialPost }: BlogEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [locale, setLocale] = useState(initialPost?.locale || "en");
  const [category, setCategory] = useState(initialPost?.category || "guides");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [blocks, setBlocks] = useState<Block[]>(() =>
    parseBodyToBlocks(initialPost?.body || "")
  );
  const [seo, setSeo] = useState({
    metaTitle: initialPost?.seo?.metaTitle || initialPost?.metaTitle || "",
    metaDescription: initialPost?.seo?.metaDescription || initialPost?.metaDescription || "",
    keywords: initialPost?.seo?.keywords || initialPost?.keywords || "",
  });
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((b) => b.id !== id);
    });
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;

      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const addBlock = (type: "text" | "image" | "two-column") => {
    const newBlock: Block = { id: generateId(), type };
    if (type === "text") {
      newBlock.content = "";
    } else if (type === "image") {
      newBlock.url = "";
      newBlock.alt = "";
    } else {
      newBlock.text = "";
      newBlock.image = { url: "", alt: "" };
      newBlock.imagePosition = "right";
    }
    setBlocks((prev) => [...prev, newBlock]);
    setShowAddMenu(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        ...(slug && { slug }),
        body: blocksToJson(blocks),
        excerpt,
        coverImage,
        locale,
        category,
        isPublished: publish,
        seo: {
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          keywords: seo.keywords,
        },
      };

      const url = initialPost
        ? `/api/admin/blog/${initialPost._id}`
        : "/api/admin/blog";
      const method = initialPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/blog");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/admin/blog" className="btn btn-ghost btn-sm gap-2">
            <FaArrowLeft /> Back
          </Link>

          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="join">
              <button
                onClick={() => setLocale("en")}
                className={`join-item btn btn-sm ${locale === "en" ? "btn-primary" : "btn-ghost"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("es")}
                className={`join-item btn btn-sm ${locale === "es" ? "btn-primary" : "btn-ghost"}`}
              >
                ES
              </button>
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select select-bordered select-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Save buttons */}
            <button
              onClick={() => handleSave(false)}
              className="btn btn-ghost btn-sm"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => handleSave(true)}
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? "Saving..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title..."
          className="w-full text-4xl font-bold bg-transparent outline-none border-none placeholder-base-content/30 mb-6"
        />

        {/* Slug */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-base-content/40 shrink-0">/blog/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
            placeholder="auto-generated-from-title"
            className="w-full text-sm text-base-content/50 bg-transparent outline-none border-none placeholder-base-content/20"
          />
        </div>

        {/* Excerpt */}
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt or summary..."
          className="w-full text-base-content/60 bg-transparent outline-none border-none placeholder-base-content/20 resize-none mb-8"
          rows={2}
        />

        {/* Cover Image */}
        <div className="mb-8">
          <label className="text-sm font-medium text-base-content/50 mb-2 block">
            Cover Image
          </label>
          <ImageBlockUploader
            imageUrl={coverImage}
            onUpload={(url) => setCoverImage(url)}
            onRemove={() => setCoverImage("")}
          />
        </div>

        {/* Divider */}
        <div className="divider text-base-content/30 text-sm">Content Blocks</div>

        {/* Blocks */}
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="group relative bg-base-200 rounded-lg p-4 border border-base-300 hover:border-primary/30 transition-colors"
            >
              {/* Block controls */}
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <button
                  onClick={() => moveBlock(block.id, "up")}
                  className="btn btn-ghost btn-xs"
                  disabled={index === 0}
                >
                  <FaArrowUp />
                </button>
                <button
                  onClick={() => moveBlock(block.id, "down")}
                  className="btn btn-ghost btn-xs"
                  disabled={index === blocks.length - 1}
                >
                  <FaArrowDown />
                </button>
              </div>

              {/* Delete button */}
              <button
                onClick={() => removeBlock(block.id)}
                className="absolute -right-2 -top-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={blocks.length <= 1}
              >
                <FaTrash className="text-[10px]" />
              </button>

              {/* Block type label */}
              <div className="text-xs text-base-content/40 mb-2 uppercase tracking-wider">
                {block.type === "two-column" ? "Two Column" : block.type}
              </div>

              {/* Text block */}
              {block.type === "text" && (
                <AutoResizeTextarea
                  value={block.content || ""}
                  onChange={(val) => updateBlock(block.id, { content: val })}
                  placeholder="Start writing... (supports markdown)"
                  className="text-base leading-relaxed"
                />
              )}

              {/* Image block */}
              {block.type === "image" && (
                <div className="space-y-2">
                  <ImageBlockUploader
                    imageUrl={block.url}
                    onUpload={(url) => updateBlock(block.id, { url })}
                    onRemove={() => updateBlock(block.id, { url: "" })}
                  />
                  {block.url && (
                    <input
                      type="text"
                      value={block.alt || ""}
                      onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                      placeholder="Image caption (optional)"
                      className="input input-bordered input-sm w-full"
                    />
                  )}
                </div>
              )}

              {/* Two-column block */}
              {block.type === "two-column" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateBlock(block.id, {
                          imagePosition:
                            block.imagePosition === "left" ? "right" : "left",
                        })
                      }
                      className="btn btn-ghost btn-xs gap-1"
                    >
                      <FaExchangeAlt />
                      Image {block.imagePosition === "left" ? "Left" : "Right"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {block.imagePosition === "left" ? (
                      <>
                        <ImageBlockUploader
                          imageUrl={block.image?.url}
                          onUpload={(url) =>
                            updateBlock(block.id, {
                              image: { url, alt: block.image?.alt || "" },
                            })
                          }
                          onRemove={() =>
                            updateBlock(block.id, {
                              image: { url: "", alt: "" },
                            })
                          }
                          compact
                        />
                        <AutoResizeTextarea
                          value={block.text || ""}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          placeholder="Text content... (supports markdown)"
                          className="text-sm leading-relaxed"
                        />
                      </>
                    ) : (
                      <>
                        <AutoResizeTextarea
                          value={block.text || ""}
                          onChange={(val) => updateBlock(block.id, { text: val })}
                          placeholder="Text content... (supports markdown)"
                          className="text-sm leading-relaxed"
                        />
                        <ImageBlockUploader
                          imageUrl={block.image?.url}
                          onUpload={(url) =>
                            updateBlock(block.id, {
                              image: { url, alt: block.image?.alt || "" },
                            })
                          }
                          onRemove={() =>
                            updateBlock(block.id, {
                              image: { url: "", alt: "" },
                            })
                          }
                          compact
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Block Button */}
        <div className="flex justify-center mt-6 relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="btn btn-circle btn-outline btn-primary"
          >
            <FaPlus />
          </button>

          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute bottom-14 z-20 bg-base-200 rounded-lg shadow-xl border border-base-300 p-2 flex gap-2">
                <button
                  onClick={() => addBlock("text")}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <FaFont /> Text
                </button>
                <button
                  onClick={() => addBlock("image")}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <FaImage /> Image
                </button>
                <button
                  onClick={() => addBlock("two-column")}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <FaColumns /> Two Column
                </button>
              </div>
            </>
          )}
        </div>

        {/* SEO Section */}
        <div className="mt-12 border border-base-300 rounded-lg">
          <button
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-base-content/60"
          >
            <span>SEO Settings</span>
            {seoOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {seoOpen && (
            <div className="p-4 pt-0 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Meta Title</span>
                </label>
                <input
                  type="text"
                  value={seo.metaTitle}
                  onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                  placeholder="SEO title (defaults to post title)"
                  className="input input-bordered input-sm"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Meta Description</span>
                </label>
                <input
                  type="text"
                  value={seo.metaDescription}
                  onChange={(e) =>
                    setSeo({ ...seo, metaDescription: e.target.value })
                  }
                  placeholder="SEO description"
                  className="input input-bordered input-sm"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm">Keywords</span>
                </label>
                <input
                  type="text"
                  value={seo.keywords}
                  onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                  placeholder="comma, separated, keywords"
                  className="input input-bordered input-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  FaGlobe,
} from "react-icons/fa";

interface Block {
  id: string;
  type: "text" | "image" | "two-column";
  content?: string;
  url?: string;
  alt?: string;
  text?: string;
  image?: { url: string; alt: string };
  imagePosition?: "left" | "right";
}

interface LocaleData {
  _id?: string;
  title: string;
  excerpt: string;
  blocks: Block[];
  seo: { metaTitle: string; metaDescription: string; keywords: string };
  isPublished: boolean;
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
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

interface BlogEditorProps {
  initialPosts?: BlogPost[];
}

const CATEGORIES = [
  { value: "guides", label: "Guides" },
  { value: "travel", label: "Travel" },
  { value: "dance-tips", label: "Dance Tips" },
  { value: "culture", label: "Culture" },
];

const LOCALES = ["en", "es"] as const;
type Locale = (typeof LOCALES)[number];

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
    // Legacy markdown
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

function makeEmptyLocaleData(): LocaleData {
  return {
    title: "",
    excerpt: "",
    blocks: [{ id: generateId(), type: "text", content: "" }],
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
    isPublished: false,
  };
}

function postToLocaleData(post: BlogPost): LocaleData {
  return {
    _id: post._id,
    title: post.title,
    excerpt: post.excerpt || "",
    blocks: parseBodyToBlocks(post.body),
    seo: {
      metaTitle: post.seo?.metaTitle || post.metaTitle || "",
      metaDescription: post.seo?.metaDescription || post.metaDescription || "",
      keywords: post.seo?.keywords || post.keywords || "",
    },
    isPublished: post.isPublished,
  };
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
  useEffect(() => { resize(); }, [value, resize]);

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

export default function BlogEditor({ initialPosts = [] }: BlogEditorProps) {
  const router = useRouter();

  // Shared fields
  const firstPost = initialPosts[0];
  const [slug, setSlug] = useState(firstPost?.slug || "");
  const [category, setCategory] = useState(firstPost?.category || "guides");
  const [coverImage, setCoverImage] = useState(firstPost?.coverImage || "");

  // Per-locale data
  const [localeData, setLocaleData] = useState<Record<Locale, LocaleData>>(() => {
    const data: Record<Locale, LocaleData> = {
      en: makeEmptyLocaleData(),
      es: makeEmptyLocaleData(),
    };
    for (const post of initialPosts) {
      const loc = post.locale as Locale;
      if (LOCALES.includes(loc)) {
        data[loc] = postToLocaleData(post);
      }
    }
    return data;
  });

  const [activeLocale, setActiveLocale] = useState<Locale>(() => {
    // Start on the locale that has content, prefer EN
    if (initialPosts.find((p) => p.locale === "en")) return "en";
    if (initialPosts.find((p) => p.locale === "es")) return "es";
    return "en";
  });

  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const current = localeData[activeLocale];

  const updateCurrent = (updates: Partial<LocaleData>) => {
    setLocaleData((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], ...updates },
    }));
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    updateCurrent({
      blocks: current.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  };

  const removeBlock = (id: string) => {
    if (current.blocks.length <= 1) return;
    updateCurrent({ blocks: current.blocks.filter((b) => b.id !== id) });
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const idx = current.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === current.blocks.length - 1) return;
    const next = [...current.blocks];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    updateCurrent({ blocks: next });
  };

  const addBlock = (type: "text" | "image" | "two-column") => {
    const newBlock: Block = { id: generateId(), type };
    if (type === "text") newBlock.content = "";
    else if (type === "image") { newBlock.url = ""; newBlock.alt = ""; }
    else { newBlock.text = ""; newBlock.image = { url: "", alt: "" }; newBlock.imagePosition = "right"; }
    updateCurrent({ blocks: [...current.blocks, newBlock] });
    setShowAddMenu(false);
  };

  const hasContent = (loc: Locale) => {
    const d = localeData[loc];
    return d.title.trim() !== "" || d.blocks.some((b) => (b.content || b.url || b.text || b.image?.url));
  };

  const handleSave = async (publish: boolean) => {
    if (!current.title.trim()) {
      alert("Title is required for " + activeLocale.toUpperCase());
      return;
    }

    setSaving(true);
    try {
      // Save each locale that has content
      for (const loc of LOCALES) {
        const d = localeData[loc];
        if (!d.title.trim()) continue; // Skip empty locales

        const isPublished = loc === activeLocale ? publish : d.isPublished;

        const payload = {
          title: d.title,
          slug: slug || undefined,
          body: blocksToJson(d.blocks),
          excerpt: d.excerpt,
          coverImage,
          locale: loc,
          category,
          isPublished,
          seo: {
            metaTitle: d.seo.metaTitle,
            metaDescription: d.seo.metaDescription,
            keywords: d.seo.keywords,
          },
        };

        const url = d._id
          ? `/api/admin/blog/${d._id}`
          : "/api/admin/blog";
        const method = d._id ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(`Failed to save ${loc.toUpperCase()}: ${data.error || "Unknown error"}`);
          setSaving(false);
          return;
        }
      }

      router.push("/admin/blog");
    } catch (error) {
      console.error("Error saving posts:", error);
      alert("Error saving posts");
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
        {/* Slug */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-base-content/40 shrink-0">/blog/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
            placeholder="auto-generated-from-title"
            className="w-full text-sm text-base-content/50 bg-transparent outline-none border-none placeholder-base-content/20"
          />
        </div>

        {/* Cover Image (shared) */}
        <div className="mb-8">
          <label className="text-sm font-medium text-base-content/50 mb-2 block">
            Cover Image (shared across locales)
          </label>
          <ImageBlockUploader
            imageUrl={coverImage}
            onUpload={(url) => setCoverImage(url)}
            onRemove={() => setCoverImage("")}
          />
        </div>

        {/* Locale Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-base-300">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveLocale(loc)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeLocale === loc
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/50 hover:text-base-content/80"
              }`}
            >
              <FaGlobe className="text-xs" />
              {loc.toUpperCase()}
              {hasContent(loc) && (
                <span className={`w-2 h-2 rounded-full ${localeData[loc].isPublished ? "bg-success" : "bg-warning"}`} />
              )}
            </button>
          ))}
        </div>

        {/* Per-locale content */}
        <div>
          {/* Title */}
          <input
            type="text"
            value={current.title}
            onChange={(e) => updateCurrent({ title: e.target.value })}
            placeholder={`Post title (${activeLocale.toUpperCase()})...`}
            className="w-full text-4xl font-bold bg-transparent outline-none border-none placeholder-base-content/30 mb-4"
          />

          {/* Excerpt */}
          <textarea
            value={current.excerpt}
            onChange={(e) => updateCurrent({ excerpt: e.target.value })}
            placeholder={`Short excerpt (${activeLocale.toUpperCase()})...`}
            className="w-full text-base-content/60 bg-transparent outline-none border-none placeholder-base-content/20 resize-none mb-8"
            rows={2}
          />

          {/* Divider */}
          <div className="divider text-base-content/30 text-sm">
            Content Blocks ({activeLocale.toUpperCase()})
          </div>

          {/* Blocks */}
          <div className="space-y-4">
            {current.blocks.map((block, index) => (
              <div
                key={block.id}
                className="group relative bg-base-200 rounded-lg p-4 border border-base-300 hover:border-primary/30 transition-colors"
              >
                {/* Block controls */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                  <button onClick={() => moveBlock(block.id, "up")} className="btn btn-ghost btn-xs" disabled={index === 0}>
                    <FaArrowUp />
                  </button>
                  <button onClick={() => moveBlock(block.id, "down")} className="btn btn-ghost btn-xs" disabled={index === current.blocks.length - 1}>
                    <FaArrowDown />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeBlock(block.id)}
                  className="absolute -right-2 -top-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={current.blocks.length <= 1}
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
                        onClick={() => updateBlock(block.id, { imagePosition: block.imagePosition === "left" ? "right" : "left" })}
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
                            onUpload={(url) => updateBlock(block.id, { image: { url, alt: block.image?.alt || "" } })}
                            onRemove={() => updateBlock(block.id, { image: { url: "", alt: "" } })}
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
                            onUpload={(url) => updateBlock(block.id, { image: { url, alt: block.image?.alt || "" } })}
                            onRemove={() => updateBlock(block.id, { image: { url: "", alt: "" } })}
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
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                <div className="absolute bottom-14 z-20 bg-base-200 rounded-lg shadow-xl border border-base-300 p-2 flex gap-2">
                  <button onClick={() => addBlock("text")} className="btn btn-ghost btn-sm gap-2"><FaFont /> Text</button>
                  <button onClick={() => addBlock("image")} className="btn btn-ghost btn-sm gap-2"><FaImage /> Image</button>
                  <button onClick={() => addBlock("two-column")} className="btn btn-ghost btn-sm gap-2"><FaColumns /> Two Column</button>
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
              <span>SEO Settings ({activeLocale.toUpperCase()})</span>
              {seoOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {seoOpen && (
              <div className="p-4 pt-0 space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Meta Title</span></label>
                  <input
                    type="text"
                    value={current.seo.metaTitle}
                    onChange={(e) => updateCurrent({ seo: { ...current.seo, metaTitle: e.target.value } })}
                    placeholder="SEO title (defaults to post title)"
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Meta Description</span></label>
                  <input
                    type="text"
                    value={current.seo.metaDescription}
                    onChange={(e) => updateCurrent({ seo: { ...current.seo, metaDescription: e.target.value } })}
                    placeholder="SEO description"
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-sm">Keywords</span></label>
                  <input
                    type="text"
                    value={current.seo.keywords}
                    onChange={(e) => updateCurrent({ seo: { ...current.seo, keywords: e.target.value } })}
                    placeholder="comma, separated, keywords"
                    className="input input-bordered input-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

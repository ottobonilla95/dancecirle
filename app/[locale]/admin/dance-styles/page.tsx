"use client";

import { useState, useEffect } from "react";
import { FaMusic, FaPlus, FaEdit, FaSearch, FaCheck, FaTimes, FaArrowUp, FaArrowDown } from "react-icons/fa";

interface DanceStyle {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  category: "latin" | "ballroom" | "street" | "contemporary" | "traditional";
  isPartnerDance: boolean;
  isActive: boolean;
  sequence: number;
}

const categoryColors = {
  latin: "badge-error",
  ballroom: "badge-primary",
  street: "badge-warning",
  contemporary: "badge-info",
  traditional: "badge-success",
};

export default function AdminDanceStylesPage() {
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState<DanceStyle | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<DanceStyle>>({
    name: "",
    description: "",
    image: "",
    category: "latin",
    isPartnerDance: true,
    isActive: true,
    sequence: 0,
  });

  useEffect(() => {
    fetchDanceStyles();
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDanceStyles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/dance-styles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDanceStyles(data.danceStyles);
      }
    } catch (error) {
      console.error("Error fetching dance styles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStyle = () => {
    setEditingStyle(null);
    setFormData({
      name: "",
      description: "",
      image: "",
      category: "latin",
      isPartnerDance: true,
      isActive: true,
      sequence: danceStyles.length > 0 ? Math.max(...danceStyles.map(s => s.sequence)) + 1 : 0,
    });
    setShowModal(true);
  };

  const handleEditStyle = (style: DanceStyle) => {
    setEditingStyle(style);
    setFormData({
      name: style.name,
      description: style.description || "",
      image: style.image || "",
      category: style.category,
      isPartnerDance: style.isPartnerDance,
      isActive: style.isActive,
      sequence: style.sequence,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingStyle
        ? `/api/admin/dance-styles/${editingStyle._id}`
        : "/api/admin/dance-styles";
      
      const method = editingStyle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchDanceStyles();
      } else {
        alert("Failed to save dance style");
      }
    } catch (error) {
      console.error("Error saving dance style:", error);
      alert("Error saving dance style");
    } finally {
      setSaving(false);
    }
  };

  const moveStyle = async (style: DanceStyle, direction: "up" | "down") => {
    const currentIndex = danceStyles.findIndex(s => s._id === style._id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === danceStyles.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const otherStyle = danceStyles[newIndex];

    // Swap sequences
    const newSequence = otherStyle.sequence;
    const otherNewSequence = style.sequence;

    try {
      await Promise.all([
        fetch(`/api/admin/dance-styles/${style._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...style, sequence: newSequence }),
        }),
        fetch(`/api/admin/dance-styles/${otherStyle._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...otherStyle, sequence: otherNewSequence }),
        }),
      ]);

      fetchDanceStyles();
    } catch (error) {
      console.error("Error moving dance style:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaMusic className="text-primary" />
            Dance Style Management
          </h1>
          <p className="text-base-content/70 mt-1">
            Manage dance styles and set their order for onboarding
          </p>
        </div>
        <button onClick={handleAddStyle} className="btn btn-primary gap-2">
          <FaPlus />
          Add Dance Style
        </button>
      </div>

      {/* Stats */}
      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-title">Total Styles</div>
          <div className="stat-value text-primary">{danceStyles.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Active</div>
          <div className="stat-value text-success">
            {danceStyles.filter(s => s.isActive).length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Partner Dances</div>
          <div className="stat-value text-info">
            {danceStyles.filter(s => s.isPartnerDance).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search dance styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>

      {/* Dance Styles Table */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="w-20">Order</th>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Sequence #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : danceStyles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-base-content/60">
                    No dance styles found
                  </td>
                </tr>
              ) : (
                danceStyles.map((style, index) => (
                  <tr key={style._id}>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveStyle(style, "up")}
                          disabled={index === 0}
                          className="btn btn-ghost btn-xs"
                          title="Move up"
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          onClick={() => moveStyle(style, "down")}
                          disabled={index === danceStyles.length - 1}
                          className="btn btn-ghost btn-xs"
                          title="Move down"
                        >
                          <FaArrowDown />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {style.image && (
                          <div className="avatar">
                            <div className="w-10 h-10 rounded">
                              <img src={style.image} alt={style.name} />
                            </div>
                          </div>
                        )}
                        <span className="font-semibold">{style.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${categoryColors[style.category]} badge-sm`}>
                        {style.category}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {style.isPartnerDance ? "Partner Dance" : "Solo Dance"}
                      </span>
                    </td>
                    <td>
                      {style.isActive ? (
                        <span className="badge badge-success gap-1">
                          <FaCheck className="text-xs" /> Active
                        </span>
                      ) : (
                        <span className="badge badge-error gap-1">
                          <FaTimes className="text-xs" /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm">{style.sequence}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleEditStyle(style)}
                        className="btn btn-ghost btn-sm gap-1"
                      >
                        <FaEdit /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingStyle ? "Edit Dance Style" : "Add New Dance Style"}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salsa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Dance style description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered h-20"
                />
              </div>

              {/* Image URL */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Image URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              {/* Category */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Category *</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as DanceStyle["category"],
                    })
                  }
                  className="select select-bordered"
                >
                  <option value="latin">Latin</option>
                  <option value="ballroom">Ballroom</option>
                  <option value="street">Street</option>
                  <option value="contemporary">Contemporary</option>
                  <option value="traditional">Traditional</option>
                </select>
              </div>

              {/* Sequence */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sequence (for ordering)</span>
                </label>
                <input
                  type="number"
                  value={formData.sequence}
                  onChange={(e) =>
                    setFormData({ ...formData, sequence: parseInt(e.target.value) || 0 })
                  }
                  className="input input-bordered"
                />
                <label className="label">
                  <span className="label-text-alt">Lower numbers appear first in onboarding</span>
                </label>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPartnerDance}
                      onChange={(e) =>
                        setFormData({ ...formData, isPartnerDance: e.target.checked })
                      }
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">Partner Dance</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">Active</span>
                  </label>
                </div>
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
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { FaGlobe, FaPlus, FaEdit, FaSearch, FaCheck, FaTimes, FaTrash } from "react-icons/fa";

interface Country {
  _id: string;
  name: string;
  code: string;
  continent: {
    _id: string;
    name: string;
    code: string;
  };
  totalDancers: number;
  isActive: boolean;
  socialGroups?: {
    whatsapp?: string;
    line?: string;
    telegram?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
}

interface Continent {
  _id: string;
  name: string;
  code: string;
}

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Country>>({
    name: "",
    code: "",
    continent: { _id: "", name: "", code: "" },
    totalDancers: 0,
    isActive: true,
    socialGroups: {
      whatsapp: "",
      line: "",
      telegram: "",
      facebook: "",
      instagram: "",
      website: "",
    },
  });

  useEffect(() => {
    fetchReferenceData();
    fetchCountries();
  }, [page, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReferenceData = async () => {
    try {
      const res = await fetch("/api/admin/reference-data");
      if (res.ok) {
        const data = await res.json();
        setContinents(data.continents);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/countries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCountries(data.countries);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = () => {
    setEditingCountry(null);
    setFormData({
      name: "",
      code: "",
      continent: { _id: "", name: "", code: "" },
      totalDancers: 0,
      isActive: true,
      socialGroups: {
        whatsapp: "",
        line: "",
        telegram: "",
        facebook: "",
        instagram: "",
      },
    });
    setShowModal(true);
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      continent: country.continent,
      totalDancers: country.totalDancers,
      isActive: country.isActive,
      socialGroups: country.socialGroups || {},
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        continent: formData.continent?._id,
        totalDancers: formData.totalDancers,
        isActive: formData.isActive,
        socialGroups: formData.socialGroups,
      };

      const url = editingCountry
        ? `/api/admin/countries/${editingCountry._id}`
        : "/api/admin/countries";
      
      const method = editingCountry ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCountries();
      } else {
        alert("Failed to save country");
      }
    } catch (error) {
      console.error("Error saving country:", error);
      alert("Error saving country");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (countryId: string) => {
    if (!confirm("Are you sure you want to delete this country?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/countries/${countryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCountries();
      } else {
        alert("Failed to delete country");
      }
    } catch (error) {
      console.error("Error deleting country:", error);
      alert("Error deleting country");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaGlobe className="text-primary" />
            Country Management
          </h1>
          <p className="text-base-content/70 mt-1">
            Add and edit countries in the platform
          </p>
        </div>
        <button onClick={handleAddCountry} className="btn btn-primary gap-2">
          <FaPlus />
          Add Country
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>

      {/* Countries Table */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Country</th>
                <th>Code</th>
                <th>Continent</th>
                <th>Dancers</th>
                <th>Status</th>
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
              ) : countries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-base-content/60">
                    No countries found
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr key={country._id}>
                    <td>
                      <span className="font-semibold">{country.name}</span>
                    </td>
                    <td>
                      <span className="badge badge-outline">{country.code}</span>
                    </td>
                    <td>{country.continent.name}</td>
                    <td>
                      <span className="badge badge-primary">{country.totalDancers}</span>
                    </td>
                    <td>
                      {country.isActive ? (
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCountry(country)}
                          className="btn btn-ghost btn-sm gap-1"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(country._id)}
                          className="btn btn-ghost btn-sm gap-1 text-error"
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
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              {editingCountry ? "Edit Country" : "Add New Country"}
            </h3>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country Code *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. US"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input input-bordered"
                    maxLength={2}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Continent *</span>
                  </label>
                  <select
                    value={formData.continent?._id}
                    onChange={(e) => {
                      const selected = continents.find((c) => c._id === e.target.value);
                      if (selected) {
                        setFormData({ ...formData, continent: selected });
                      }
                    }}
                    className="select select-bordered"
                  >
                    <option value="">Select continent</option>
                    {continents.map((continent) => (
                      <option key={continent._id} value={continent._id}>
                        {continent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Total Dancers</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalDancers}
                    onChange={(e) =>
                      setFormData({ ...formData, totalDancers: parseInt(e.target.value) || 0 })
                    }
                    className="input input-bordered"
                  />
                </div>
              </div>

              {/* Social Groups */}
              <div className="divider">Social Groups</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">WhatsApp</span>
                  </label>
                  <input
                    type="text"
                    placeholder="WhatsApp invite link"
                    value={formData.socialGroups?.whatsapp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialGroups: {
                          ...formData.socialGroups!,
                          whatsapp: e.target.value,
                        },
                      })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Telegram</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Telegram invite link"
                    value={formData.socialGroups?.telegram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialGroups: {
                          ...formData.socialGroups!,
                          telegram: e.target.value,
                        },
                      })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Facebook</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Facebook group link"
                    value={formData.socialGroups?.facebook}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialGroups: {
                          ...formData.socialGroups!,
                          facebook: e.target.value,
                        },
                      })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Instagram</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Instagram profile"
                    value={formData.socialGroups?.instagram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialGroups: {
                          ...formData.socialGroups!,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">LINE</span>
                  </label>
                  <input
                    type="text"
                    placeholder="LINE invite link"
                    value={formData.socialGroups?.line}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialGroups: {
                          ...formData.socialGroups!,
                          line: e.target.value,
                        },
                      })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Website</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Community website URL"
                    value={formData.socialGroups?.website}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialGroups: {
                          ...formData.socialGroups!,
                          website: e.target.value,
                        },
                      })
                    }
                    className="input input-bordered input-sm"
                  />
                </div>
              </div>

              {/* Status */}
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


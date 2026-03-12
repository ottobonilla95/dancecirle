"use client";

import { useState, useEffect } from "react";
import { FaCity, FaPlus, FaEdit, FaSearch, FaGlobe, FaMapMarkerAlt, FaCheck, FaTimes, FaTrash, FaSync } from "react-icons/fa";

interface City {
  _id: string;
  name: string;
  country: {
    _id: string;
    name: string;
    code: string;
  };
  continent: {
    _id: string;
    name: string;
    code: string;
  };
  population: number;
  totalDancers: number;
  image?: string;
  description?: string;
  rank: number;
  coordinates: {
    lat: number;
    lng: number;
  };
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

interface Country {
  _id: string;
  name: string;
  code: string;
}

interface Continent {
  _id: string;
  name: string;
  code: string;
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<City>>({
    name: "",
    country: { _id: "", name: "", code: "" },
    continent: { _id: "", name: "", code: "" },
    population: 0,
    totalDancers: 0,
    image: "",
    description: "",
    rank: 0,
    coordinates: { lat: 0, lng: 0 },
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
    fetchCities();
  }, [page, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReferenceData = async () => {
    try {
      const res = await fetch("/api/admin/reference-data");
      if (res.ok) {
        const data = await res.json();
        setCountries(data.countries);
        setContinents(data.continents);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  const fetchCities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/cities?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = () => {
    setEditingCity(null);
    setFormData({
      name: "",
      country: { _id: "", name: "", code: "" },
      continent: { _id: "", name: "", code: "" },
      population: 0,
      totalDancers: 0,
      image: "",
      description: "",
      rank: 0,
      coordinates: { lat: 0, lng: 0 },
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

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      country: city.country,
      continent: city.continent,
      population: city.population,
      totalDancers: city.totalDancers,
      image: city.image || "",
      description: city.description || "",
      rank: city.rank,
      coordinates: city.coordinates,
      isActive: city.isActive,
      socialGroups: city.socialGroups || {},
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        country: formData.country?._id,
        continent: formData.continent?._id,
        population: formData.population,
        totalDancers: formData.totalDancers,
        image: formData.image,
        description: formData.description,
        rank: formData.rank,
        coordinates: formData.coordinates,
        isActive: formData.isActive,
        socialGroups: formData.socialGroups,
      };

      const url = editingCity
        ? `/api/admin/cities/${editingCity._id}`
        : "/api/admin/cities";
      
      const method = editingCity ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCities();
      } else {
        alert("Failed to save city");
      }
    } catch (error) {
      console.error("Error saving city:", error);
      alert("Error saving city");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (city: City) => {
    setCityToDelete(city);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cityToDelete || deleteConfirmText !== "delete") return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cities/${cityToDelete._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setCityToDelete(null);
        setDeleteConfirmText("");
        fetchCities();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete city");
      }
    } catch (error) {
      console.error("Error deleting city:", error);
      alert("Error deleting city");
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncDancers = async () => {
    if (!confirm("Sync all city dancer counts based on actual user data? This will update totalDancers for all cities.")) {
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync/city-dancers", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Success! Updated ${data.stats.totalCitiesWithDancers} cities with ${data.stats.totalDancersProcessed} total dancers.`);
        fetchCities(); // Refresh the list to show updated counts
      } else {
        const error = await res.json();
        alert(error.error || "Failed to sync city dancers");
      }
    } catch (error) {
      console.error("Error syncing city dancers:", error);
      alert("Error syncing city dancers");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaCity className="text-primary" />
            City Management
          </h1>
          <p className="text-base-content/70 mt-1">
            Add and edit cities in the platform
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSyncDancers} 
            className="btn btn-secondary gap-2"
            disabled={syncing}
          >
            {syncing ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Syncing...
              </>
            ) : (
              <>
                <FaSync />
                Sync Dancers
              </>
            )}
          </button>
          <button onClick={handleAddCity} className="btn btn-primary gap-2">
            <FaPlus />
            Add City
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>

      {/* Cities Table */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>City</th>
                <th>Country</th>
                <th>Continent</th>
                <th>Population</th>
                <th>Dancers</th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : cities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-base-content/60">
                    No cities found
                  </td>
                </tr>
              ) : (
                cities.map((city) => (
                  <tr key={city._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {city.image && (
                          <div className="avatar">
                            <div className="w-10 h-10 rounded">
                              <img src={city.image} alt={city.name} />
                            </div>
                          </div>
                        )}
                        <span className="font-semibold">{city.name}</span>
                      </div>
                    </td>
                    <td>{city.country.name}</td>
                    <td>{city.continent.name}</td>
                    <td>{city.population?.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-primary">{city.totalDancers}</span>
                    </td>
                    <td className="text-xs">
                      {city.coordinates.lat.toFixed(2)}, {city.coordinates.lng.toFixed(2)}
                    </td>
                    <td>
                      {city.isActive ? (
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
                          onClick={() => handleEditCity(city)}
                          className="btn btn-ghost btn-sm gap-1"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(city)}
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
              {editingCity ? "Edit City" : "Add New City"}
            </h3>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New York"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country *</span>
                  </label>
                  <select
                    value={formData.country?._id}
                    onChange={(e) => {
                      const selected = countries.find((c) => c._id === e.target.value);
                      if (selected) {
                        setFormData({ ...formData, country: selected });
                      }
                    }}
                    className="select select-bordered"
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country._id} value={country._id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
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
                    <span className="label-text">Population *</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8000000"
                    value={formData.population}
                    onChange={(e) =>
                      setFormData({ ...formData, population: parseInt(e.target.value) || 0 })
                    }
                    className="input input-bordered"
                  />
                </div>
              </div>

              {/* Image & Description */}
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

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="City description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="textarea textarea-bordered h-20"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="40.7128"
                    value={formData.coordinates?.lat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates!,
                          lat: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="input input-bordered"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="-74.0060"
                    value={formData.coordinates?.lng}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coordinates: {
                          ...formData.coordinates!,
                          lng: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="input input-bordered"
                  />
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-4">
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
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Rank</span>
                  </label>
                  <input
                    type="number"
                    value={formData.rank}
                    onChange={(e) =>
                      setFormData({ ...formData, rank: parseInt(e.target.value) || 0 })
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && cityToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 text-error">
              Delete City: {cityToDelete.name}
            </h3>
            
            <div className="space-y-4">
              <div className="alert alert-warning">
                <FaTrash />
                <div>
                  <p className="font-semibold">This action cannot be undone!</p>
                  <p className="text-sm">
                    This will permanently delete {cityToDelete.name} and all associated data.
                  </p>
                </div>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="text-sm mb-2">
                  <strong>City Details:</strong>
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Total Dancers: {cityToDelete.totalDancers}</li>
                  <li>• Country: {cityToDelete.country.name}</li>
                  <li>• Continent: {cityToDelete.continent.name}</li>
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
                  setCityToDelete(null);
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
                    <FaTrash /> Delete City
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
                setCityToDelete(null);
                setDeleteConfirmText("");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}


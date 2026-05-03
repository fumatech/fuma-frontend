import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";

const initialForm = {
  name: "",
  location: "",
  contactDetails: "",
  username: "",
  password: "",
  isDefault: false,
};

function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [searchText, setSearchText] = useState("");

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/warehouse/getall`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Unable to fetch warehouses");
      }

      const data = await res.json();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to load warehouses");
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const filteredWarehouses = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return warehouses;

    return warehouses.filter((item) => {
      const searchable = [
        item.name,
        item.location,
        item.contactDetails || item.contact,
        item.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(text);
    });
  }, [searchText, warehouses]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.username || !formData.password) {
      toast.warning("Please fill all required fields");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      contactDetails: formData.contactDetails.trim(),
      username: formData.username.trim(),
      password: formData.password,
      isDefault: warehouses.length === 0 ? true : formData.isDefault,
    };

    setSaving(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/warehouse/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create warehouse");
      }

      toast.success("Warehouse created successfully");
      resetForm();
      fetchWarehouses();
    } catch (error) {
      console.error("Error creating warehouse:", error);
      toast.error("Failed to create warehouse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-wrapper">
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="all-heading mb-0">Warehouse Management</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid pb-3">
          <div className="card border-0 rounded-4 cardHover mb-3">
            <div className="card-header bg-white border-0 pb-0">
              <div style={{ width: "100%", textAlign: "left", margin: 0, padding: 0 }}>
                <h5 className="mb-1" style={{ textAlign: "left", margin: 0 }}>Create Warehouse</h5>
                <small className="text-muted d-block mt-1" style={{ textAlign: "left" }}>
                  If this is your first warehouse, it will be treated as the default warehouse.
                </small>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateWarehouse}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Warehouse Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Pune Warehouse"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Location*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Pune"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Contact Details</label>
                    <input
                      type="text"
                      className="form-control"
                      name="contactDetails"
                      value={formData.contactDetails}
                      onChange={handleInputChange}
                      placeholder="Phone / Email"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Username*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Password*</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isDefaultWarehouse"
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                        disabled={warehouses.length === 0}
                      />
                      <label className="form-check-label" htmlFor="isDefaultWarehouse">
                        Mark as default warehouse
                      </label>
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-center gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                      Clear
                    </button>
                    <button type="submit" className="btn btn-save" disabled={saving}>
                      {saving ? "Saving..." : "Create Warehouse"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card border-0 rounded-4 cardHover">
            <div className="card-header bg-white border-0" style={{ textAlign: "left" }}>
              <div
                className="d-flex flex-column align-items-start justify-content-start gap-2"
                style={{ textAlign: "left", width: "100%" }}
              >
                <h5 className="mb-0">Warehouse List</h5>
                <div className="input-group" style={{ maxWidth: 320 }}>
                  <span className="input-group-text bg-white">
                    <i className="fa fa-search" />
                  </span>
                  <input
                    className="form-control"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search warehouse"
                  />
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>#</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th>Username</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          Loading warehouses...
                        </td>
                      </tr>
                    ) : filteredWarehouses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No warehouses found.
                        </td>
                      </tr>
                    ) : (
                      filteredWarehouses.map((warehouse, index) => (
                        <tr key={warehouse.id || `${warehouse.username}-${index}`}>
                          <td>{index + 1}</td>
                          <td>
                            {warehouse.name}
                            {(warehouse.isDefault || warehouse.defaultWarehouse) && (
                              <span className="badge badge-success ml-2">Default</span>
                            )}
                          </td>
                          <td>{warehouse.location || "-"}</td>
                          <td>{warehouse.contactDetails || warehouse.contact || "-"}</td>
                          <td>{warehouse.username || "-"}</td>
                          <td>
                            {warehouse.isActive === false || warehouse.status === 0 ? (
                              <span className="badge badge-danger">Inactive</span>
                            ) : (
                              <span className="badge badge-primary">Active</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WarehouseManagement;

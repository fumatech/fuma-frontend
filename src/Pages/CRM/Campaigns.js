import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const CRM_DASHBOARD_REFRESH_EVENT = "crm-dashboard-refresh";

const Campaigns = () => {
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const timezoneOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  };

  // Table data state
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [segmentTags, setSegmentTags] = useState([]);
  const [segmentAudience, setSegmentAudience] = useState([]);
  const [isAudienceLoading, setIsAudienceLoading] = useState(false);
  const [segmentForm, setSegmentForm] = useState({
    tag: "",
    objective: "Marketing",
    type: "Email",
  });
  const [formData, setFormData] = useState({
    name: "",
    type: "Email",
    createdBy: userName,
    createdAt: getCurrentLocalDateTime(),
  });

  // Table configuration
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Columns visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    Action: true,
    Name: true,
    Type: true,
    "Created By": true,
    "Created At": true,
  });

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);

      // Call the API to get the username based on the email
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            setUserName(data); // Set the username in state
          }
        })

        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const endpoints = [`${baseUrl}/api/tags`, `${baseUrl}/tags`];
      let lastError;

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint);
          setSegmentTags(response.data || []);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      console.error("Error fetching tags:", lastError);
    };

    fetchTags();
  }, []);

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await axios.get(
          ` ${process.env.REACT_APP_BASE_URL}/campaign/getall`
        );
        setCampaigns(response.data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Open modal for adding new campaign
  const openAddModal = () => {
    setCurrentCampaign(null);
    setFormData({
      name: "",
      type: "Email",
      createdBy: userName,
      createdAt: getCurrentLocalDateTime(),
    });
    setIsModalOpen(true);
  };

  // Open modal for viewing campaign
  const openViewModal = (campaign) => {
    setCurrentCampaign(campaign);
    setIsViewModalOpen(true);
  };

  // Open modal for editing campaign
  const openEditModal = (campaign) => {
    setCurrentCampaign(campaign);
    setFormData({
      name: campaign.name,
      type: campaign.type,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt
        ? formatDateTimeForInput(campaign.createdAt)
        : getCurrentLocalDateTime(),
    });
    setIsModalOpen(true);
  };

  const formatDateTimeForInput = (dateTime) => {
    if (!dateTime) return getCurrentLocalDateTime();
    const parsed = new Date(dateTime);
    if (Number.isNaN(parsed.getTime())) {
      return String(dateTime).slice(0, 16);
    }
    const timezoneOffsetMs = parsed.getTimezoneOffset() * 60000;
    return new Date(parsed.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  };

  const formatDateTimeForDisplay = (dateTime) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  // Close modals
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
  };

  const openSegmentModal = () => {
    setSegmentForm({
      tag: "",
      objective: "Marketing",
      type: "Email",
    });
    setSegmentAudience([]);
    setIsSegmentModalOpen(true);
  };

  const closeSegmentModal = () => {
    setIsSegmentModalOpen(false);
  };

  const fetchSegmentAudience = async (tagName) => {
    if (!tagName) {
      setSegmentAudience([]);
      return;
    }
    setIsAudienceLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/customer/filter`, {
        params: { tag: tagName },
      });
      setSegmentAudience(response.data || []);
    } catch (error) {
      console.error("Error fetching segment audience:", error);
      toast.error("Unable to load audience for selected segment");
      setSegmentAudience([]);
    } finally {
      setIsAudienceLoading(false);
    }
  };

  const handleSegmentInputChange = (e) => {
    const { name, value } = e.target;
    setSegmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "tag") {
      fetchSegmentAudience(value);
    }
  };

  const handleCreateSegmentCampaign = async (e) => {
    e.preventDefault();
    if (!segmentForm.tag) {
      toast.warning("Please select a segment tag");
      return;
    }

    const campaignPayload = {
      name: `${segmentForm.objective} Campaign - ${segmentForm.tag} Segment (${segmentAudience.length})`,
      type: segmentForm.type,
      createdBy: userName,
      createdAt: getCurrentLocalDateTime(),
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/campaign/save`,
        campaignPayload
      );
      setCampaigns((prev) => [...prev, response.data]);
      toast.success("Segment-based campaign created successfully");
      window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      closeSegmentModal();
    } catch (error) {
      console.error("Error creating segment campaign:", error);
      toast.error("Failed to create segment-based campaign");
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (currentCampaign) {
        // Update existing campaign
        const response = await axios.put(
          ` ${process.env.REACT_APP_BASE_URL}/campaign/update/${currentCampaign.id}`,
          formData
        );
        const updatedCampaigns = campaigns.map((campaign) =>
          campaign.id === currentCampaign.id ? response.data : campaign
        );
        setCampaigns(updatedCampaigns);
        window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      } else {
        // Add new campaign
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/campaign/save`,
          formData
        );
        toast.success("Campaign Saved Successfully...");
        setCampaigns([...campaigns, response.data]);
        window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      }
      closeModal();
    } catch (err) {
      //console.error("Error saving campaign:", err);
      toast.error("Error saving campaign. Please try again.");
    }
  };

  // Delete campaign
  const deleteCampaign = async (id) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        await axios.delete(
          ` ${process.env.REACT_APP_BASE_URL}/campaign/delete/${id}`
        );
        setCampaigns(campaigns.filter((campaign) => campaign.id !== id));
        window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      } catch (err) {
        console.error("Error deleting campaign:", err);
        toast.error("Error deleting campaign. Please try again.");
      }
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(campaigns.length / entriesPerPage);
  const filteredCampaigns = campaigns.filter((campaign) =>
    Object.values(campaign).some(
      (val) =>
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const exportCSV = () => {
    const headers = Object.keys(columnsVisibility).filter(
      (col) => columnsVisibility[col]
    );
    const csvContent = [
      headers.join(","),
      ...campaigns.map((campaign) =>
        headers
          .map((header) => {
            const key = header.toLowerCase().replace(/\s+/g, "");
            return `"${campaign[key] || ""}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "campaigns.csv";
    link.click();
  };

  const exportExcel = () => toast.warning("Exporting to Excel...");
  const printData = () => window.print();
  const exportPDF = () => toast.warning("Exporting to PDF...");

  const visibleColumnsCount =
    Object.values(columnsVisibility).filter(Boolean).length;

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  if (isLoading) {
    return <div className="wrapper">Loading...</div>;
  }

  if (error) {
    return <div className="wrapper">Error: {error}</div>;
  }

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <div className="">
        <section className="content-header">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="all-heading m-0">All Campaigns</h1>
              <span className="sub-heading">Manage campaigns</span>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="text-right p-3">
                <button className="btn btn-add" onClick={openAddModal}>
                  <i className="fas fa-plus"></i> Add
                </button>
                <button className="btn btn-outline-primary ml-2" onClick={openSegmentModal}>
                  <i className="fas fa-bullseye"></i> Create From Segment
                </button>
              </div>

              <div className="card-body">
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                      Show
                    </label>
                    <select
                      id="entriesPerPage"
                      className="form-control form-control-sm mr-2"
                      value={entriesPerPage}
                      onChange={handleEntriesChange}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                    Entries
                  </div>

                  <div className="col d-flex flex-wrap align-items-center">
                    <button
                      onClick={exportCSV}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-csv"></i> Export CSV
                    </button>
                    <button
                      onClick={exportExcel}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-excel"></i> Export Excel
                    </button>
                    <button
                      onClick={printData}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-print"></i> Print
                    </button>
                    <button
                      onClick={exportPDF}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-pdf"></i> Export PDF
                    </button>
                    <div className="dropdown mt-lg-2 mb-lg-2">
                      <button
                        className="btn Export-Btn dropdown-toggle"
                        type="button"
                        id="dropdownMenuButton"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="fa fa-columns"></i> Column Visibility
                      </button>
                      <div
                        className="dropdown-menu"
                        aria-labelledby="dropdownMenuButton"
                      >
                        {Object.keys(columnsVisibility).map((col) => (
                          <div
                            key={col}
                            className="dropdown-item d-flex align-items-center"
                          >
                            <input
                              type="checkbox"
                              checked={columnsVisibility[col]}
                              onChange={() => toggleColumn(col)}
                              className="mr-2"
                            />
                            <span
                              className="btn border-0 bg-transparent p-0 m-0"
                              onClick={(e) => handleDropdownItemClick(col, e)}
                            >
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        {columnsVisibility.Action && <th>Action</th>}
                        {columnsVisibility.Name && <th>Name</th>}
                        {columnsVisibility.Type && <th>Type</th>}
                        {columnsVisibility["Created By"] && <th>Created By</th>}
                        {columnsVisibility["Created At"] && <th>Created At</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCampaigns.length > 0 ? (
                        paginatedCampaigns.map((campaign) => (
                          <tr key={campaign.id}>
                            {columnsVisibility.Action && (
                              <td>
                                <DropdownButton
                                  id="dropdown-basic-button"
                                  title="Actions"
                                  variant="outline-success rounded-5 fs-6 fw-light border-1"
                                  className="custom-outline-dropdown p-2"
                                >
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => openViewModal(campaign)}
                                  >
                                    <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                      <i className="dropdown_hover fa fa-eye me-3"></i>
                                      <span>View</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => openEditModal(campaign)}
                                  >
                                    <div className="d-inline-block w-100 btn-edit justify-content-center text-secondary">
                                      <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                      <span>Edit</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => deleteCampaign(campaign.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-delete justify-content-center text-secondary">
                                      <i className="fa fa-trash me-3"></i>
                                      <span>Delete</span>
                                    </div>
                                  </Dropdown.Item>
                                </DropdownButton>
                              </td>
                            )}
                            {columnsVisibility.Name && <td>{campaign.name}</td>}
                            {columnsVisibility.Type && <td>{campaign.type}</td>}
                            {columnsVisibility["Created By"] && (
                              <td>{campaign.createdBy}</td>
                            )}
                            {columnsVisibility["Created At"] && (
                              <td>
                                {campaign.createdAt
                                  ? new Date(
                                      campaign.createdAt
                                    ).toLocaleDateString()
                                  : ""}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={visibleColumnsCount}
                            className="text-center"
                          >
                            No data available in table
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="dataTables_info">
                      Showing {paginatedCampaigns.length > 0 ? 1 : 0} to{" "}
                      {paginatedCampaigns.length} of {campaigns.length} entries
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="dataTables_paginate paging_simple_numbers float-right">
                      <ul className="pagination">
                        <li
                          className={`paginate_button page-item previous ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        <li className="paginate_button page-item active">
                          <button className="page-link">{currentPage}</button>
                        </li>
                        <li
                          className={`paginate_button page-item next ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal for Add/Edit Campaign */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentCampaign ? "Edit Campaign" : "Add New Campaign"}
                  </h5>
                  <button type="button" className="close" onClick={closeModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name">Campaign Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="type">Campaign Type</label>
                      <select
                        className="form-control"
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                      >
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Direct Mail">Direct Mail</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="createdBy">Created By</label>
                      <input
                        type="text"
                        className="form-control"
                        id="createdBy"
                        name="createdBy"
                        readOnly
                        value={formData.createdBy}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="createdAt">Created At</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="createdAt"
                        name="createdAt"
                        value={formData.createdAt}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeModal}
                      >
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {currentCampaign ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Viewing Campaign */}
      {isViewModalOpen && currentCampaign && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Campaign Details</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeViewModal}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Campaign Name</label>
                    <p className="form-control-static">
                      {currentCampaign.name}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Campaign Type</label>
                    <p className="form-control-static">
                      {currentCampaign.type}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Created By</label>
                    <p className="form-control-static">
                      {currentCampaign.createdBy}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Created At</label>
                    <p className="form-control-static">
                      {currentCampaign.createdAt
                        ? formatDateTimeForDisplay(currentCampaign.createdAt)
                        : ""}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeViewModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSegmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Focused Campaign From Segment</h5>
                  <button type="button" className="close" onClick={closeSegmentModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleCreateSegmentCampaign}>
                    <div className="form-group">
                      <label htmlFor="tag">Segment Tag</label>
                      <select
                        className="form-control"
                        id="tag"
                        name="tag"
                        value={segmentForm.tag}
                        onChange={handleSegmentInputChange}
                        required
                      >
                        <option value="">Select Tag</option>
                        {segmentTags.map((tag) => (
                          <option key={tag.id} value={tag.name}>
                            {tag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="objective">Objective</label>
                      <select
                        className="form-control"
                        id="objective"
                        name="objective"
                        value={segmentForm.objective}
                        onChange={handleSegmentInputChange}
                      >
                        <option value="Marketing">Marketing</option>
                        <option value="Support">Support</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="type">Campaign Type</label>
                      <select
                        className="form-control"
                        id="type"
                        name="type"
                        value={segmentForm.type}
                        onChange={handleSegmentInputChange}
                      >
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Direct Mail">Direct Mail</option>
                      </select>
                    </div>
                    <div className="alert alert-light border">
                      <strong>Audience Size:</strong>{" "}
                      {isAudienceLoading ? "Loading..." : segmentAudience.length}
                      {segmentAudience.length > 0 && (
                        <div className="small text-muted mt-2">
                          Example:{" "}
                          {segmentAudience
                            .slice(0, 3)
                            .map((c) => c.franchiseName || `${c.firstname || ""} ${c.lastname || ""}`.trim())
                            .join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeSegmentModal}>
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Create Campaign
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;

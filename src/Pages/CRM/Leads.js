import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import interactionService from "../../utils/interactionService";

const CRM_DASHBOARD_REFRESH_EVENT = "crm-dashboard-refresh";

const Leads = () => {
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const timezoneOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  };

  // Table data state
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [interactionFormData, setInteractionFormData] = useState({
    interactionType: "CALL",
    notes: "",
    outcome: "INTERESTED",
    interactionDate: new Date().toISOString().slice(0, 16)
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    source: "Facebook",
    lifeStage: "New",
    employeeid: "",
    mobileNumber: "",
    taxNumber: "",
    addedOn: getCurrentLocalDateTime(),
    customField1: "",
    customField2: "",
    customField3: "",
    company: "",
    phone: "",
    stage: "NEW",
    priority: "MEDIUM",
  });

  // Table configuration
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Columns visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    Action: true,
    Name: true,
    Email: true,
    Source: true,
    "Life Stage": true,
    "Assigned to": true,
    Mobile: true,
    "Tax number": true,
    "Added On": true,
    "Custom Field 1": true,
    "Custom Field 2": true,
    "Custom Field 3": true,
  });

  // Fetch leads and users from API
  const fetchAllData = async () => {
    try {
      const [leadsResponse, usersResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
      ]);
      setLeads(leadsResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Open modal for adding new lead
  const openAddModal = () => {
    setCurrentLead(null);
    setFormData({
      name: "",
      email: "",
      source: "Facebook",
      lifeStage: "New",
      employeeid: "",
      mobileNumber: "",
      taxNumber: "",
      addedOn: getCurrentLocalDateTime(),
      customField1: "",
      customField2: "",
      customField3: "",
      company: "",
      phone: "",
      stage: "NEW",
      priority: "MEDIUM",
    });
    setIsModalOpen(true);
  };

  // Open modal for viewing lead
  const openViewModal = (lead) => {
    setCurrentLead(lead);
    setIsViewModalOpen(true);
  };

  // Open modal for editing lead
  const openEditModal = (lead) => {
    setCurrentLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      source: lead.source,
      lifeStage: lead.lifeStage,
      employeeid: lead.employeeid,
      mobileNumber: lead.mobileNumber,
      taxNumber: lead.taxNumber,
      addedOn: lead.addedOn
        ? formatDateTimeForInput(lead.addedOn)
        : getCurrentLocalDateTime(),
      customField1: lead.customField1,
      customField2: lead.customField2,
      customField3: lead.customField3,
      company: lead.company || "",
      phone: lead.phone || "",
      stage: lead.stage || "NEW",
      priority: lead.priority || "MEDIUM",
    });
    setIsModalOpen(true);
  };

  const formatDateTimeForInput = (backendDateTime) => {
    if (!backendDateTime) return getCurrentLocalDateTime();
    const parsed = new Date(backendDateTime);
    if (Number.isNaN(parsed.getTime())) {
      return String(backendDateTime).slice(0, 16);
    }
    const timezoneOffsetMs = parsed.getTimezoneOffset() * 60000;
    return new Date(parsed.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  };

  const formatDateTimeForDisplay = (backendDateTime) => {
    if (!backendDateTime) return "";
    const date = new Date(backendDateTime);
    return date.toLocaleString();
  };

  // Close modals
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
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
      if (currentLead) {
        const response = await axios.put(
          `${process.env.REACT_APP_BASE_URL}/lead/update/${currentLead.id}`,
          formData
        );
        setLeads(leads.map((lead) => lead.id === currentLead.id ? response.data : lead));
        window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/lead/save`,
          formData
        );
        toast.success("Lead Saved Successfully...");
        setLeads([...leads, response.data]);
        window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      }
      closeModal();
    } catch (err) {
      toast.error("Error saving lead. Please try again.");
    }
  };

  // Delete lead
  const deleteLead = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BASE_URL}/lead/delete/${id}`);
        toast.success("Lead Deleted Successfully...");
        setLeads(leads.filter((lead) => lead.id !== id));
        window.dispatchEvent(new Event(CRM_DASHBOARD_REFRESH_EVENT));
      } catch (err) {
        toast.error("Error deleting lead. Please try again.");
      }
    }
  };

  // Interaction Handlers
  const openInteractionModal = (lead) => {
    setCurrentLead(lead);
    setInteractionFormData({
      interactionType: "CALL",
      notes: "",
      outcome: "INTERESTED",
      interactionDate: new Date().toISOString().slice(0, 16)
    });
    setShowInteractionModal(true);
  };

  const handleSaveInteraction = async () => {
    if (!interactionFormData.notes) {
      toast.error("Please add interaction notes");
      return;
    }
    try {
      const loggedInEmail = sessionStorage.getItem("employeeEmail");
      const loggedInUser = users.find(u => u.email === loggedInEmail);
      if (!loggedInUser) {
        toast.error("User session not found. Please re-login.");
        return;
      }
      const payload = {
        leadId: currentLead.id,
        salespersonId: loggedInUser.id,
        ...interactionFormData
      };
      await interactionService.saveInteraction(payload);
      toast.success("Interaction logged successfully");
      setShowInteractionModal(false);
      openTimeline(currentLead);
    } catch (err) {
      toast.error("Failed to save interaction");
    }
  };

  const openTimeline = async (lead) => {
    setCurrentLead(lead);
    setActivities([]);
    setInteractions([]);
    setShowTimelineModal(true);
    try {
      const [actRes, intRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead-activity/lead/${lead.id}`),
        interactionService.getInteractionsByLeadId(lead.id)
      ]);
      setActivities(actRes.data);
      setInteractions(intRes);
    } catch (err) {
      toast.error("Failed to load timeline");
    }
  };

  // Calculate pagination
  const filteredLeads = leads.filter((lead) =>
    Object.values(lead).some((val) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / entriesPerPage));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const exportCSV = () => {
    // simplified CSV export
    toast.info("Exporting CSV...");
  };

  const printData = () => window.print();

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  const getUserNameById = (id) => {
    const user = users.find((user) => user.id === id);
    return user ? `${user.firstname} ${user.lastname}` : "Not assigned";
  };

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <section className="content-header">
        <div className="row mb-2">
          <div className="col-sm-6">
            <h1 className="all-heading m-0 text-dark">All Leads</h1>
            <span className="sub-heading text-secondary">Manage leads and interactions</span>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          <div className="card shadow-sm rounded-4 border-0">
            <div className="text-right p-3">
              <button className="btn btn-primary" onClick={openAddModal}>
                <i className="fas fa-plus me-2"></i> Add Lead
              </button>
            </div>

            <div className="card-body">
              <div className="row mb-3 d-flex align-items-center">
                <div className="col-md-4 d-flex align-items-center gap-2">
                  <span className="small text-muted text-uppercase fw-bold">Show</span>
                  <select className="form-select form-select-sm w-auto" value={entriesPerPage} onChange={handleEntriesChange}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="col-md-8 d-flex justify-content-end gap-2">
                  <input type="text" className="form-control form-control-sm w-25" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <button onClick={printData} className="btn btn-sm btn-outline-secondary"><i className="fa fa-print"></i></button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover border-light">
                  <thead className="table-light">
                    <tr>
                      {columnsVisibility.Action && <th>Action</th>}
                      {columnsVisibility.Name && <th>Name</th>}
                      {columnsVisibility.Email && <th>Email</th>}
                      {columnsVisibility.Source && <th>Source</th>}
                      {columnsVisibility["Life Stage"] && <th>Life Stage</th>}
                      {columnsVisibility["Assigned to"] && <th>Assigned to</th>}
                      {columnsVisibility.Mobile && <th>Mobile</th>}
                      {columnsVisibility["Added On"] && <th>Added On</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.length > 0 ? (
                      paginatedLeads.map((lead) => (
                        <tr key={lead.id}>
                          {columnsVisibility.Action && (
                            <td>
                              <DropdownButton
                                id={`actions-${lead.id}`}
                                title="Actions"
                                variant="outline-primary"
                                size="sm"
                              >
                                <Dropdown.Item onClick={() => openViewModal(lead)}><i className="fa fa-eye me-2"></i> View</Dropdown.Item>
                                <Dropdown.Item onClick={() => openEditModal(lead)}><i className="fa-solid fa-pen-to-square me-2"></i> Edit</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => openInteractionModal(lead)} className="text-primary"><i className="fa fa-comments me-2"></i> Log Call</Dropdown.Item>
                                <Dropdown.Item onClick={() => openTimeline(lead)} className="text-info"><i className="fa fa-history me-2"></i> History</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => deleteLead(lead.id)} className="text-danger"><i className="fa fa-trash me-2"></i> Delete</Dropdown.Item>
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.Name && <td className="fw-bold">{lead.name}</td>}
                          {columnsVisibility.Email && <td>{lead.email}</td>}
                          {columnsVisibility.Source && <td><span className="badge bg-light text-dark border">{lead.source}</span></td>}
                          {columnsVisibility["Life Stage"] && <td>{lead.lifeStage}</td>}
                          {columnsVisibility["Assigned to"] && <td>{getUserNameById(lead.employeeid)}</td>}
                          {columnsVisibility.Mobile && <td>{lead.mobileNumber}</td>}
                          {columnsVisibility["Added On"] && <td>{lead.addedOn ? lead.addedOn.split("T")[0] : ""}</td>}
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" className="text-center text-muted">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title font-weight-bold">{currentLead ? "Edit Lead" : "Add New Lead"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-uppercase">Name</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-uppercase">Email</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-uppercase">Source</label>
                      <select className="form-select" name="source" value={formData.source} onChange={handleInputChange}>
                        <option value="Facebook">Facebook</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Email">Email</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-uppercase">Life Stage</label>
                      <select className="form-select" name="lifeStage" value={formData.lifeStage} onChange={handleInputChange}>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Prospect">Prospect</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Customer">Customer</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer border-0 p-0 mt-4">
                    <button type="button" className="btn btn-light px-4" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-4 shadow-sm">{currentLead ? "Update Lead" : "Save Lead"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Logging Modal */}
      {showInteractionModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title font-weight-bold text-white"><i className="fas fa-comments me-2"></i> Log Interaction - {currentLead?.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowInteractionModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase">Interaction Type</label>
                    <select className="form-select" value={interactionFormData.interactionType} onChange={(e) => setInteractionFormData({ ...interactionFormData, interactionType: e.target.value })}>
                      <option value="CALL">Call</option>
                      <option value="EMAIL">Email</option>
                      <option value="MESSAGE">Message</option>
                      <option value="MEETING">Meeting</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase">Outcome</label>
                    <select className="form-select" value={interactionFormData.outcome} onChange={(e) => setInteractionFormData({ ...interactionFormData, outcome: e.target.value })}>
                      <option value="INTERESTED">Interested</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                      <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                      <option value="DOUBTFUL">Doubtful</option>
                    </select>
                  </div>
                  <div className="col-12 mt-3">
                    <label className="form-label fw-bold small text-uppercase">Date & Time</label>
                    <input type="datetime-local" className="form-control" value={interactionFormData.interactionDate} onChange={(e) => setInteractionFormData({ ...interactionFormData, interactionDate: e.target.value })} />
                  </div>
                  <div className="col-12 mt-3">
                    <label className="form-label fw-bold small text-uppercase">Conversation Details / Notes</label>
                    <textarea className="form-control" rows="4" value={interactionFormData.notes} onChange={(e) => setInteractionFormData({ ...interactionFormData, notes: e.target.value })} placeholder="Detailed summary of the conversation..."></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-3 pt-0">
                <button type="button" className="btn btn-light px-4" onClick={() => setShowInteractionModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary px-4 shadow-sm" onClick={handleSaveInteraction}>Save Interaction</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimelineModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-header bg-dark text-white rounded-top-4">
                <h5 className="modal-title font-weight-bold"><i className="fas fa-history me-2"></i> Activity Timeline - {currentLead?.name}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTimelineModal(false)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {(activities.length === 0 && interactions.length === 0) ? (
                  <div className="text-center text-muted my-4">No activities or interactions logged yet.</div>
                ) : (
                  <div className="timeline-wrapper d-flex flex-column gap-4">
                    {interactions.length > 0 && (
                      <div className="interaction-section">
                        <h6 className="mb-3 text-primary border-bottom pb-2 font-weight-bold">Conversation History</h6>
                        <div className="timeline-container ps-3 border-start border-3 border-success ms-3 position-relative">
                          {interactions.map(act => (
                            <div key={act.id} className="position-relative mb-4 ms-2">
                              <span className="position-absolute border border-3 border-white rounded-circle bg-success" style={{ width: '16px', height: '16px', left: '-25px', top: '4px' }}></span>
                              <div className="d-flex justify-content-between">
                                <strong className="text-dark bg-light px-2 py-1 rounded small">
                                  {new Date(act.interactionDate).toLocaleDateString()} {new Date(act.interactionDate).toLocaleTimeString([], { timeStyle: 'short' })}
                                </strong>
                                <span className="badge bg-info text-white">{act.interactionType}</span>
                              </div>
                              <div className="mt-2 fw-bold text-success">{(act.outcome || 'N/A').replace(/_/g, ' ')}</div>
                              <div className="text-muted mt-1 bg-light p-2 rounded small">{act.notes}</div>
                              <div className="small text-secondary mt-1"><i className="fas fa-user-edit me-1"></i> {getUserNameById(act.salespersonId)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activities.length > 0 && (
                      <div className="activity-section">
                        <h6 className="mb-3 text-secondary border-bottom pb-2 font-weight-bold">System Events</h6>
                        <div className="timeline-container ps-3 border-start border-3 border-secondary ms-3 position-relative">
                          {activities.map(act => (
                            <div key={act.id} className="position-relative mb-4 ms-2">
                              <span className="position-absolute border border-3 border-white rounded-circle bg-secondary" style={{ width: '16px', height: '16px', left: '-25px', top: '4px' }}></span>
                              <div><strong className="text-dark bg-light px-2 py-1 rounded small">{new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], { timeStyle: 'short' })}</strong></div>
                              <div className="mt-2 fw-bold text-secondary">{(act.activityType || 'EVENT').replace(/_/g, ' ')}</div>
                              <div className="text-muted mt-1 small">{act.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowTimelineModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;

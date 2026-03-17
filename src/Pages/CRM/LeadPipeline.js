import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import interactionService from "../../utils/interactionService";
import "./LeadPipeline.css";

const fallbackStages = [
  { name: "NEW", label: "New Lead", color: "#4361ee" },
  { name: "CONTACTED", label: "Contacted", color: "#7209b7" },
  { name: "IN_DISCUSSION", label: "In Discussion", color: "#fb8500" },
  { name: "CONVERTED", label: "Converted", color: "#06d6a0" },
  { name: "LOST", label: "Lost", color: "#e63946" },
];

const LeadPipeline = ({ isEmployeeView = false }) => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState(isEmployeeView ? "my" : "all"); // 'all' | 'my'
  const dragItem = useRef(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // CRM Modals State
  const [selectedLead, setSelectedLead] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionFormData, setInteractionFormData] = useState({
    interactionType: "CALL",
    notes: "",
    outcome: "INTERESTED",
    interactionDate: new Date().toISOString().slice(0, 16)
  });
  const [editFormData, setEditFormData] = useState({ dealValue: "", nextAction: "", followUpDate: "" });
  const [newStageData, setNewStageData] = useState({ name: "", label: "", color: "#4361ee" });

  // Fetch leads, users, and analytics
  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [leadsRes, usersRes, analyticsRes, stagesRes] = await Promise.allSettled([
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead/analytics`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead-stage/getall`)
      ]);

      if (stagesRes.status === "fulfilled" && stagesRes.value.data.length > 0) {
        setStages(stagesRes.value.data);
      } else {
        setStages(fallbackStages);
      }

      if (leadsRes.status === "fulfilled") {
        const leadsData = leadsRes.value.data || [];
        // Ensure every lead has a stage
        setLeads(
          leadsData.map((lead) => ({
            ...lead,
            stage: lead.stage || "NEW",
            priority: lead.priority || "MEDIUM",
          }))
        );
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data || []);
      }
      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data);
      }
    } catch (err) {
      toast.error("Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Look up user name by employee ID
  const getUserName = (employeeid) => {
    if (!employeeid) return "Unassigned";
    const user = users.find((u) => u.id === employeeid);
    return user ? `${user.firstname} ${user.lastname}` : "Unassigned";
  };

  const getUserInitials = (employeeid) => {
    if (!employeeid) return "?";
    const user = users.find((u) => u.id === employeeid);
    if (!user) return "?";
    const f = (user.firstname || "").charAt(0).toUpperCase();
    const l = (user.lastname || "").charAt(0).toUpperCase();
    return `${f}${l}` || "?";
  };

  // ------- Drag and Drop -------
  const handleDragStart = (e, lead) => {
    dragItem.current = lead;
    e.dataTransfer.effectAllowed = "move";
    // Add class after a tick so the card doesn't disappear instantly
    setTimeout(() => {
      const el = document.getElementById(`lead-card-${lead.id}`);
      if (el) el.classList.add("dragging");
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragItem.current) {
      const el = document.getElementById(`lead-card-${dragItem.current.id}`);
      if (el) el.classList.remove("dragging");
    }
    dragItem.current = null;
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageKey);
  };

  const handleDragLeave = (e, stageKey) => {
    // Only clear if actually leaving the column
    if (dragOverStage === stageKey) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOverStage(null);

    const lead = dragItem.current;
    if (!lead || lead.stage === newStage) return;

    const previousStage = lead.stage;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, stage: newStage } : l))
    );

    try {
      await axios.put(
        `${process.env.REACT_APP_BASE_URL}/lead/update-stage/${lead.id}`,
        { stage: newStage }
      );

      const stageLabel =
        stages.find((s) => s.name === newStage)?.label || newStage;
      toast.success(`"${lead.name}" moved to ${stageLabel}`);

      // Refresh analytics
      try {
        const analyticsRes = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/lead/analytics`
        );
        setAnalytics(analyticsRes.data);
      } catch (_) {
        /* analytics refresh failure is non-critical */
      }
    } catch (err) {
      // Revert on failure
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, stage: previousStage } : l
        )
      );
      toast.error("Failed to update lead stage. Please try again.");
    }
  };

  // ------- Filtering -------
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchTerm ||
      [lead.name, lead.company, lead.email, lead.phone, getUserName(lead.employeeid)]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (isEmployeeView || filterMode === "my") {
      const loggedInEmail = sessionStorage.getItem("employeeEmail");
      if (loggedInEmail) {
        const loggedInUser = users.find(u => u.email === loggedInEmail);
        if (loggedInUser) {
          matchesFilter = lead.employeeid === loggedInUser.id;
        }
      }
    }

    return matchesSearch && matchesFilter;
  });

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setEditFormData({
      dealValue: lead.dealValue || "",
      nextAction: lead.nextAction || "",
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 16) : "",
      followUpNote: lead.followUpNote || "",
      followUpStatus: lead.followUpStatus || "PENDING"
    });
    setShowEditModal(true);
  };

  const handleSaveCRMData = async () => {
    try {
      const payload = {
        ...selectedLead,
        dealValue: editFormData.dealValue === "" ? null : Number(editFormData.dealValue),
        nextAction: editFormData.nextAction,
        followUpDate: editFormData.followUpDate || null,
        followUpNote: editFormData.followUpNote,
        followUpStatus: editFormData.followUpStatus
      };
      await axios.put(`${process.env.REACT_APP_BASE_URL}/lead/update/${selectedLead.id}`, payload);
      toast.success("Lead details updated!");
      setShowEditModal(false);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to update lead");
    }
  };

  const viewTimeline = async (lead) => {
    setSelectedLead(lead);
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

  const openInteractionModal = (lead) => {
    setSelectedLead(lead);
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
        leadId: selectedLead.id,
        salespersonId: loggedInUser.id,
        ...interactionFormData
      };

      await interactionService.saveInteraction(payload);
      toast.success("Interaction logged successfully");
      setShowInteractionModal(false);
      viewTimeline(selectedLead); // Refresh timeline if it was open
    } catch (err) {
      toast.error("Failed to save interaction");
    }
  };

  const todayFollowUps = filteredLeads.filter(l => {
    if (!l.followUpDate || l.followUpStatus !== 'PENDING') return false;
    const d = new Date(l.followUpDate);
    const today = new Date();
    return d <= new Date(today.setHours(23, 59, 59, 999)); // Today or Overdue
  }).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  const upcomingMeetings = filteredLeads.filter(l => {
    if (!l.followUpDate || l.followUpStatus !== 'PENDING') return false;
    const d = new Date(l.followUpDate);
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
    return d > endOfToday;
  }).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  const handleAddStage = async () => {
    if (!newStageData.name || !newStageData.label) {
      toast.error("Please fill name and label");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_BASE_URL}/lead-stage/create`, {
        ...newStageData,
        orderIndex: stages.length + 1
      });
      toast.success("New stage added!");
      setShowAddStageModal(false);
      setNewStageData({ name: "", label: "", color: "#4361ee" });
      fetchData(false);
    } catch (err) {
      toast.error("Failed to add stage");
    }
  };

  const displayAnalytics = isEmployeeView ? {
    totalLeads: filteredLeads.length,
    convertedLeads: filteredLeads.filter((l) => l.stage === "CONVERTED").length,
    lostLeads: filteredLeads.filter((l) => l.stage === "LOST").length,
    conversionRate: filteredLeads.length > 0
      ? Math.round(
        (filteredLeads.filter((l) => l.stage === "CONVERTED").length /
          filteredLeads.length) *
        100
      )
      : 0,
    totalDealValue: filteredLeads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
  } : {
    ...analytics,
    totalDealValue: filteredLeads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)
  };

  const getLeadsByStage = (stageKey) =>
    filteredLeads.filter((lead) => lead.stage === stageKey);

  // ------- Rendering -------
  if (loading) {
    return (
      <div className="pipeline-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-pipeline-wrapper">
      {/* ===== Analytics Cards ===== */}
      <div className="pipeline-analytics">
        <div className="analytics-card total">
          <div className="analytics-label">Total Leads</div>
          <div className="analytics-value">{displayAnalytics.totalLeads}</div>
          <i className="fas fa-users analytics-icon"></i>
        </div>
        <div className="analytics-card converted">
          <div className="analytics-label">Converted</div>
          <div className="analytics-value">{displayAnalytics.convertedLeads}</div>
          <i className="fas fa-check-circle analytics-icon"></i>
        </div>
        <div className="analytics-card lost">
          <div className="analytics-label">Lost</div>
          <div className="analytics-value">{displayAnalytics.lostLeads}</div>
          <i className="fas fa-times-circle analytics-icon"></i>
        </div>
        <div className="analytics-card rate">
          <div className="analytics-label">Conversion Rate</div>
          <div className="analytics-value">{displayAnalytics.conversionRate}%</div>
          <i className="fas fa-chart-line analytics-icon"></i>
        </div>
        <div className="analytics-card value">
          <div className="analytics-label">Total Deal Value</div>
          <div className="analytics-value">₹{(displayAnalytics.totalDealValue || 0).toLocaleString()}</div>
          <i className="fas fa-rupee-sign analytics-icon"></i>
        </div>
      </div>

      {isEmployeeView && (
        <div className="row mx-0 mb-4 mt-3 flex-nowrap flex-md-wrap overflow-auto">
          <div className="col-lg-4 col-md-6 mb-3 px-2">
            <div className="card shadow-sm h-100 border-0 rounded-4">
              <div className="card-header bg-white border-0 pt-3 pb-0"><strong>My Performance This Month</strong></div>
              <div className="card-body">
                <p className="mb-1 text-muted">Leads Assigned: <strong className="text-dark">{filteredLeads.length}</strong></p>
                <p className="mb-1 text-muted">Converted: <strong className="text-success">{displayAnalytics.convertedLeads}</strong></p>
                <p className="mb-1 text-muted">Lost: <strong className="text-danger">{displayAnalytics.lostLeads}</strong></p>
                <p className="mb-0 text-muted">Conversion Rate: <strong className="text-primary">{displayAnalytics.conversionRate}%</strong></p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 mb-3 px-2">
            <div className="card shadow-sm h-100 border-0 rounded-4">
              <div className="card-header bg-white border-0 pt-3 pb-0 text-warning"><strong><i className="fas fa-clock"></i> Today's Follow Ups</strong></div>
              <div className="card-body p-0 mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <ul className="list-group list-group-flush">
                  {todayFollowUps.length === 0 ? <li className="list-group-item text-muted border-0">No follow-ups schedule for today.</li> :
                    todayFollowUps.map(l => (
                      <li key={l.id} className="list-group-item py-2 px-3 border-light">
                        <div className="d-flex justify-content-between">
                          <strong className="text-dark">{l.name}</strong> <small className="text-primary">{new Date(l.followUpDate).toLocaleTimeString([], { timeStyle: 'short' })}</small>
                        </div>
                        <small className="text-muted">{l.nextAction || 'Follow up'}</small>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 mb-3 px-2">
            <div className="card shadow-sm h-100 border-0 rounded-4">
              <div className="card-header bg-white border-0 pt-3 pb-0 text-primary"><strong><i className="fas fa-calendar-alt"></i> Upcoming Meetings</strong></div>
              <div className="card-body p-0 mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <ul className="list-group list-group-flush">
                  {upcomingMeetings.length === 0 ? <li className="list-group-item text-muted border-0">No upcoming meetings.</li> :
                    upcomingMeetings.slice(0, 5).map(l => (
                      <li key={l.id} className="list-group-item py-2 px-3 border-light">
                        <div className="d-flex justify-content-between">
                          <strong className="text-dark">{l.name}</strong> <small className="text-info">{new Date(l.followUpDate).toLocaleDateString()} {new Date(l.followUpDate).toLocaleTimeString([], { timeStyle: 'short' })}</small>
                        </div>
                        <small className="text-muted">{l.company}</small>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toolbar ===== */}
      <div className="pipeline-toolbar">
        <input
          type="text"
          className="pipeline-search"
          placeholder="Search leads by name, company, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {!isEmployeeView && (
          <>
            <button
              className="pipeline-filter-btn btn-primary text-white"
              onClick={() => setShowAddStageModal(true)}
              style={{ backgroundColor: '#4361ee' }}
            >
              <i className="fas fa-plus-circle me-1"></i> Add Stage
            </button>
          </>
        )}
        <button
          className="pipeline-filter-btn"
          onClick={() => fetchData(false)}
          title="Refresh pipeline"
        >
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      {/* ===== Kanban Board ===== */}
      <div className="pipeline-board">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.name);
          return (
            <div
              key={stage.name}
              className={`pipeline-column ${dragOverStage === stage.name ? "drag-over" : ""}`}
              data-stage={stage.name}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragLeave={(e) => handleDragLeave(e, stage.name)}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              <div className="pipeline-column-header" style={{ borderBottomColor: stage.color || '#ccc' }}>
                <span className="col-title">
                  <i className="fas fa-circle me-2" style={{ fontSize: '0.6rem', color: stage.color || '#ccc' }}></i>
                  {stage.label}
                </span>
                <span className="col-count">{stageLeads.length}</span>
              </div>

              <div className="pipeline-column-body">
                {stageLeads.length === 0 ? (
                  <div className="pipeline-empty">
                    <i className="fas fa-inbox"></i>
                    No leads
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      id={`lead-card-${lead.id}`}
                      className="lead-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="lead-name">
                        {lead.name || "Unnamed Lead"}
                        <span
                          className={`priority-badge ${(lead.priority || "medium").toLowerCase()}`}
                        >
                          {lead.priority || "MEDIUM"}
                        </span>
                      </div>

                      {lead.company && (
                        <div className="lead-company">
                          <i className="fas fa-building me-1"></i>
                          {lead.company}
                        </div>
                      )}

                      {(lead.email || lead.mobileNumber || lead.phone) && (
                        <>
                          {lead.email && (
                            <div className="lead-contact-row" title={lead.email}>
                              <i className="fas fa-envelope"></i>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: 'calc(100% - 20px)' }}>{lead.email}</span>
                            </div>
                          )}
                          {(lead.phone || lead.mobileNumber) && (
                            <div className="lead-contact-row" title={lead.phone || lead.mobileNumber}>
                              <i className="fas fa-phone"></i>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: 'calc(100% - 20px)' }}>{lead.phone || lead.mobileNumber}</span>
                            </div>
                          )}
                        </>
                      )}

                      {(lead.dealValue || lead.nextAction || lead.followUpDate) && (
                        <div className={`lead-crm-details mt-2 p-2 rounded ${lead.followUpStatus === 'PENDING' && lead.followUpDate && new Date(lead.followUpDate) < new Date() ? 'border-danger bg-danger-subtle' : ''
                          }`} style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid #eee' }}>
                          {lead.dealValue && <div><strong className="text-secondary">Value:</strong> ₹{Number(lead.dealValue).toLocaleString()}</div>}
                          {lead.nextAction && <div><strong className="text-secondary">Next:</strong> {lead.nextAction}</div>}
                          {lead.followUpDate && (
                            <div className="mt-1">
                              <strong className="text-secondary">Follow Up:</strong> {new Date(lead.followUpDate).toLocaleDateString()} {new Date(lead.followUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {lead.followUpStatus === 'PENDING' && new Date(lead.followUpDate) < new Date() && <span className="badge bg-danger ms-1" style={{ fontSize: '0.6rem' }}>OVERDUE</span>}
                              {lead.followUpStatus === 'PENDING' && new Date(lead.followUpDate).toDateString() === new Date().toDateString() && <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.6rem' }}>TODAY</span>}
                            </div>
                          )}
                          {lead.followUpNote && <div className="text-muted small mt-1 italic">"{lead.followUpNote}"</div>}
                        </div>
                      )}

                      <div className="lead-actions mt-2 mb-2 d-flex flex-wrap gap-1">
                        <button className="btn btn-sm btn-outline-info flex-grow-1" style={{ fontSize: '0.75rem', padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); openEditModal(lead); }}><i className="fas fa-edit"></i> Edit CRM</button>
                        <button className="btn btn-sm btn-outline-primary flex-grow-1" style={{ fontSize: '0.75rem', padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); openInteractionModal(lead); }}><i className="fas fa-comments"></i> Log Call</button>
                        <button className="btn btn-sm btn-outline-secondary flex-grow-1" style={{ fontSize: '0.75rem', padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); viewTimeline(lead); }}><i className="fas fa-history"></i> History</button>
                      </div>

                      <div className="lead-footer">
                        <div className="lead-assignee">
                          <span className="assignee-avatar">
                            {getUserInitials(lead.employeeid)}
                          </span>
                          {getUserName(lead.employeeid)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit CRM Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit CRM Info - {selectedLead?.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Deal Value (₹)</label>
                  <input type="number" className="form-control" value={editFormData.dealValue} onChange={(e) => setEditFormData({ ...editFormData, dealValue: e.target.value })} placeholder="e.g. 150000" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Next Action</label>
                  <input type="text" className="form-control" value={editFormData.nextAction} onChange={(e) => setEditFormData({ ...editFormData, nextAction: e.target.value })} placeholder="e.g. Call Customer, Schedule Demo" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Follow-Up Date & Time</label>
                  <input type="datetime-local" className="form-control" value={editFormData.followUpDate} onChange={(e) => setEditFormData({ ...editFormData, followUpDate: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Follow-Up Note</label>
                  <textarea className="form-control" rows="2" value={editFormData.followUpNote} onChange={(e) => setEditFormData({ ...editFormData, followUpNote: e.target.value })} placeholder="What needs to be done?"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Follow-Up Status</label>
                  <select className="form-select" value={editFormData.followUpStatus} onChange={(e) => setEditFormData({ ...editFormData, followUpStatus: e.target.value })}>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="MISSED">Missed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveCRMData}>Save Details</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimelineModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="fas fa-history me-2"></i> Activity Timeline - {selectedLead?.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowTimelineModal(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {(activities.length === 0 && interactions.length === 0) ? (
                  <div className="text-center text-muted my-4">No activities or interactions logged yet.</div>
                ) : (
                  <div className="timeline-wrapper d-flex flex-column gap-4">
                    {/* Interactions Section */}
                    {interactions.length > 0 && (
                      <div className="interaction-section">
                        <h6 className="mb-3 text-primary border-bottom pb-2">Conversation History</h6>
                        <div className="timeline-container ps-3 border-start border-3 border-success ms-3">
                          {interactions.map(act => (
                            <div key={act.id} className="position-relative mb-4">
                              <span className="position-absolute border border-3 border-white rounded-circle bg-success" style={{ width: '16px', height: '16px', left: '-25px', top: '4px' }}></span>
                              <div className="d-flex justify-content-between">
                                <strong className="text-dark bg-light px-2 py-1 rounded small">
                                  {new Date(act.interactionDate).toLocaleDateString()} {new Date(act.interactionDate).toLocaleTimeString([], { timeStyle: 'short' })}
                                </strong>
                                <span className="badge bg-info-subtle text-info border border-info-subtle">{act.interactionType}</span>
                              </div>
                              <div className="mt-2 fw-bold text-success">{(act.outcome || 'N/A').replace(/_/g, ' ')}</div>
                              <div className="text-muted mt-1 bg-light p-2 rounded">{act.notes}</div>
                              <div className="small text-secondary mt-1"><i className="fas fa-user-edit me-1"></i> {getUserName(act.salespersonId)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* System Activities Section */}
                    {activities.length > 0 && (
                      <div className="activity-section">
                        <h6 className="mb-3 text-secondary border-bottom pb-2">System Events</h6>
                        <div className="timeline-container ps-3 border-start border-3 border-secondary ms-3">
                          {activities.map(act => (
                            <div key={act.id} className="position-relative mb-4">
                              <span className="position-absolute border border-3 border-white rounded-circle bg-secondary" style={{ width: '16px', height: '16px', left: '-25px', top: '4px' }}></span>
                              <div><strong className="text-dark bg-light px-2 py-1 rounded small">{new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], { timeStyle: 'short' })}</strong></div>
                              <div className="mt-2 fw-bold text-secondary">{(act.activityType || 'EVENT').replace(/_/g, ' ')}</div>
                              <div className="text-muted mt-1">{act.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                <h5 className="modal-title"><i className="fas fa-comments me-2"></i> Log Interaction - {selectedLead?.name}</h5>
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
                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase">Date & Time</label>
                    <input type="datetime-local" className="form-control" value={interactionFormData.interactionDate} onChange={(e) => setInteractionFormData({ ...interactionFormData, interactionDate: e.target.value })} />
                  </div>
                  <div className="col-12">
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

      {/* Add Stage Modal */}
      {showAddStageModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Pipeline Stage</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddStageModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Stage ID (UPPERCASE, no spaces)</label>
                  <input type="text" className="form-control" value={newStageData.name} onChange={(e) => setNewStageData({ ...newStageData, name: e.target.value.toUpperCase().replace(/\s/g, '_') })} placeholder="e.g. FOLLOW_UP" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Display Label</label>
                  <input type="text" className="form-control" value={newStageData.label} onChange={(e) => setNewStageData({ ...newStageData, label: e.target.value })} placeholder="e.g. Follow Up" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Accent Color</label>
                  <input type="color" className="form-control form-control-color w-100" value={newStageData.color} onChange={(e) => setNewStageData({ ...newStageData, color: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddStageModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleAddStage}>Create Column</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadPipeline;

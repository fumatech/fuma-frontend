import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import serviceTicketService from "../../utils/serviceTicketService";

const ServiceTickets = ({ isTab = false }) => {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);

  const [formData, setFormData] = useState({
    customerId: "",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const [commentText, setCommentText] = useState("");

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, customersRes, usersRes] = await Promise.all([
        serviceTicketService.getAllTickets(),
        axios.get(`${process.env.REACT_APP_BASE_URL}/customer/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
      ]);
      setTickets(ticketsRes);
      setCustomers(customersRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loggedInEmail = sessionStorage.getItem("userEmail");
      const payload = {
        ...formData,
        createdBy: loggedInEmail,
      };
      await serviceTicketService.createTicket(payload);
      toast.success("Ticket created successfully");
      setIsModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error("Failed to create ticket");
    }
  };

  const openDetail = (ticket) => {
    setCurrentTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const handleAssign = async (employeeId) => {
    try {
      await serviceTicketService.assignTicket(currentTicket.id, employeeId);
      toast.success("Ticket assigned successfully");
      const updatedTicket = await serviceTicketService.getTicketById(currentTicket.id);
      setCurrentTicket(updatedTicket);
      fetchAllData();
    } catch (err) {
      toast.error("Failed to assign ticket");
    }
  };

  const handleStatusChange = async (status) => {
    if (status === "IN_PROGRESS" && !currentTicket.assignedToId) {
      toast.warning("Please assign this ticket to an employee before starting work.");
      return;
    }

    try {
      const loggedInEmail = sessionStorage.getItem("userEmail");
      const commentInput = prompt("Optional: Add a comment for this status change");
      await serviceTicketService.updateStatus(currentTicket.id, status, commentInput, loggedInEmail);
      toast.success(`Status updated to ${status}`);
      const updatedTicket = await serviceTicketService.getTicketById(currentTicket.id);
      setCurrentTicket(updatedTicket);
      fetchAllData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const loggedInEmail = sessionStorage.getItem("userEmail");
      const comment = {
        message: commentText,
        createdBy: loggedInEmail,
      };
      await serviceTicketService.addComment(currentTicket.id, comment);
      setCommentText("");
      const updatedTicket = await serviceTicketService.getTicketById(currentTicket.id);
      setCurrentTicket(updatedTicket);
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  const deleteTicket = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await serviceTicketService.deleteTicket(id);
        toast.success("Ticket deleted");
        fetchAllData();
      } catch (err) {
        toast.error("Failed to delete ticket");
      }
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getCustomerName = (id) => {
    const cust = customers.find(c => c.id === id);
    return cust ? `${cust.firstname} ${cust.lastname}` : "Unknown";
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? `${user.firstname} ${user.lastname}` : "Not Assigned";
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "HIGH": return "bg-danger";
      case "MEDIUM": return "bg-warning text-dark";
      case "LOW": return "bg-info";
      default: return "bg-secondary";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "OPEN": return "bg-primary";
      case "IN_PROGRESS": return "bg-info";
      case "RESOLVED": return "bg-success";
      case "CLOSED": return "bg-dark";
      default: return "bg-secondary";
    }
  };

  const content = (
    <>
      <div className="container-fluid">
        {!isTab && (
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="all-heading m-0 text-dark">Service Tickets</h1>
              <span className="sub-heading text-secondary">Manage customer complaints and service requests</span>
            </div>
            <div className="col-sm-6 text-end">
              <button className="btn btn-primary shadow-sm" onClick={() => setIsModalOpen(true)}>
                <i className="fas fa-plus me-2"></i> Create Ticket
              </button>
            </div>
          </div>
        )}
        {isTab && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="m-0 font-weight-bold">Service Tickets</h4>
            <button className="btn btn-primary btn-sm shadow-sm" onClick={() => setIsModalOpen(true)}>
              <i className="fas fa-plus me-2"></i> Create Ticket
            </button>
          </div>
        )}
      </div>

      <div className="container-fluid">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body">
            <div className="row mb-4 g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Ticket No or Subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="ALL">All Priority</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td className="fw-bold">{ticket.ticketNo}</td>
                      <td>{getCustomerName(ticket.customerId)}</td>
                      <td>{ticket.subject}</td>
                      <td>
                        <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>{getUserName(ticket.assignedToId)}</td>
                      <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td>
                        <DropdownButton variant="outline-primary" size="sm" title="Actions">
                          <Dropdown.Item onClick={() => openDetail(ticket)}><i className="fa fa-eye me-2"></i> View Details</Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => deleteTicket(ticket.id)} className="text-danger"><i className="fa fa-trash me-2"></i> Delete</Dropdown.Item>
                        </DropdownButton>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && !loading && (
                    <tr><td colSpan="8" className="text-center py-4 text-muted">No tickets found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-primary text-white rounded-top-4">
                <h5 className="modal-title fw-bold">Create New Service Ticket</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="row align-items-center g-2">
                        <label className="col-md-4 col-lg-3 form-label fw-bold small text-uppercase mb-md-0">
                          Customer (Franchise)
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select className="form-select" name="customerId" value={formData.customerId} onChange={handleInputChange} required>
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                              <option key={c.id} value={c.id}>{c.firstname} {c.lastname} ({c.franchiseName})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="row align-items-center g-2">
                        <label className="col-md-4 col-lg-3 form-label fw-bold small text-uppercase mb-md-0">
                          Subject
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <input type="text" className="form-control" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="Brief summary of the complaint" />
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="row align-items-center g-2">
                        <label className="col-md-4 col-lg-3 form-label fw-bold small text-uppercase mb-md-0">
                          Priority
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <select className="form-select" name="priority" value={formData.priority} onChange={handleInputChange}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="row g-2">
                        <label className="col-md-4 col-lg-3 form-label fw-bold small text-uppercase mb-md-0 pt-md-2">
                          Description
                        </label>
                        <div className="col-md-8 col-lg-9">
                          <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} rows="4" required placeholder="Detailed information about the service request..."></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 pt-0">
                  <button type="button" className="btn btn-light px-4" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm">Save Ticket</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {isDetailModalOpen && currentTicket && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white p-3">
                <div className="d-flex align-items-center gap-3">
                  <h5 className="modal-title fw-bold m-0">{currentTicket.ticketNo} - {currentTicket.subject}</h5>
                  <span className={`badge ${getStatusBadgeClass(currentTicket.status)}`}>{currentTicket.status}</span>
                  <span className={`badge ${getPriorityBadgeClass(currentTicket.priority)}`}>{currentTicket.priority}</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsDetailModalOpen(false)}></button>
              </div>
              <div className="modal-body p-0" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                <div className="row g-0">
                  {/* Info Column */}
                  <div className="col-md-4 border-end bg-light p-4">
                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Ticket Information</h6>
                    <div className="mb-3">
                      <div className="row g-2">
                        <label className="col-5 small text-muted mb-0">Customer</label>
                        <div className="col-7 fw-bold">{getCustomerName(currentTicket.customerId)}</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="row g-2">
                        <label className="col-5 small text-muted mb-0">Created By</label>
                        <div className="col-7">{currentTicket.createdBy}</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="row g-2">
                        <label className="col-5 small text-muted mb-0">Created Date</label>
                        <div className="col-7">{new Date(currentTicket.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <hr />
                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Assignment & Actions</h6>
                    <div className="mb-3">
                      <div className="row g-2 align-items-center">
                        <label className="col-5 small text-muted mb-0">Assigned To</label>
                        <div className="col-7">
                          <select
                            className="form-select form-select-sm"
                            value={currentTicket.assignedToId || ""}
                            onChange={(e) => handleAssign(e.target.value)}
                          >
                            <option value="">Select Employee</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="row g-2">
                        <label className="col-12 small text-muted mb-3">Ticket Status Flow</label>
                        <div className="col-12">
                          <div className="status-stepper d-flex justify-content-between position-relative mb-4 px-2">
                            {/* Stepper Line */}
                            <div className="position-absolute bg-light-subtle" style={{ height: '2px', top: '15px', left: '30px', right: '30px', backgroundColor: '#e9ecef', zIndex: 0 }}></div>
                            <div className="position-absolute" style={{
                              height: '2px',
                              top: '15px',
                              left: '30px',
                              width: currentTicket.status === 'OPEN' ? '0%' :
                                currentTicket.status === 'IN_PROGRESS' ? '33%' :
                                  currentTicket.status === 'RESOLVED' ? '66%' : '100%',
                              backgroundColor: '#0d6efd',
                              zIndex: 1,
                              transition: 'width 0.3s ease'
                            }}></div>

                            {/* Step: OPEN */}
                            <div className="text-center position-relative" style={{ zIndex: 2, width: '60px' }}>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 ${currentTicket.status === 'OPEN' ? 'bg-primary text-white shadow' : 'bg-white border border-primary text-primary'}`} style={{ width: '30px', height: '30px' }}>
                                {['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(currentTicket.status) ? <i className="fa fa-check small"></i> : <span className="small">1</span>}
                              </div>
                              <div className="small fw-bold" style={{ fontSize: '10px' }}>OPEN</div>
                            </div>

                            {/* Step: IN_PROGRESS */}
                            <div className="text-center position-relative" style={{ zIndex: 2, width: '60px' }}>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 ${currentTicket.status === 'IN_PROGRESS' ? 'bg-primary text-white shadow' : (['RESOLVED', 'CLOSED'].includes(currentTicket.status) ? 'bg-primary-subtle border border-primary text-primary' : 'bg-white border text-muted')}`} style={{ width: '30px', height: '30px' }}>
                                {['RESOLVED', 'CLOSED'].includes(currentTicket.status) ? <i className="fa fa-check small"></i> : <span className="small">2</span>}
                              </div>
                              <div className="small fw-bold" style={{ fontSize: '10px' }}>IN WORK</div>
                            </div>

                            {/* Step: RESOLVED */}
                            <div className="text-center position-relative" style={{ zIndex: 2, width: '60px' }}>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 ${currentTicket.status === 'RESOLVED' ? 'bg-success text-white shadow' : (currentTicket.status === 'CLOSED' ? 'bg-success-subtle border border-success text-success' : 'bg-white border text-muted')}`} style={{ width: '30px', height: '30px' }}>
                                {currentTicket.status === 'CLOSED' ? <i className="fa fa-check small"></i> : <span className="small">3</span>}
                              </div>
                              <div className="small fw-bold" style={{ fontSize: '10px' }}>RESOLVED</div>
                            </div>

                            {/* Step: CLOSED */}
                            <div className="text-center position-relative" style={{ zIndex: 2, width: '60px' }}>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 ${currentTicket.status === 'CLOSED' ? 'bg-dark text-white shadow' : 'bg-white border text-muted'}`} style={{ width: '30px', height: '30px' }}>
                                <span className="small">4</span>
                              </div>
                              <div className="small fw-bold" style={{ fontSize: '10px' }}>CLOSED</div>
                            </div>
                          </div>

                          <div className="d-grid gap-2 mt-3">
                            {currentTicket.status === "OPEN" && (
                              <button className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-2" onClick={() => handleStatusChange("IN_PROGRESS")}>
                                <i className="fas fa-play small"></i> Start Resolution
                              </button>
                            )}
                            {currentTicket.status === "IN_PROGRESS" && (
                              <button className="btn btn-success d-flex align-items-center justify-content-center gap-2 py-2" onClick={() => handleStatusChange("RESOLVED")}>
                                <i className="fas fa-check-circle small"></i> Mark as Resolved
                              </button>
                            )}
                            {currentTicket.status === "RESOLVED" && (
                              <button className="btn btn-dark d-flex align-items-center justify-content-center gap-2 py-2" onClick={() => handleStatusChange("CLOSED")}>
                                <i className="fas fa-archive small"></i> Close Ticket
                              </button>
                            )}
                            {currentTicket.status === "CLOSED" && (
                              <div className="alert alert-light border small text-center mb-0">
                                <i className="fas fa-info-circle me-2"></i> This ticket is finalized and closed.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discussion Column */}
                  <div className="col-md-8 p-4">
                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Complaint Description</h6>
                    <div className="bg-white p-3 rounded border mb-4 shadow-sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {currentTicket.description}
                    </div>

                    <ul className="nav nav-tabs mb-3">
                      <li className="nav-item">
                        <a className="nav-link active fw-bold" href="#">Comments & Updates</a>
                      </li>
                    </ul>

                    <div className="comment-section mb-4">
                      <div className="d-flex flex-column gap-3 mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {currentTicket.comments && currentTicket.comments.length > 0 ? (
                          currentTicket.comments.map(c => (
                            <div key={c.id} className="bg-light p-3 rounded border-start border-primary border-4 shadow-sm">
                              <div className="d-flex justify-content-between mb-1">
                                <span className="fw-bold small">{c.createdBy}</span>
                                <span className="text-muted small">{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="small">{c.message}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted py-3 small">No comments yet.</div>
                        )}
                      </div>
                      <div className="input-group">
                        <textarea
                          className="form-control shadow-none"
                          rows="2"
                          placeholder="Add a comment or update..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        ></textarea>
                        <button className="btn btn-primary" onClick={handleAddComment}>
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>
                    </div>

                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Status History</h6>
                    <div className="timeline-small border-start ps-3 ms-2">
                      {currentTicket.statusHistory && currentTicket.statusHistory.length > 0 ? (
                        currentTicket.statusHistory.slice().reverse().map(h => (
                          <div key={h.id} className="mb-3 position-relative">
                            <div className="position-absolute bg-white rounded-circle border border-primary" style={{ width: '10px', height: '10px', left: '-18px', top: '5px' }}></div>
                            <div className="small text-muted">{new Date(h.changedAt).toLocaleString()} - {h.changedBy}</div>
                            <div className="small">
                              Changed status from <span className="badge bg-light text-dark border">{h.fromStatus}</span> to <span className={`badge ${getStatusBadgeClass(h.toStatus)}`}>{h.toStatus}</span>
                            </div>
                            {h.comment && <div className="text-muted italic small mt-1 ps-2 border-start">"{h.comment}"</div>}
                          </div>
                        ))
                      ) : (
                        <div className="small text-muted">No history available.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isTab) {
    return content;
  }

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <section className="content">
        {content}
      </section>
    </div>
  );
};

export default ServiceTickets;

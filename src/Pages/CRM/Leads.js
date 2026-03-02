import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const Leads = () => {
  // Table data state
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    source: "Facebook",
    lifeStage: "New",
    employeeid: "",
    mobileNumber: "",
    taxNumber: "",
    addedOn: new Date().toISOString().slice(0, 16),
    customField1: "",
    customField2: "",
    customField3: "",
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
  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
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
      customField1: "",
      customField2: "",
      customField3: "",
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
        : new Date().toISOString().slice(0, 16),
      customField1: lead.customField1,
      customField2: lead.customField2,
      customField3: lead.customField3,
    });
    setIsModalOpen(true);
  };

  const formatDateTimeForInput = (backendDateTime) => {
    return backendDateTime.slice(0, 16);
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
        // Update existing lead
        const response = await axios.put(
          `${process.env.REACT_APP_BASE_URL}/lead/update/${currentLead.id}`,
          formData
        );
        setLeads(
          leads.map((lead) =>
            lead.id === currentLead.id ? response.data : lead
          )
        );
      } else {
        // Add new lead
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/lead/save`,
          formData
        );
        toast.success("Lead Saved Successfully...");
        setLeads([...leads, response.data]);
      }
      closeModal();
    } catch (err) {
      // console.error("Error saving lead:", err);
      toast.error("Error saving lead. Please try again.");
    }
  };

  // Delete lead
  const deleteLead = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/lead/delete/${id}`
        );
        toast.success("Lead Deleted Successfully...");
        setLeads(leads.filter((lead) => lead.id !== id));
      } catch (err) {
        //console.error("Error deleting lead:", err);
        toast.error("Error deleting lead. Please try again.");
      }
    }
  };

  // Calculate pagination
  const filteredLeads = leads.filter((lead) =>
    Object.values(lead).some(
      (val) =>
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeads.length / entriesPerPage)
  );
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      ...leads.map((lead) =>
        headers
          .map((header) => {
            const key = header.toLowerCase().replace(/\s+/g, "");
            if (key === "assignedto") {
              const user = users.find((u) => u.id === lead.employeeid);
              return user ? `"${user.firstname} ${user.lastname}"` : '""';
            }
            return `"${lead[key] || ""}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
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

  // Function to get user name by ID
  const getUserNameById = (id) => {
    const user = users.find((user) => user.id === id);
    return user ? `${user.firstname} ${user.lastname}` : "Not assigned";
  };

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <div className="">
        <section className="content-header">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="all-heading m-0">All Leads</h1>
              <span className="sub-heading">Manage leads</span>
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
                        {columnsVisibility.Email && <th>Email</th>}
                        {columnsVisibility.Source && <th>Source</th>}
                        {columnsVisibility["Life Stage"] && <th>Life Stage</th>}
                        {columnsVisibility["Assigned to"] && (
                          <th>Assigned to</th>
                        )}
                        {columnsVisibility.Mobile && <th>Mobile</th>}
                        {columnsVisibility["Tax number"] && <th>Tax number</th>}
                        {columnsVisibility["Added On"] && <th>Added On</th>}
                        {columnsVisibility["Custom Field 1"] && (
                          <th>Custom Field 1</th>
                        )}
                        {columnsVisibility["Custom Field 2"] && (
                          <th>Custom Field 2</th>
                        )}
                        {columnsVisibility["Custom Field 3"] && (
                          <th>Custom Field 3</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.length > 0 ? (
                        paginatedLeads.map((lead) => (
                          <tr key={lead.id}>
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
                                    onClick={() => openViewModal(lead)}
                                  >
                                    <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                      <i className="dropdown_hover fa fa-eye me-3"></i>
                                      <span>View</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => openEditModal(lead)}
                                  >
                                    <div className="d-inline-block w-100 btn-edit justify-content-center text-secondary">
                                      <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                      <span>Edit</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => deleteLead(lead.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-delete justify-content-center text-secondary">
                                      <i className="fa fa-trash me-3"></i>
                                      <span>delete</span>
                                    </div>
                                  </Dropdown.Item>
                                </DropdownButton>
                              </td>
                            )}
                            {columnsVisibility.Name && <td>{lead.name}</td>}
                            {columnsVisibility.Email && <td>{lead.email}</td>}
                            {columnsVisibility.Source && <td>{lead.source}</td>}
                            {columnsVisibility["Life Stage"] && (
                              <td>{lead.lifeStage}</td>
                            )}
                            {columnsVisibility["Assigned to"] && (
                              <td>{getUserNameById(lead.employeeid)}</td>
                            )}
                            {columnsVisibility.Mobile && (
                              <td>{lead.mobileNumber}</td>
                            )}
                            {columnsVisibility["Tax number"] && (
                              <td>{lead.taxNumber}</td>
                            )}
                            {columnsVisibility["Added On"] && (
                              <td>
                                {lead.addedOn ? lead.addedOn.split("T")[0] : ""}
                              </td>
                            )}
                            {columnsVisibility["Custom Field 1"] && (
                              <td>{lead.customField1}</td>
                            )}
                            {columnsVisibility["Custom Field 2"] && (
                              <td>{lead.customField2}</td>
                            )}
                            {columnsVisibility["Custom Field 3"] && (
                              <td>{lead.customField3}</td>
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
                      Showing{" "}
                      {filteredLeads.length === 0
                        ? 0
                        : (currentPage - 1) * entriesPerPage + 1}{" "}
                      to{" "}
                      {Math.min(
                        currentPage * entriesPerPage,
                        filteredLeads.length
                      )}{" "}
                      of {filteredLeads.length} entries
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

      {/* Modal for Add/Edit Lead */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentLead ? "Edit Lead" : "Add New Lead"}
                  </h5>
                  <button type="button" className="close" onClick={closeModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="name">Name</label>
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
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="email">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="source">Source</label>
                          <select
                            className="form-control"
                            id="source"
                            name="source"
                            value={formData.source}
                            onChange={handleInputChange}
                          >
                            <option value="Facebook">Facebook</option>
                            <option value="Twitter">Twitter</option>
                            <option value="Email">Email</option>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="lifeStage">Life Stage</label>
                          <select
                            className="form-control"
                            id="lifeStage"
                            name="lifeStage"
                            value={formData.lifeStage}
                            onChange={handleInputChange}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Prospect">Prospect</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Customer">Customer</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="employeeid">Assigned To</label>
                          <select
                            className="form-control"
                            id="employeeid"
                            name="employeeid"
                            value={formData.employeeid}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Employee</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.firstname} {user.lastname}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="mobileNumber">Mobile</label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNumber"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="taxNumber">Tax Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="taxNumber"
                            name="taxNumber"
                            value={formData.taxNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="addedOn">Added On</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            id="addedOn"
                            name="addedOn"
                            value={formData.addedOn}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="customField1">Custom Field 1</label>
                          <input
                            type="text"
                            className="form-control"
                            id="customField1"
                            name="customField1"
                            value={formData.customField1}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="customField2">Custom Field 2</label>
                          <input
                            type="text"
                            className="form-control"
                            id="customField2"
                            name="customField2"
                            value={formData.customField2}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="customField3">Custom Field 3</label>
                          <input
                            type="text"
                            className="form-control"
                            id="customField3"
                            name="customField3"
                            value={formData.customField3}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
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
                        {currentLead ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Viewing Lead */}
      {isViewModalOpen && currentLead && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Lead Details</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeViewModal}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Name</label>
                        <p className="form-control-static">
                          {currentLead.name}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Email</label>
                        <p className="form-control-static">
                          {currentLead.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Source</label>
                        <p className="form-control-static">
                          {currentLead.source}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Life Stage</label>
                        <p className="form-control-static">
                          {currentLead.lifeStage}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Assigned To</label>
                        <p className="form-control-static">
                          {getUserNameById(currentLead.employeeid)}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Mobile</label>
                        <p className="form-control-static">
                          {currentLead.mobileNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Tax Number</label>
                        <p className="form-control-static">
                          {currentLead.taxNumber}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Added On</label>
                        <p className="form-control-static">
                          {currentLead.addedOn
                            ? formatDateTimeForDisplay(currentLead.addedOn)
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Custom Field 1</label>
                        <p className="form-control-static">
                          {currentLead.customField1}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Custom Field 2</label>
                        <p className="form-control-static">
                          {currentLead.customField2}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Custom Field 3</label>
                        <p className="form-control-static">
                          {currentLead.customField3}
                        </p>
                      </div>
                    </div>
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
    </div>
  );
};

export default Leads;

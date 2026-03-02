import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const ContactLogin = () => {
  // Table data state
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [formData, setFormData] = useState({
    type: "Franchise",
    userName: "",
    name: "",
    email: "",
    password: "",
  });

  // Filter state
  const [contactFilter, setContactFilter] = useState("All");

  // Table configuration
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Columns visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    Action: true,
    Contact: true,
    Username: true,
    Name: true,
    Email: true,
  });

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/contact-login/getall`
        );
        setContacts(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchContacts();
  }, []);

  // Open modal for adding new contact login
  const openAddModal = () => {
    setCurrentContact(null);
    setFormData({
      type: "Franchise",
      userName: "",
      name: "",
      email: "",
      password: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for viewing contact login
  const openViewModal = (contact) => {
    setCurrentContact(contact);
    setIsViewModalOpen(true);
  };

  // Open modal for editing contact login
  const openEditModal = (contact) => {
    setCurrentContact(contact);
    setFormData({
      type: contact.type,
      userName: contact.userName,
      name: contact.name,
      email: contact.email,
      password: "",
    });
    setIsModalOpen(true);
  };

  // Close modals
  const closeModal = () => {
    setIsModalOpen(false);
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
      if (currentContact) {
        // Update existing contact login
        const updatedData = {
          ...formData,
          // Only include password if it was provided
          password: formData.password || undefined,
        };

        const response = await axios.put(
          `${process.env.REACT_APP_BASE_URL}/contact-login/update/${currentContact.id}`,
          updatedData
        );
        const updatedContacts = contacts.map((contact) =>
          contact.id === currentContact.id ? response.data : contact
        );
        setContacts(updatedContacts);
      } else {
        // Add new contact login
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/contact-login/save`,
          formData
        );
        toast.success("Contact login saved successfully...");
        setContacts([...contacts, response.data]);
      }
      closeModal();
    } catch (err) {
      //  console.error("Error saving contact login:", err);
      toast.error("Error saving contact login. Please try again.");
    }
  };

  // Delete contact login
  const deleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact login?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/contact-login/delete/${id}`
        );
        toast.success("Contact Login Deleted Successfully...");
        setContacts(contacts.filter((contact) => contact.id !== id));
      } catch (err) {
        //  console.error("Error deleting contact login:", err);
        toast.error("Error deleting contact login. Please try again.");
      }
    }
  };

  // Filter contacts by type
  const filteredContacts = contacts.filter((contact) => {
    if (contactFilter === "All") return true;
    return contact.type === contactFilter;
  });

  // Calculate pagination
  const searchedContacts = filteredContacts.filter((contact) =>
    Object.values(contact).some(
      (val) =>
        val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const totalPages = Math.max(
    1,
    Math.ceil(searchedContacts.length / entriesPerPage)
  );
  const paginatedContacts = searchedContacts.slice(
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
      ...contacts.map((contact) =>
        headers
          .map((header) => {
            const key = header.toLowerCase().replace(/\s+/g, "");
            return `"${contact[key] || ""}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contact-logins.csv";
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

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <div className="">
        <section className="content-header">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="all-heading m-0">Contacts Login</h1>
              <span className="sub-heading">
                Add logins for customers & suppliers
              </span>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="contactFilter" className="mr-2">
                        <strong>Contact:</strong>
                      </label>
                      <select
                        id="contactFilter"
                        className="form-control form-control-sm d-inline-block w-auto"
                        value={contactFilter}
                        onChange={(e) => setContactFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Franchise">Franchise</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Walk-in Customer">
                          Walk-in Customer
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="text-right ">
                    <button className="btn btn-add" onClick={openAddModal}>
                      <i className="fas fa-plus"></i> Add
                    </button>
                  </div>
                </div>

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
                    <button
                      onClick={exportPDF}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-pdf"></i> Export PDF
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        {columnsVisibility.Action && <th>Action</th>}
                        {columnsVisibility.Contact && <th>Contact</th>}
                        {columnsVisibility.Username && <th>Username</th>}
                        {columnsVisibility.Name && <th>Name</th>}
                        {columnsVisibility.Email && <th>Email</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedContacts.length > 0 ? (
                        paginatedContacts.map((contact) => (
                          <tr key={contact.id}>
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
                                    onClick={() => openViewModal(contact)}
                                  >
                                    <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                      <i className="dropdown_hover fa fa-eye me-3"></i>
                                      <span>View</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => openEditModal(contact)}
                                  >
                                    <div className="d-inline-block w-100 btn-edit justify-content-center text-secondary">
                                      <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                      <span>Edit</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => deleteContact(contact.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-delete justify-content-center text-secondary">
                                      <i className="fa fa-trash me-3"></i>
                                      <span>Delete</span>
                                    </div>
                                  </Dropdown.Item>
                                </DropdownButton>
                              </td>
                            )}
                            {columnsVisibility.Contact && (
                              <td>{contact.type}</td>
                            )}
                            {columnsVisibility.Username && (
                              <td>{contact.userName}</td>
                            )}
                            {columnsVisibility.Name && <td>{contact.name}</td>}
                            {columnsVisibility.Email && (
                              <td>{contact.email}</td>
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
                      {searchedContacts.length === 0
                        ? 0
                        : (currentPage - 1) * entriesPerPage + 1}{" "}
                      to{" "}
                      {Math.min(
                        currentPage * entriesPerPage,
                        searchedContacts.length
                      )}{" "}
                      of {searchedContacts.length} entries
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

      {/* Modal for Add/Edit Contact Login */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {currentContact
                      ? "Edit Contact Login"
                      : "Add New Contact Login"}
                  </h5>
                  <button type="button" className="close" onClick={closeModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="type">Contact Type</label>
                      <select
                        className="form-control"
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Franchise">Franchise</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Walk-in Customer">
                          Walk-in Customer
                        </option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="userName">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        id="userName"
                        name="userName"
                        value={formData.userName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
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
                    <div className="form-group">
                      <label htmlFor="password">
                        {currentContact
                          ? "New Password (leave blank to keep current)"
                          : "Password"}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!currentContact}
                        placeholder={currentContact ? "Optional" : ""}
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
                        {currentContact ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for View Contact Login */}
      {isViewModalOpen && currentContact && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">View Contact Login</h5>
                  <button type="button" className="close" onClick={closeModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Contact Type</label>
                    <p className="form-control-static">{currentContact.type}</p>
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <p className="form-control-static">
                      {currentContact.userName}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <p className="form-control-static">{currentContact.name}</p>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <p className="form-control-static">
                      {currentContact.email}
                    </p>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactLogin;

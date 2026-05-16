import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import "./Users.css";
import "../Shared/UnifiedERPTheme.css";
import { Link, useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const Users = ({ userRoles }) => {
  const [users, setUsers] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    department: true,
    designation: true,
    isActive: true,
    actions: true,
    location: true,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [businessLocations, setBusinessLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => setBusinessLocations(data))
      .catch((err) => console.error("Error fetching locations", err));
    fetch(`${process.env.REACT_APP_BASE_URL}/department/getall`)
      .then((res) => res.json())
      .then((data) => setDepartments(data))
      .catch((err) => console.error("Error fetching departments", err));
    fetch(`${process.env.REACT_APP_BASE_URL}/designation/getall`)
      .then((res) => res.json())
      .then((data) => setDesignations(data))
      .catch((err) => console.error("Error fetching designations", err));
  }, []);

  const getUserLocations = (locationIds = []) => {
    if (!locationIds.length || !businessLocations.length) return "-";
    return businessLocations
      .filter((loc) => locationIds.includes(Number(loc.id)))
      .map((loc) => loc.name)
      .join(", ");
  };

  const getDepartmentName = (id) => {
    const d = departments.find((dep) => dep.id === id);
    return d ? d.department : "—";
  };

  const getDesignationName = (id) => {
    const d = designations.find((des) => des.id === id);
    return d ? d.name : "—";
  };

  const extractRole = (roles) => {
    if (!roles || roles.length === 0) return "No Role";
    const sortedRoles = [...roles].sort((a, b) => {
      if (a.role === "Super Admin") return -1;
      if (b.role === "Super Admin") return 1;
      return 0;
    });
    return sortedRoles[0].role;
  };

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/user/getall`)
      .then((response) => response.json())
      .then((data) => {
        const sortedUsers = [...data].sort((a, b) => {
          const roleA = extractRole(a.roles);
          const roleB = extractRole(b.roles);
          if (roleA === "Super Admin" && roleB !== "Super Admin") return -1;
          if (roleA !== "Super Admin" && roleB === "Super Admin") return 1;
          return 0;
        });
        setUsers(sortedUsers);
      })
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const exportCSV = () => {
    const csvData = users.map((user) => ({
      "First Name": user.firstname,
      "Last Name": user.lastname,
      Email: user.email,
      Role: extractRole(user.roles),
      "Is Active": user.isActive ? "Yes" : "No",
    }));
    const csv = [
      ["First Name", "Last Name", "Email", "Role", "Is Active"],
      ...csvData.map((row) => Object.values(row)),
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "user.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      users.map((user) => ({
        "First Name": user.firstname,
        "Last Name": user.lastname,
        Email: user.email,
        Role: extractRole(user.roles),
        "Is Active": user.isActive ? "Yes" : "No",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "user.xlsx");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">');
    printWindow.document.write("</head><body>");
    printWindow.document.write(document.getElementById("table-container").innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["First Name", "Last Name", "Email", "Role", "Is Active"]],
      body: users.map((user) => [
        user.firstname,
        user.lastname,
        user.email,
        extractRole(user.roles),
        user.isActive ? "Yes" : "No",
      ]),
    });
    doc.save("users.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/user/delete/${id}`, { method: "DELETE" })
        .then((response) => {
          if (response.status === 204) {
            setUsers(users.filter((user) => user.id !== id));
            toast.success("User deleted successfully!");
          } else {
            toast.error("Failed to delete user.");
          }
        })
        .catch((error) => console.error("Error deleting user:", error));
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      (user.firstname || "").toLowerCase().includes(search) ||
      (user.lastname || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      extractRole(user.roles).toLowerCase().includes(search)
    );
  });

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredUsers.length);
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);

  const hasPermission = (permission) => true;

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  return (
    <div className="wrapper contact-user-page users-compact-page">
      <div className="content-wrapper erp-product-page erp-master-page">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Users</h1>
                <span className="display-inline sub-heading">Manage User</span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="col6 text-right pt-3 pr-3">
                {hasPermission("user.add") && (
                  <Link to="/AddUser" className="btn btn-add">
                    <i className="fas fa-plus"></i> Add
                  </Link>
                )}
              </div>
              <div className="card-body">
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label htmlFor="entriesPerPage" className="mb-0 mr-2">Show</label>
                    <select
                      id="entriesPerPage"
                      className="form-control form-control-sm mr-2"
                      style={{ width: "60px", borderRadius: "8px" }}
                      value={entriesPerPage}
                      onChange={handleEntriesChange}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                    Entries
                  </div>

                  <div className="col d-flex flex-wrap align-items-center">
                    <button onClick={exportCSV} className="btn Export-Btn mt-2 mb-2 mr-2">
                      <i className="fa fa-file-csv"></i> Export CSV
                    </button>
                    <button onClick={exportExcel} className="btn Export-Btn mt-2 mb-2 mr-2">
                      <i className="fa fa-file-excel"></i> Export Excel
                    </button>
                    <button onClick={printData} className="btn Export-Btn mt-2 mb-2 mr-2">
                      <i className="fa fa-print"></i> Print
                    </button>
                    <button onClick={exportPDF} className="btn Export-Btn mt-2 mb-2 mr-2">
                      <i className="fa fa-file-pdf"></i> Export PDF
                    </button>
                    <div className="dropdown mt-lg-2 mb-lg-2 ">
                      <button
                        className="btn Export-Btn dropdown-toggle"
                        type="button"
                        id="dropdownMenuButton"
                        data-toggle="dropdown"
                      >
                        <i className="fa fa-columns"></i> Column Visibility
                      </button>
                      <div className="dropdown-menu">
                        {Object.keys(columnsVisibility).map((col) => (
                          <div key={col} className="dropdown-item d-flex align-items-center">
                            <input
                              type="checkbox"
                              checked={columnsVisibility[col]}
                              onChange={() => toggleColumn(col)}
                              className="mr-2"
                            />
                            <span onClick={(e) => handleDropdownItemClick(col, e)}>
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-2">
                   <div className="col-md-4 ml-auto d-flex align-items-center justify-content-end">
                      <span className="mr-2 text-bold">Search:</span>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ width: "200px", borderRadius: "8px" }}
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                   </div>
                </div>

                <div id="table-container" style={{ overflowX: "auto" }}>
                  <table
                    id="example1"
                    className="table table-bordered table-hover"
                    style={{ minWidth: "1000px" }}
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.firstName && <th>First Name</th>}
                        {columnsVisibility.lastName && <th>Last Name</th>}
                        {columnsVisibility.email && <th>Email</th>}
                        {columnsVisibility.role && <th>Role</th>}
                        {columnsVisibility.department && <th>Department</th>}
                        {columnsVisibility.designation && <th>Designation</th>}
                        {columnsVisibility.isActive && <th className="text-center">Is Active</th>}
                        {columnsVisibility.location && <th>Business Locations</th>}
                        {columnsVisibility.actions && <th className="text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="table_style">
                      {displayedUsers.map((user) => (
                        <tr key={user.id} className="element_color">
                          {columnsVisibility.firstName && <td>{user.firstname}</td>}
                          {columnsVisibility.lastName && <td>{user.lastname}</td>}
                          {columnsVisibility.email && <td>{user.email}</td>}
                          {columnsVisibility.role && <td>{extractRole(user.roles)}</td>}
                          {columnsVisibility.department && <td>{getDepartmentName(user.departmentId)}</td>}
                          {columnsVisibility.designation && <td>{getDesignationName(user.designationId)}</td>}
                          {columnsVisibility.isActive && (
                            <td className="checkbox-container text-center">
                              <input
                                type="checkbox"
                                readOnly
                                checked={user.isActive}
                                style={{
                                  cursor: "default",
                                  accentColor: user.isActive ? "#78B833" : "red",
                                  width: "20px",
                                  height: "20px",
                                }}
                              />
                            </td>
                          )}
                          {columnsVisibility.location && <td>{getUserLocations(user.locationIds) || "-"}</td>}
                          {columnsVisibility.actions && (
                            <td className="text-center">
                              <div className="btn-group btn-group-sm btn-icon-only">
                                {extractRole(user.roles)?.toLowerCase() !== "super admin" && (
                                  <>
                                    <button type="button" className="btn-edit" onClick={() => navigate(`/EditUser/${user.id}`)}>
                                      <i className="fas fa-edit btn-icon"></i> Edit
                                    </button>
                                    <button type="button" className="btn-delete" onClick={() => handleDelete(user.id)}>
                                      <i className="fas fa-trash btn-icon"></i> Delete
                                    </button>
                                    <button type="button" className="btn-view" onClick={() => navigate(`/ViewUser/${user.id}`)}>
                                      <i className="fas fa-eye btn-icon"></i> View
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-3">
                  <div className="col-sm-12 col-md-5">
                    <div className="dataTables_info">
                      Showing {filteredUsers.length > 0 ? startIndex + 1 : 0} to {endIndex} of {filteredUsers.length} entries
                    </div>
                  </div>
                  <div className="col-sm-12 col-md-7">
                    <div className="dataTables_paginate paging_simple_numbers d-flex justify-content-end">
                      <ul className="pagination pagination-sm m-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                          <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
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
    </div>
  );
};

export default Users;

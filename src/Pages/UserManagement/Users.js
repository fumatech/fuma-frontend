import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
// import "../../assets/plugins/datatables.net-dt/css/jquery.dataTables.min.css";
// import "../../assets/plugins/datatables.net-buttons/css/buttons.dataTables.min.css";
import "./Users.css";
import "../Shared/UnifiedERPTheme.css";
import "datatables.net";

import "datatables.net-bs4";
import "datatables.net-responsive";
import "datatables.net-responsive-bs4";
import "datatables.net-buttons";
import "datatables.net-buttons-bs4";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";
import "datatables.net-buttons/js/buttons.colVis";
import pdfmake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Link, useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

pdfmake.vfs = pdfFonts.vfs;

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

  // Improved extractRole function
  const extractRole = (roles) => {
    if (!roles || roles.length === 0) return "No Role";
    // Find the role with the highest priority (Super Admin first)
    const sortedRoles = [...roles].sort((a, b) => {
      if (a.role === "Super Admin") return -1;
      if (b.role === "Super Admin") return 1;
      return 0;
    });
    return sortedRoles[0].role;
  };

  // In your useEffect, update the sorting logic:
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/user/getall`) // ✅ FIXED
      .then((response) => response.json())
      .then((data) => {
        // Sort users to ensure Super Admin appears first
        const sortedUsers = [...data].sort((a, b) => {
          const roleA = extractRole(a.roles);
          const roleB = extractRole(b.roles);

          if (roleA === "Super Admin" && roleB !== "Super Admin") return -1;
          if (roleA !== "Super Admin" && roleB === "Super Admin") return 1;
          return 0; // Keep original order for others
        });

        setUsers(sortedUsers);

        // Rest of your code...
      })
      .catch((error) => console.error("Error fetching users:", error));

    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
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
    ]
      .map((row) => row.join(","))
      .join("\n");

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
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body >");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
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
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to the first page when entries per page changes
  };

  const handleEdit = (userId) => {
    navigate(`/EditUser/${userId}`);
  };

  const handleView = (userId) => {
    navigate(`/ViewUser/${userId}`);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/user/delete/${id}`, {
        method: "DELETE",
      })
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

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedUsers = users.slice(startIndex, endIndex);

  const hasPermission = (permission) => {
    return true; // Temporarily bypassed
    /*
    return userRoles.some((role) =>
      role.permissions.some((p) => p.name === permission)
    );
    */
  };

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation(); // Prevent the event from bubbling up and affecting the dropdown toggle
    toggleColumn(col); // Toggle column visibility
  };

  return (
    <div className="wrapper contact-user-page users-compact-page">
      <div className="content-wrapper erp-product-page erp-master-page">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className=" all-heading ">Users</h1>
                <span className="display-inline sub-heading">Manage User</span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="col6 text-right">
                {hasPermission("user.add") && (
                  <Link to="/AddUser" className="btn btn-add">
                    <i className="fas fa-plus"></i> Add
                  </Link>
                )}
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
                      <option value={10}>10</option>
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

                    <div className="dropdown mt-lg-2 mb-lg-2 ">
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
                              onChange={() => toggleColumn(col)} // Toggle column visibility on checkbox change
                              className="mr-2"
                            />
                            <span
                              className="btn border-0 bg-transparent p-0 m-0"
                              onClick={(e) => handleDropdownItemClick(col, e)} // Handle click on dropdown item
                            >
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
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
                        {columnsVisibility.firstName && (
                          <th className="">First Name</th>
                        )}
                        {columnsVisibility.lastName && <th>Last Name</th>}
                        {columnsVisibility.email && <th>Email</th>}
                        {columnsVisibility.role && <th>Role</th>}
                        {columnsVisibility.department && <th>Department</th>}
                        {columnsVisibility.designation && <th>Designation</th>}
                        {columnsVisibility.isActive && (
                          <th className="text-center">Is Active</th>
                        )}
                        {columnsVisibility.location && (
                          <th>Business Locations</th>
                        )}

                        {columnsVisibility.actions && (
                          <th className="text-center">Actions</th>
                        )}
                      </tr>
                    </thead>
                    {(hasPermission("user.view") ||
                      hasPermission("user.edit") ||
                      hasPermission("user.delete")) && (
                        <tbody className="table_style">
                          {displayedUsers.map((user) => (
                            <tr key={user.id} className="element_color">
                              {columnsVisibility.firstName && (
                                <td>{user.firstname}</td>
                              )}
                              {columnsVisibility.lastName && (
                                <td>{user.lastname}</td>
                              )}
                              {columnsVisibility.email && <td>{user.email}</td>}
                              {columnsVisibility.role && (
                                <td>{extractRole(user.roles)}</td>
                              )}
                              {columnsVisibility.department && (
                                <td>{getDepartmentName(user.departmentId)}</td>
                              )}
                              {columnsVisibility.designation && (
                                <td>{getDesignationName(user.designationId)}</td>
                              )}
                              {columnsVisibility.isActive && (
                                <td className="checkbox-container text-center">
                                  <input
                                    type="checkbox"
                                    checked={user.isActive}
                                    style={{
                                      cursor: "default",
                                      accentColor: user.isActive
                                        ? "#78B833"
                                        : "red", // Modern browsers support this
                                      width: "20px", // Adjust size as needed
                                      height: "20px", // Adjust size as needed
                                      // Background and border color might not apply to the checkbox itself
                                      // Background and border color might apply to the container cell instead
                                    }}
                                  />
                                </td>
                              )}
                              {columnsVisibility.location && (
                                <td>
                                  {getUserLocations(user.locationIds) || "-"}
                                </td>
                              )}

                              {columnsVisibility.actions && (
                                <td className="text-center">
                                  <div className="btn-group btn-group-sm btn-icon-only">
                                    {extractRole(user.roles)?.toLowerCase() !==
                                      "super admin" && (
                                        <>
                                          {hasPermission("user.edit") && (
                                            <button
                                              type="button"
                                              className="btn-edit"
                                              onClick={() => handleEdit(user.id)}
                                            >
                                              <i className="fas fa-edit btn-icon"></i>{" "}
                                              Edit
                                            </button>
                                          )}
                                          {hasPermission("user.delete") && (
                                            <button
                                              type="button"
                                              className="btn-delete"
                                              onClick={() => handleDelete(user.id)}
                                            >
                                              <i className="fas fa-trash btn-icon"></i>{" "}
                                              Delete
                                            </button>
                                          )}
                                          {hasPermission("user.view") && (
                                            <button
                                              type="button"
                                              className="btn-view"
                                              onClick={() => handleView(user.id)}
                                            >
                                              <i className="fas fa-eye btn-icon"></i>{" "}
                                              View
                                            </button>
                                          )}
                                        </>
                                      )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <aside className="control-sidebar control-sidebar-dark">
        {/* Control sidebar content goes here */}
      </aside>
    </div>
  );
};

export default Users;

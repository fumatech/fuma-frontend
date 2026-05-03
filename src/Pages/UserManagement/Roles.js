import React, { useEffect, useState } from "react";
// import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import "./Roles.css"; // Adjust the stylesheet if necessary
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

const Roles = ({ userRoles }) => {
  const [roles, setRoles] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    role: true,
    actions: true,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/role/getall`) // ✅ FIXED
      .then((response) => response.json())
      .then((data) => {
        // Improved sorting that handles case and ensures Super Admin is first
        const sortedRoles = [...data].sort((a, b) => {
          // Convert both to lowercase for case-insensitive comparison
          const aRole = a.role.toLowerCase();
          const bRole = b.role.toLowerCase();

          // Super Admin should always come first
          if (aRole === "super admin") return -1;
          if (bRole === "super admin") return 1;

          // Then sort others alphabetically
          return aRole.localeCompare(bRole);
        });

        setRoles(sortedRoles);

        // Rest of your script loading code...
      })
      .catch((error) => console.error("Error fetching roles:", error));

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
    const csvData = roles.map((role) => ({
      Role: role.roleName, // Adjust according to your data structure
    }));

    const csv = [["Role"], ...csvData.map((row) => Object.values(row))]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "roles.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      roles.map((role) => ({
        Role: role.role, // Adjust according to your data structure
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roles");
    XLSX.writeFile(wb, "roles.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Role"]],
      body: roles.map((role) => [role.role]), // Adjust according to your data structure
    });
    doc.save("roles.pdf");
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

  const handleEdit = (roleId) => {
    navigate(`/EditRoles?roleId=${roleId}`);
  };

  const handleView = (roleId) => {
    navigate(`/ViewRole?roleId=${roleId}`);
  };

  const handleDelete = (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/role/delete/${roleId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            setRoles(roles.filter((role) => role.id !== roleId));
            toast.success("Role deleted successfully!");
          } else {
            toast.error("Failed to delete role.");
          }
        })
        .catch((error) => console.error("Error deleting role:", error));
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedRoles = roles.slice(startIndex, endIndex);

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
    <div className="wrapper contact-user-page">
      <div className="content-wrapper erp-product-page erp-master-page">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading ">Roles</h1>
                <span className="display-inline sub-heading">Manage Roles</span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="col6 text-right">
                {hasPermission("roles.add") && (
                  <Link to="/AddRoles" className="btn btn-add">
                    <i className="fas fa-plus"></i> Add
                  </Link>
                )}
              </div>
              <div className="card-body">
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold">
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

                  <div className="col-auto d-flex flex-wrap align-items-center">
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
                    className="table table-bordered table-hover table_style shadow table-rounded  "
                    style={{ minWidth: "auto" }}
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.role && (
                          <th className="text-center">Role</th>
                        )}
                        {columnsVisibility.actions && (
                          <th className="text-center">Actions</th>
                        )}
                      </tr>
                    </thead>
                    {(hasPermission("roles.view") ||
                      hasPermission("roles.edit") ||
                      hasPermission("roles.delete")) && (
                        <tbody>
                          {displayedRoles.map((role) => {
                            const isSuperAdmin = role.role === "Super Admin"; // 👈 Check if role is Super Admin

                            return (
                              <tr className="" key={role.id}>
                                {columnsVisibility.role && <td>{role.role}</td>}
                                {columnsVisibility.actions && (
                                  <td className="">
                                    <div className="btn-group btn-group-sm btn-icon-only">
                                      {!isSuperAdmin && ( // 👈 Only show buttons if NOT Super Admin
                                        <>
                                          {hasPermission("roles.edit") && (
                                            <button
                                              type="button"
                                              className="btn-edit"
                                              onClick={() => handleEdit(role.id)}
                                            >
                                              <i className="fas fa-edit btn-icon"></i>{" "}
                                              Edit
                                            </button>
                                          )}
                                          {hasPermission("roles.view") && (
                                            <button
                                              type="button"
                                              className="btn-view"
                                              onClick={() => handleView(role.id)}
                                            >
                                              <i className="fas fa-eye btn-icon"></i>{" "}
                                              View
                                            </button>
                                          )}
                                          {hasPermission("roles.delete") && (
                                            <button
                                              type="button"
                                              className="btn-delete"
                                              onClick={() =>
                                                handleDelete(role.id)
                                              }
                                            >
                                              <i className="fas fa-trash btn-icon"></i>{" "}
                                              Delete
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
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

export default Roles;

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Leave from "./Leave";
import LeaveType from "./LeaveType";
import Designations from "./Designations";
import SalesTargets from "./SalesTargets";
import Department from "./Department";
import Holiday from "./Holiday";
import Attendance from "./Attendance";
import Payroll from "./payroll";
import HRMSettings from "./HRMSettings";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Settings = () => <div>Settings Content</div>;

const tabsData = [
  { id: "leave-type", label: "Leave Type", component: <LeaveType /> },
  { id: "leave", label: "Leave", component: <Leave /> },
  { id: "attendance", label: "Attendance", component: <Attendance /> },
  { id: "payroll", label: "Payroll", component: <Payroll /> },
  { id: "holiday", label: "Holiday", component: <Holiday /> },
  { id: "departments", label: "Departments", component: <Department /> },
  { id: "designations", label: "Designations", component: <Designations /> },
  { id: "sales-targets", label: "Sales Targets", component: <SalesTargets /> },
  { id: "HRMSettings", label: "Settings", component: <HRMSettings /> },
];
const HRMTabComponent = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(null);

  const activeTabData = tabsData.find((tab) => tab.id === activeTab);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to the first page when entries per page changes
  };

  // Add this state at the top of your component with other states
  const [employees, setEmployees] = useState([]); // Initialize with your employee data

  const exportCSV = () => {
    const csvData = employees.map((employee) => ({
      "First Name": employee.firstName,
      "Last Name": employee.lastName,
      Email: employee.email,
      // Add other employee fields as needed
    }));

    const csv = [
      ["First Name", "Last Name", "Email" /* other headers */],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "employees.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["First Name", "Last Name", "Email" /* other headers */]],
      body: employees.map((employee) => [
        employee.firstName,
        employee.lastName,
        employee.email,
        // Add other employee fields as needed
      ]),
    });
    doc.save("employees.pdf");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="httpss://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
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

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <div
          className="card"
          style={{
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#f8f9fa",
            //marginTop: "15px",
            padding: "5px 5px",
          }}
        >
          <div className="p-2">
            <ul
              className="nav"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0px",
                whiteSpace: "nowrap",
                overflowX: "auto",
              }}
            >
              {/* HRM Icon + Label */}
              <li
                style={{
                  fontWeight: "bold",
                  marginRight: "10px",
                  color: "#6c757d",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faUsers}
                  style={{ marginRight: "5px" }}
                />
                <Link
                  to="/HRMDashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(null); // Reset active tab
                    navigate("/HRMDashboard", { replace: true }); // Navigate without adding to history
                    window.scrollTo(0, 0); // Scroll to top
                  }}
                  style={{ textDecoration: "none", color: "#6c757d" }}
                >
                  HRM
                </Link>
              </li>
              {/* Tab Links */}
              {tabsData.map(({ id, label }) => (
                <li
                  className="nav-item"
                  key={id}
                  style={{ marginRight: "4px" }}
                >
                  <button
                    className={`nav-link ${activeTab === id ? "active" : ""}`}
                    onClick={() => setActiveTab(activeTab === id ? null : id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "13px",
                      color: activeTab === id ? "#007bff" : "#6c757d",
                      fontWeight: activeTab === id ? "bold" : "normal",
                      transition: "color 0.3s ease",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Content Section - Only shown when a tab is active */}
        {activeTab && (
          <div className="card-body">{activeTabData?.component}</div>
        )}
        {/* Dashboard Content - Only shown when no tab is active */}
        {!activeTab && (
          <section className="content">
            <div className="row justify-content-around">
              <div
                className=" card col-md-3 col-sm-6 col-xs-12 text-center   "
                style={{
                  height: "150px",
                }}
              >
                {" "}
                <div className="row d-flex">
                  <div className=" col-12 box-header d-flex gap-3 justify-content-start align-items-center mt-3">
                    <i className="fas fa-bullseye ms-2"></i>
                    <h3 className="box-title m-0">My Leaves</h3>
                  </div>{" "}
                  <div className="col-12 mt-4">
                    <Button className=" btn btn-success btn-lg">
                      My Payrolls
                    </Button>
                  </div>
                </div>
              </div>

              <div className="card col-md-4 col-sm-6 col-xs-12 col-custom  ">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-bullseye"></i>
                      <h3 className="box-title">My sales targets</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <div className="">
                            <table className="table no-margin">
                              <thead>
                                <tr>
                                  <td>
                                    <strong>Target achieved last month:</strong>
                                    <h4 className="text-success">$ 0.00</h4>
                                  </td>
                                  <td>
                                    <strong>Target achieved this month:</strong>
                                    <h4 className="text-success">$ 0.00</h4>
                                  </td>
                                </tr>
                                <tr>
                                  <th>Targets</th>
                                  <th>Commission Percent</th>
                                </tr>
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No data
                                  </td>
                                </tr>
                              </thead>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card col-md-4 col-sm-6 col-xs-12 col-custom">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-birthday-cake"></i>
                      <h3 className="box-title">Birthdays</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <div className="">
                            <table className="table no-margin">
                              <tbody>
                                <tr>
                                  <th className="bg-light-gray" colSpan="3">
                                    Today
                                  </th>
                                </tr>
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No data
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="3">&nbsp;</td>
                                </tr>
                                <tr>
                                  <th className="bg-light-gray" colSpan="3">
                                    Upcoming
                                  </th>
                                </tr>
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No data
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className="row  justify-content-between ">
              <div className=" card col-md-3 col-sm-6 col-xs-12 col-custom ">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-users"></i>
                      <h3 className="box-title">Users</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <table className="table no-margin">
                            <tbody>
                              <tr>
                                <th className="bg-light-gray" colSpan="2">
                                  Today
                                </th>
                              </tr>
                              <tr>
                                <td colSpan="2" className="text-center">
                                  No data
                                </td>
                              </tr>
                              <tr>
                                <td colSpan="2">&nbsp;</td>
                              </tr>
                              <tr>
                                <th className="bg-light-gray" colSpan="2">
                                  Upcoming
                                </th>
                              </tr>
                              <tr>
                                <td colSpan="2" className="text-center">
                                  No data
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className=" card col-md-4 col-sm-6 col-xs-12 col-custom">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-user-times"></i>
                      <h3 className="box-title">Leaves</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <table className="table no-margin">
                            <tbody>
                              <tr>
                                <th className="bg-light-gray" colSpan="2">
                                  Today
                                </th>
                              </tr>
                              <tr>
                                <td colSpan="2" className="text-center">
                                  No data
                                </td>
                              </tr>
                              <tr>
                                <td colSpan="2">&nbsp;</td>
                              </tr>
                              <tr>
                                <th className="bg-light-gray" colSpan="2">
                                  Upcoming
                                </th>
                              </tr>
                              <tr>
                                <td colSpan="2" className="text-center">
                                  No data
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className=" card col-md-4 col-sm-6 col-xs-12 col-custom">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-suitcase-rolling"></i>
                      <h3 className="box-title">Holidays</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <div className="">
                            <table className="table no-margin">
                              <tbody>
                                <tr>
                                  <th className="bg-light-gray" colSpan="3">
                                    Today
                                  </th>
                                </tr>
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No data
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="3">&nbsp;</td>
                                </tr>
                                <tr>
                                  <th className="bg-light-gray" colSpan="3">
                                    Upcoming
                                  </th>
                                </tr>
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No data
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row row-custom justify-content-evenly mt-4">
              <div className=" card col-md-4 col-sm-6 col-xs-12 col-custom">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-user-check"></i>
                      <h3 className="box-title">Today's Attendance</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <table className="table no-margin">
                            <thead>
                              <tr>
                                <th>Employee</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan="3" className="text-center">
                                  No data
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-7 col-md-8 col-sm-12 col-xs-12">
                <div className="tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                  <div className="tw-p-2 sm:tw-p-3">
                    <div className="box-header">
                      <i className="fas fa-bullseye"></i>
                      <h3 className="box-title">Sales targets</h3>
                    </div>
                    <div className="tw-flow-root tw-border-gray-200">
                      <div className="">
                        <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                          <div
                            id="sales_targets_table_wrapper"
                            className="dataTables_wrapper form-inline dt-bootstrap no-footer"
                          >
                            <div className="row mb-3 d-flex align-items-center">
                              <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                                <label
                                  htmlFor="entriesPerPage"
                                  className="mb-0 mr-2"
                                >
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
                                  <i className="fa fa-file-excel"></i> Export
                                  Excel
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
                                    <i className="fa fa-columns"></i> Column
                                    Visibility
                                  </button>
                                  <div
                                    className="dropdown-menu"
                                    aria-labelledby="dropdownMenuButton"
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="dataTables_scroll">
                              <div
                                className="dataTables_scrollHead"
                                style={{
                                  overflow: "hidden",
                                  position: "relative",
                                  border: "0px",
                                  width: "100%",
                                }}
                              >
                                <div className="dataTables_scrollHeadInner">
                                  <table
                                    className="table dataTable no-footer"
                                    role="grid"
                                  >
                                    <thead>
                                      <tr role="row">
                                        <th
                                          className="sorting_asc"
                                          tabIndex="0"
                                          aria-controls="sales_targets_table"
                                          rowSpan="1"
                                          colSpan="1"
                                          style={{ width: "179.738px" }}
                                          aria-sort="ascending"
                                          aria-label="User: activate to sort column descending"
                                        >
                                          User
                                        </th>
                                        <th
                                          className="sorting"
                                          tabIndex="0"
                                          aria-controls="sales_targets_table"
                                          rowSpan="1"
                                          colSpan="1"
                                          style={{ width: "657.963px" }}
                                          aria-label="Target achieved last month: activate to sort column ascending"
                                        >
                                          Target achieved last month
                                        </th>
                                        <th
                                          className="sorting"
                                          tabIndex="0"
                                          aria-controls="sales_targets_table"
                                          rowSpan="1"
                                          colSpan="1"
                                          style={{ width: "660.963px" }}
                                          aria-label="Target achieved this month: activate to sort column ascending"
                                        >
                                          Target achieved this month
                                        </th>
                                      </tr>
                                    </thead>
                                  </table>
                                </div>
                              </div>
                              <div
                                className="dataTables_scrollBody"
                                style={{
                                  position: "relative",
                                  overflow: "auto",
                                  width: "100%",
                                  maxHeight: "75vh",
                                }}
                              >
                                <table
                                  className="table dataTable no-footer"
                                  id="sales_targets_table"
                                  style={{ width: "100%" }}
                                  role="grid"
                                  aria-describedby="sales_targets_table_info"
                                >
                                  <thead>
                                    <tr role="row" style={{ height: "0px" }}>
                                      <th
                                        className="sorting_asc"
                                        aria-controls="sales_targets_table"
                                        rowSpan="1"
                                        colSpan="1"
                                        style={{
                                          width: "179.738px",
                                          paddingTop: "0px",
                                          paddingBottom: "0px",
                                          borderTopWidth: "0px",
                                          borderBottomWidth: "0px",
                                          height: "0px",
                                        }}
                                        aria-sort="ascending"
                                        aria-label="User: activate to sort column descending"
                                      >
                                        <div
                                          className="dataTables_sizing"
                                          style={{
                                            height: "0",
                                            overflow: "hidden",
                                          }}
                                        >
                                          User
                                        </div>
                                      </th>
                                      <th
                                        className="sorting"
                                        aria-controls="sales_targets_table"
                                        rowSpan="1"
                                        colSpan="1"
                                        style={{
                                          width: "657.963px",
                                          paddingTop: "0px",
                                          paddingBottom: "0px",
                                          borderTopWidth: "0px",
                                          borderBottomWidth: "0px",
                                          height: "0px",
                                        }}
                                        aria-label="Target achieved last month: activate to sort column ascending"
                                      >
                                        <div
                                          className="dataTables_sizing"
                                          style={{
                                            height: "0",
                                            overflow: "hidden",
                                          }}
                                        >
                                          Target achieved last month
                                        </div>
                                      </th>
                                      <th
                                        className="sorting"
                                        aria-controls="sales_targets_table"
                                        rowSpan="1"
                                        colSpan="1"
                                        style={{
                                          width: "660.963px",
                                          paddingTop: "0px",
                                          paddingBottom: "0px",
                                          borderTopWidth: "0px",
                                          borderBottomWidth: "0px",
                                          height: "0px",
                                        }}
                                        aria-label="Target achieved this month: activate to sort column ascending"
                                      >
                                        <div
                                          className="dataTables_sizing"
                                          style={{
                                            height: "0",
                                            overflow: "hidden",
                                          }}
                                        >
                                          Target achieved this month
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="odd">
                                      <td
                                        valign="top"
                                        colSpan="3"
                                        className="dataTables_empty"
                                      >
                                        No data available in table
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <div
                              className="dataTables_info"
                              id="sales_targets_table_info"
                              role="status"
                              aria-live="polite"
                            >
                              Showing 0 to 0 of 0 entries
                            </div>
                            <div
                              id="sales_targets_table_processing"
                              className="dataTables_processing panel panel-default"
                              style={{ display: "none" }}
                            >
                              Processing...
                            </div>
                            <div
                              className="dataTables_paginate paging_simple_numbers"
                              id="sales_targets_table_paginate"
                            >
                              <ul className="pagination">
                                <li
                                  className="paginate_button previous disabled"
                                  id="sales_targets_table_previous"
                                >
                                  <a
                                    href="#"
                                    aria-controls="sales_targets_table"
                                    data-dt-idx="0"
                                    tabIndex="0"
                                  >
                                    Previous
                                  </a>
                                </li>
                                <li
                                  className="paginate_button next disabled"
                                  id="sales_targets_table_next"
                                >
                                  <a
                                    href="#"
                                    aria-controls="sales_targets_table"
                                    data-dt-idx="1"
                                    tabIndex="0"
                                  >
                                    Next
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HRMTabComponent;

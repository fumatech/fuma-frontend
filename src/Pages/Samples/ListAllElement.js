import React, { useEffect, useState } from "react";

import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button } from "react-bootstrap";

import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import DropdownButton from "react-bootstrap/DropdownButton";
import * as xlsx from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import Collapse from "react-bootstrap/Collapse";

function ListAllElement({ userRoles }) {
  const [openProduct, setOpenProduct] = useState(false);
  const [openPurchases, setOpenPurchases] = useState(false);
  const [openSales, setOpenSales] = useState(false);
  const [dateRange, setDateRange] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ListAllElements, setListAllElements] = useState([]); // State to store ListAllElement data
  const [columnsVisibility, setColumnsVisibility] = useState({
    customField: true,
    
    img: true,
    action: true,
    action2: true,
    PurchaseStatus: true,
    PaymentStatus: true,
    email: true,
  
    isActive: true,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate(); // Initialize navigate

  // Fetch ListAllElements data from API
  useEffect(() => {
    const fetchListAllElements = async () => {
      try {
        const response = await axios.get("http://localhost:8080/vendor/getall");
        setListAllElements(response.data); // Update state with fetched data

        // Add external script directly
        const script = document.createElement("script");
        script.src = "js/JqueryContent.js";
        script.async = true;

        document.body.appendChild(script);

        // Cleanup function to remove the script element when the component is unmounted
        return () => {
          document.body.removeChild(script);
        };
      } catch (error) {
        console.error("Error fetching ListAllElements:", error);
      }
    };

    fetchListAllElements();
  }, []);

  const exportCSV = () => {
    const csvData = ListAllElements.map((ListAllElement) => ({
      Name: ListAllElement.name,
      "Contact Person": ListAllElement.contactPerson,
      Email: ListAllElement.email,
      "Mobile Number": ListAllElement.mobileNumber,
      Address: ListAllElement.address,
      City: ListAllElement.city,
      State: ListAllElement.state,
      Country: ListAllElement.country,
      "Tax Number": ListAllElement.taxNumber,
      "Zip Code": ListAllElement.zipCode,
      "Is Active": ListAllElement.isActive ? "Yes" : "No",
    }));

    const csv = [
      [
        "date",
        "referenceNumber",
        "img",
        "action",
        "action2",
        "PurchaseStatus",
        "PaymentStatus",
        "email",
        "mobileNumber",
        "Address",
        "City",
        "State",
        "Country",
        "Tax Number",
        "Zip Code",
        "Is Active",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "ListAllElements.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ListAllElements);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ListAllElements");
    XLSX.writeFile(wb, "ListAllElements.xlsx");
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
      head: [
        [
         
          "date",
          "referenceNumber",
          "img",
          "action",
          "action2",
          "PurchaseStatus",
          "PaymentStatus",
          "email",
          "mobileNumber",
          "Address",
          "City",
          "State",
          "Country",
          "Tax Number",
          "Zip Code",
          "Is Active",
        ],
      ],
      body: ListAllElements.map((ListAllElement) => [
        ListAllElement.date,
        ListAllElement.referenceNumber,
        ListAllElement.img,
        ListAllElement.action,
        ListAllElement.action2,
        ListAllElement.PurchaseStatus,
        ListAllElement.PaymentStatus,
        ListAllElement.email,
        ListAllElement.mobileNumber,
        ListAllElement.address,
        ListAllElement.city,
        ListAllElement.state,
        ListAllElement.country,
        ListAllElement.taxNumber,
        ListAllElement.zipCode,
        ListAllElement.isActive ? "Yes" : "No",
      ]),
    });
    doc.save("ListAllElements.pdf");
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

  const handleEdit = (id) => {
    navigate(`/EditListAllElement/${id}`); // Navigate to the edit page with the ListAllElement ID
  };

  const handleView = (id) => {
    navigate(`/ViewListAllElement/${id}`); // Navigate to the view page with the ListAllElement ID
  };

  const handleDelete = (id) => {};

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedListAllElements = ListAllElements.slice(startIndex, endIndex);

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation(); // Prevent the event from bubbling up and affecting the dropdown toggle
    toggleColumn(col); // Toggle column visibility
  };

  const handleViewClick = (productId) => {
    navigate(`/ViewList/${productId}`);
  };
  const handleDeleteClick = (id) => {};

  const formatDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateRangeChange = (selectedRange) => {
    let startDate, endDate;
    const today = new Date();

    switch (selectedRange) {
      case "today":
        startDate = endDate = today;
        break;
      case "yesterday":
        startDate = endDate = new Date(today.setDate(today.getDate() - 1));
        break;
      case "last7days":
        startDate = new Date(today.setDate(today.getDate() - 6));
        endDate = today;
        break;
      case "last30days":
        startDate = new Date(today.setDate(today.getDate() - 29));
        endDate = today;
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisMonthLastYear":
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
        endDate = new Date(today.getFullYear() - 1, today.getMonth() + 1, 0);
        break;
      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case "lastYear":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case "currentFinancialYear":
        startDate = new Date(today.getFullYear(), 3, 1);
        endDate = new Date(today.getFullYear() + 1, 2, 31);
        break;
      case "lastFinancialYear":
        startDate = new Date(today.getFullYear() - 1, 3, 1);
        endDate = new Date(today.getFullYear(), 2, 31);
        break;
      case "customRange":
        startDate = endDate = null; // Custom range handling
        break;
      default:
        startDate = endDate = null;
        break;
    }

    if (startDate && endDate) {
      setDisplayValue(`${formatDate(startDate)} - ${formatDate(endDate)}`);
    } else {
      setDisplayValue("");
    }

    setDateRange(selectedRange);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="wrapper " style={{ maxHeight: "", overflowY: "auto" }}>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0 ">List All Elements</h1>
                <span className="display-inline sub-heading ">
                  Manage ListAllElements
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="text-right">
                <Link to="/AddListAllElement" className="btn btn-add">
                  <i className="fas fa-plus"></i> Add
                </Link>
              </div>
              <div className="card-body">
                {/*  export all elements  */}
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label htmlFor="entriesPerPage" className="mb-0  mr-2">
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

                {/* List table */}
                <div id="table-container " style={{ overflowX: "auto" }}>
                <table
                    id="example1"
                    className="table    table-hover table_style shadow  "
                    style={{ minWidth: "1000px" }}
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.customField && <th>Custom Input</th>}
                       
                        {columnsVisibility.img && <th>img</th>}
                        {columnsVisibility.action && <th>Action Button</th>}
                        {columnsVisibility.action2 && <th>Action Button 2</th>}
                        {columnsVisibility.PurchaseStatus && (
                          <th>Purchase Status</th>
                        )}
                        {columnsVisibility.PaymentStatus && (
                          <th>Payment Status</th>
                        )}
                        {columnsVisibility.email && <th>Email</th>}

                      
                        {columnsVisibility.isActive && <th>Is Active</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayedListAllElements.map((ListAllElement) => (
                        <tr key={ListAllElement.id}>
                        
                          {columnsVisibility.customField && (
                            <td>Custom Field</td>
                          )}
                          {columnsVisibility.img && (
                            <td>{ListAllElement.ListAllElementName}</td>
                          )}
                          {columnsVisibility.action && (
                            <td>
                              <DropdownButton
                                id="dropdown-basic-button"
                                title="Action"
                                variant="outline-success rounded-2  fs-6 fw-semibold border-1" // Use Bootstrap's outline variant
                                className="custom-outline-dropdown p-2  "
                              >
                                <Dropdown.Item as="button">
                                  <div className="d-inline-block w-75 btn-view  justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-eye   me-3"></i>
                                    <span>View</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item as="button">
                                  <div className="d-inline-block w-75   btn-edit justify-content-center text-secondary">
                                    <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                    <span>Edit</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  // Pass the id of the product
                                >
                                  <div className="d-inline-block w-75  btn-delete justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-trash me-3"></i>
                                    <span>Delete</span>
                                  </div>
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.action2 && (
                            <td className="">
                              <Button variant="outline-primary p-0 d-flex align-items-center p-1 mt-2 ">
                                {" "}
                                <i className="fas fa-history mx-2  "></i>Action
                              </Button>{" "}
                            </td>
                          )}
                          {columnsVisibility.PurchaseStatus && (
                            <td>
                              {" "}
                              <button
                                className="btn-sm btn-success p-0 px-2 mt-3   hover border-0 "
                                data-toggle="modal"
                                data-target="#modal-default"
                              >
                                {" "}
                                received{" "}
                              </button>{" "}
                            </td>
                          )}
                          {columnsVisibility.PaymentStatus && (
                            <td>
                              <button
                                className="btn-sm btn-warning  p-0 px-2 mt-3 text-light  border-0 "
                                data-toggle="modal"
                                data-target="#modal-default"
                              >
                                {" "}
                                Due{" "}
                              </button>{" "}
                            </td>
                          )}
                          {columnsVisibility.email && (
                            <td>{ListAllElement.email}</td>
                          )}
                       
                          {columnsVisibility.isActive && (
                            <td className="checkbox-container text-center ">
                              <input
                                type="checkbox"
                                checked={ListAllElement.isActive}
                                style={{
                                  cursor: "default",
                                  accentColor: ListAllElement.isActive
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
                          <td className="text-right">
                            <div className="btn-group btn-group-sm btn-icon-only">
                              <button
                                type="button"
                                className="btn-edit"
                                onClick={() => handleEdit(ListAllElement.id)}
                              >
                                <i className="fas fa-edit btn-icon"></i> Edit
                              </button>

                              <button
                                type="button"
                                className="btn-view"
                                onClick={() => handleView(ListAllElement.id)}
                              >
                                <i className="fas fa-eye btn-icon"></i> View
                              </button>

                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDelete(ListAllElement.id)}
                              >
                                <i className="fas fa-trash btn-icon"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>


                {/* after table Footer button */}
                <div className="container my-2">
                  <div className="row">
                    <div className="col-12 col-lg-8   float-left d-flex ">
                      <div className=" mx-2 ">
                        <Button
                          className="select_btn p-lg-1"
                          variant="outline-primary"
                        >
                          Delete Selected
                        </Button>
                      </div>
                      <div className=" mx-2 ">
                        <Button
                          className="select_btn p-lg-1"
                          variant="outline-secondary"
                        >
                          Add to Location
                        </Button>
                      </div>
                      <div className=" mx-2 ">
                        <Button
                          className="select_btn p-lg-1"
                          variant="outline-success"
                        >
                          Remove From Function
                        </Button>
                      </div>
                      <div className=" mx-2 ">
                        <Button
                          className="select_btn p-lg-1"
                          variant="outline-warning"
                        >
                          Deactivate Selected
                        </Button>
                      </div>

                      <div className=" mx-2 ">
                        <Button
                          className="select_btn p-lg-1"
                          variant="outline-danger"
                        >
                          WooCommerce Sync
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* filter 1 Product start */}
        <div className="px-3 my-4">
          <label>Custom Filter</label>

          <div className="card card-default rounded-4 border-0 cardHover">
            <div className=" mx-4 my-3">
              <a
                className="btn-icon-only btn-light p-3 mb-4 fw-bold bg-transparent filter_color "
                onClick={() => setOpenProduct(!openProduct)}
                aria-controls="example-collapse-text"
                aria-expanded={openSales}
                style={{
                  transition: "background-color 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.Color = "#78b833"; // Ensure color stays green on hover
                }}
                onMouseOut={(e) => {
                  e.target.style.Color = "#78b833"; // Ensure color stays green after hover
                }}
              >
                <i className="fa fa-filter me-3"></i>
                filter
              </a>
              <Collapse in={openProduct}>
                <div id="example-collapse-text">
                  <hr />

                  <div className="card-body">
                    <div className="row py-2 g-2 ">
                      <div className="col-md-3">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline ">
                              Custom Type:
                            </label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2 "
                                id="category"
                                name="category"
                                required
                              >
                                <option value="">All</option>
                                <option value="1">A</option>
                                <option value="2">B</option>
                                <option value="3">C</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      
                      <div className="col-md-3 mt-4  ">
                        <div className="  d-flex px-5 ">
                          <input
                            className="form-check-input "
                            type="checkbox"
                          />
                          <label className="form-check-label ms-2">
                            Subscriptions
                          </label>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline ">
                              Date Range:
                            </label>

                            <div className="date-range-selector  ">
                              <input
                                type="text"
                                className="form-control rounded"
                                value={displayValue}
                                placeholder="Select Date Range"
                                readOnly
                                onClick={toggleDropdown}
                              />
                              {dropdownOpen && (
                                <ul className="date-range-dropdown">
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("today")
                                    }
                                  >
                                    Today
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("yesterday")
                                    }
                                  >
                                    Yesterday
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("last7days")
                                    }
                                  >
                                    Last 7 Days
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("last30days")
                                    }
                                  >
                                    Last 30 Days
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("thisMonth")
                                    }
                                  >
                                    This Month
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("lastMonth")
                                    }
                                  >
                                    Last Month
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("thisMonthLastYear")
                                    }
                                  >
                                    This Month Last Year
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("thisYear")
                                    }
                                  >
                                    This Year
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("lastYear")
                                    }
                                  >
                                    Last Year
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange(
                                        "currentFinancialYear"
                                      )
                                    }
                                  >
                                    Current Financial Year
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("lastFinancialYear")
                                    }
                                  >
                                    Last Financial Year
                                  </li>
                                  <li
                                    onClick={() =>
                                      handleDateRangeChange("customRange")
                                    }
                                  >
                                    Custom Range
                                  </li>
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

             
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>
          </div>
        </div>
        {/* filter 1 end  */}

    
      </div>

      {/* recevied  Button  model*/}
      <div className="modal fade" id="modal-default">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Update Status</h4>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="dropdown">
                <div className="">
                  <label className="me-2 d-md-inline">Purchase Status:</label>
                  <div className="d-flex align-items-center">
                    <select
                      className="form-select me-2 "
                      id="dropdown"
                      name="dropdown"
                      type="text"
                      required
                      value={Dropdown}
                    >
                      <option value="">Please Select</option>
                      <option value="1">Received</option>
                      <option value="2">Pending</option>
                      <option value="3">Updated</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer align-items-end">
              <button type="button" className="btn btn-default">
                Update
              </button>
              <button
                type="button"
                className="btn btn-primary"
                data-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
          {/* /.modal-content */}
        </div>
        {/* /.modal-dialog */}
      </div>
    </div>
  );
}

export default ListAllElement;

import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Collapse } from "react-bootstrap";
import { toast } from "react-toastify";

function Customer({ userRoles }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [filteredInactiveCustomers, setFilteredInactiveCustomers] = useState(
    []
  );
  const [showActiveCustomers, setShowActiveCustomers] = useState(true);
  const [columnsVisibility, setColumnsVisibility] = useState({
    franchiseId: true,
    franchiseName: true,
    name: true,
    email: true,
    mobileNumber: true,
    taxNumber: true,
    state: true,
    city: true,
    zipCode: true,
    isActive: true,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    cities: [],
    states: [],
    franchiseNames: [],
    emails: [],
    mobileNumbers: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    city: "",
    state: "",
    franchiseName: "",
    email: "",
    mobileNumber: "",
  });

  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch customers data from API
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Extract filter values when customers data changes
  useEffect(() => {
    if (customers.length > 0 || inactiveCustomers.length > 0) {
      const allCustomers = [...customers, ...inactiveCustomers];

      const cities = [...new Set(allCustomers.map((item) => item.city))].filter(
        Boolean
      );
      const states = [
        ...new Set(allCustomers.map((item) => item.state)),
      ].filter(Boolean);
      const franchiseNames = [
        ...new Set(allCustomers.map((item) => item.franchiseName)),
      ].filter(Boolean);
      const emails = [
        ...new Set(allCustomers.map((item) => item.email)),
      ].filter(Boolean);
      const mobileNumbers = [
        ...new Set(allCustomers.map((item) => item.mobileNumber)),
      ].filter(Boolean);

      setFilterValues({
        cities,
        states,
        franchiseNames,
        emails,
        mobileNumbers,
      });
    }
  }, [customers, inactiveCustomers]);

  // Apply filters whenever activeFilters, searchText, or customer lists change
  // Apply filters whenever activeFilters, searchText, or customer lists change
  useEffect(() => {
    const applyFilters = (customerList) => {
      return customerList.filter((customer) => {
        // Convert all values to strings for searching
        const franchiseIdStr = customer.franchiseId?.toString() || "";
        const franchiseNameStr = customer.franchiseName?.toString() || "";
        const firstNameStr = customer.firstName?.toString() || "";
        const lastNameStr = customer.lastName?.toString() || "";
        const emailStr = customer.email?.toString() || "";
        const mobileNumberStr = customer.mobileNumber?.toString() || "";
        const cityStr = customer.city?.toString() || "";
        const stateStr = customer.state?.toString() || "";

        // Text search across multiple fields
        const searchMatch =
          searchText === "" ||
          franchiseIdStr.toLowerCase().includes(searchText.toLowerCase()) ||
          franchiseNameStr.toLowerCase().includes(searchText.toLowerCase()) ||
          firstNameStr.toLowerCase().includes(searchText.toLowerCase()) ||
          lastNameStr.toLowerCase().includes(searchText.toLowerCase()) ||
          emailStr.toLowerCase().includes(searchText.toLowerCase()) ||
          mobileNumberStr.includes(searchText) || // No toLowerCase() for numbers
          cityStr.toLowerCase().includes(searchText.toLowerCase()) ||
          stateStr.toLowerCase().includes(searchText.toLowerCase());

        // Dropdown filters
        const cityMatch =
          activeFilters.city === "" || customer.city === activeFilters.city;
        const stateMatch =
          activeFilters.state === "" || customer.state === activeFilters.state;
        const franchiseNameMatch =
          activeFilters.franchiseName === "" ||
          customer.franchiseName === activeFilters.franchiseName;
        const emailMatch =
          activeFilters.email === "" || customer.email === activeFilters.email;
        const mobileNumberMatch =
          activeFilters.mobileNumber === "" ||
          customer.mobileNumber?.toString() === activeFilters.mobileNumber;

        return (
          searchMatch &&
          cityMatch &&
          stateMatch &&
          franchiseNameMatch &&
          emailMatch &&
          mobileNumberMatch
        );
      });
    };

    setFilteredCustomers(applyFilters(customers));
    setFilteredInactiveCustomers(applyFilters(inactiveCustomers));
  }, [activeFilters, searchText, customers, inactiveCustomers]);

  const fetchCustomers = async () => {
    try {
      const activeResponse = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/customer/getallactive`
      );
      setCustomers(activeResponse.data);
      setFilteredCustomers(activeResponse.data);

      const inactiveResponse = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/customer/getallinactive`
      );
      setInactiveCustomers(inactiveResponse.data);
      setFilteredInactiveCustomers(inactiveResponse.data);

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Search text change handler
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setActiveFilters({
      city: "",
      state: "",
      franchiseName: "",
      email: "",
      mobileNumber: "",
    });
    setSearchText("");
  };

  const handleActivate = (id) => {
    if (window.confirm("Are you sure you want to activate this franchise?")) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/customer/toggle-active/${id}?isActive=true`,
        {
          method: "PUT",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.isActive === true) {
            setInactiveCustomers((prev) =>
              prev.filter((customer) => customer.id !== id)
            );
            setCustomers((prev) => [...prev, data]);
            toast.success("Franchise activated successfully.");
            fetchCustomers();
          } else {
            toast.error("Failed to activate franchise.");
            fetchCustomers();
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          toast.error("An error occurred while activating.");
        });
    }
  };

  const handleDeactivate = (id) => {
    if (window.confirm("Are you sure you want to deactivate this franchise?")) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/customer/toggle-active/${id}?isActive=false`,
        {
          method: "PUT",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.isActive === false) {
            setCustomers((prev) =>
              prev.filter((customer) => customer.id !== id)
            );
            setInactiveCustomers((prev) => [...prev, data]);
            toast.success("Franchise deactivated successfully.");
            fetchCustomers();
          } else {
            toast.error("Failed to deactivate franchise.");
            fetchCustomers();
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          toast.error("An error occurred while deactivating.");
        });
    }
  };

  const exportCSV = () => {
    const dataToExport = showActiveCustomers
      ? filteredCustomers
      : filteredInactiveCustomers;
    const csvData = dataToExport.map((customer) => ({
      "Franchise ID": customer.franchiseId,
      "Franchise Name": customer.franchiseName,
      "First Name": customer.firstName,
      "Last Name": customer.lastName,
      Email: customer.email,
      "Mobile Number": customer.mobileNumber,
      "Tax Number": customer.taxNumber,
      State: customer.state,
      City: customer.city,
      "Zip Code": customer.zipCode,
      "Is Active": customer.isActive ? "Yes" : "No",
    }));

    const csv = [
      Object.keys(csvData[0]),
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "franchises.csv");
  };

  const exportExcel = () => {
    const dataToExport = showActiveCustomers
      ? filteredCustomers
      : filteredInactiveCustomers;
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Franchises");
    XLSX.writeFile(wb, "franchises.xlsx");
  };

  const printData = () => {
    const dataToExport = showActiveCustomers
      ? filteredCustomers
      : filteredInactiveCustomers;
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body >");

    // Create a temporary container for the filtered data
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML =
      document.getElementById("table-container").innerHTML;

    // Replace the table body with filtered data
    const tbody = tempContainer.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = dataToExport
        .map(
          (customer) => `
        <tr key="${customer.id}">
          <td class="text-center">
            <div class="dropdown">
              <button class="btn btn-outline-success rounded-5 fs-6 fw-light border-1 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Actions
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                ${
                  hasPermission("franchise.view")
                    ? `
                  <li>
                    <button class="dropdown-item">
                      <div class="d-inline-block w-75 btn-view justify-content-center text-secondary">
                        <i class="dropdown_hover fa fa-eye me-3"></i>
                        <span>View</span>
                      </div>
                    </button>
                  </li>
                `
                    : ""
                }
                ${
                  hasPermission("franchise.edit")
                    ? `
                  <li>
                    <button class="dropdown-item">
                      <div class="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                        <i class="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                        <span>Edit</span>
                      </div>
                    </button>
                  </li>
                `
                    : ""
                }
                ${
                  hasPermission("franchise.delete")
                    ? `
                  <li>
                    <button class="dropdown-item ${
                      customer.isActive ? "text-danger" : "text-success"
                    }">
                      <div class="d-inline-block w-75 btn-delete justify-content-center ${
                        customer.isActive ? "text-danger" : "text-success"
                      }">
                        <i class="fa ${
                          customer.isActive ? "fa-trash" : "fa-check-circle"
                        } me-3"></i>
                        <span>${
                          customer.isActive ? "Deactivate" : "Activate"
                        }</span>
                      </div>
                    </button>
                  </li>
                `
                    : ""
                }
              </ul>
            </div>
          </td>
          ${
            columnsVisibility.franchiseId
              ? `<td>${customer.franchiseId || ""}</td>`
              : ""
          }
          ${
            columnsVisibility.franchiseName
              ? `<td>${customer.franchiseName || ""}</td>`
              : ""
          }
          ${
            columnsVisibility.name
              ? `<td>${customer.firstName || ""} ${
                  customer.lastName || ""
                }</td>`
              : ""
          }
          ${columnsVisibility.email ? `<td>${customer.email || ""}</td>` : ""}
          ${
            columnsVisibility.mobileNumber
              ? `<td>${customer.mobileNumber || ""}</td>`
              : ""
          }
          ${
            columnsVisibility.taxNumber
              ? `<td>${customer.taxOrGstNumber || ""}</td>`
              : ""
          }
          ${columnsVisibility.state ? `<td>${customer.state || ""}</td>` : ""}
          ${columnsVisibility.city ? `<td>${customer.city || ""}</td>` : ""}
          ${
            columnsVisibility.zipCode
              ? `<td>${customer.zipCode || ""}</td>`
              : ""
          }
          ${
            columnsVisibility.isActive
              ? `
            <td class="text-center">
              <input type="checkbox" checked="${
                customer.isActive
              }" style="cursor: default; accent-color: ${
                  customer.isActive ? "#78B833" : "red"
                }; width: 20px; height: 20px;" />
            </td>
          `
              : ""
          }
        </tr>
      `
        )
        .join("");
    }

    printWindow.document.write(tempContainer.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportPDF = () => {
    const dataToExport = showActiveCustomers
      ? filteredCustomers
      : filteredInactiveCustomers;
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Franchise ID",
          "Franchise Name",
          "Name",
          "Email",
          "Mobile",
          "Tax Number",
          "State",
          "City",
          "Zip Code",
          "Status",
        ],
      ],
      body: dataToExport.map((customer) => [
        customer.franchiseId,
        customer.franchiseName,
        `${customer.firstName} ${customer.lastName}`,
        customer.email,
        customer.mobileNumber,
        customer.taxNumber,
        customer.state,
        customer.city,
        customer.zipCode,
        customer.isActive ? "Active" : "Inactive",
      ]),
    });
    doc.save("franchises.pdf");
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleEdit = (id) => {
    navigate(`/EditCustomer/${id}`);
  };

  const handleView = (id) => {
    navigate(`/ViewCustomer/${id}`);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedCustomers = (
    showActiveCustomers ? filteredCustomers : filteredInactiveCustomers
  ).slice(startIndex, endIndex);

  const hasPermission = (permission) => {
    return userRoles.some((role) =>
      role.permissions.some((p) => p.name === permission)
    );
  };

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  return (
    <div className="wrapper" style={{ maxHeight: "", overflowY: "auto" }}>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">Franchise</h1>
                <span className="display-inline sub-heading">
                  Manage Franchise
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            {/* Filter Card */}
            <div className="card card-default rounded-4 border-0 cardHover mb-3">
              <div
                className="my- p-3 d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className={`fa fa-filter me-3`}></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>Search:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search across all fields..."
                            value={searchText}
                            onChange={handleSearchChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row py-2 g-2">
                      {/* City Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">City:</label>
                          <select
                            className="form-select"
                            name="city"
                            value={activeFilters.city}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Cities</option>
                            {filterValues.cities.map((city, index) => (
                              <option key={`city-${index}`} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* State Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">State:</label>
                          <select
                            className="form-select"
                            name="state"
                            value={activeFilters.state}
                            onChange={handleFilterChange}
                          >
                            <option value="">All States</option>
                            {filterValues.states.map((state, index) => (
                              <option key={`state-${index}`} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Franchise Name Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Firm Name:</label>
                          <select
                            className="form-select"
                            name="franchiseName"
                            value={activeFilters.franchiseName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Firms</option>
                            {filterValues.franchiseNames.map(
                              (franchise, index) => (
                                <option
                                  key={`franchise-${index}`}
                                  value={franchise}
                                >
                                  {franchise}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Email Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Email:</label>
                          <select
                            className="form-select"
                            name="email"
                            value={activeFilters.email}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Emails</option>
                            {filterValues.emails.map((email, index) => (
                              <option key={`email-${index}`} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Mobile Number Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Mobile Number:</label>
                          <select
                            className="form-select"
                            name="mobileNumber"
                            value={activeFilters.mobileNumber}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Numbers</option>
                            {filterValues.mobileNumbers.map((number, index) => (
                              <option key={`number-${index}`} value={number}>
                                {number}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-3 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetFilters();
                          }}
                          disabled={
                            !Object.values(activeFilters).some(Boolean) &&
                            searchText === ""
                          }
                        >
                          <i className="fa fa-times me-1"></i> Reset All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="card cardHover rounded-4 border-0">
              <div className="text-right">
                <div className="btn-group mr-2" style={{ float: "left" }}>
                  <button
                    className={`btn ${
                      showActiveCustomers
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setShowActiveCustomers(true)}
                  >
                    Active Franchises
                  </button>
                  <button
                    className={`btn ${
                      !showActiveCustomers ? "btn-danger" : "btn-outline-danger"
                    }`}
                    onClick={() => setShowActiveCustomers(false)}
                  >
                    Inactive Franchises
                  </button>
                </div>
                {hasPermission("franchise.add") && (
                  <Link to="/AddCustomer" className="btn btn-add">
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

                <div id="table-container" style={{ overflowX: "auto" }}>
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Actions</th>
                        {columnsVisibility.franchiseId && <th>Franchise ID</th>}
                        {columnsVisibility.franchiseName && (
                          <th>Franchise Name</th>
                        )}
                        {/* {columnsVisibility.name && <th>Franchise Name</th>} */}
                        {columnsVisibility.email && <th>Email</th>}
                        {columnsVisibility.mobileNumber && (
                          <th>Contact Number</th>
                        )}
                        {columnsVisibility.taxNumber && <th>Tax Number</th>}
                        {columnsVisibility.state && <th>State</th>}
                        {columnsVisibility.city && <th>City</th>}
                        {columnsVisibility.zipCode && <th>Zip Code</th>}
                        {columnsVisibility.isActive && <th>Is Active</th>}
                      </tr>
                    </thead>

                    {hasPermission(
                      "franchise.view" || "franchise.edit" || "franchise.delete"
                    ) && (
                      <tbody>
                        {displayedCustomers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="text-center">
                              <div className="dropdown">
                                <button
                                  className="btn btn-outline-success rounded-5 fs-6 fw-light border-1 dropdown-toggle"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                >
                                  Actions
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {hasPermission("franchise.view") && (
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => handleView(customer.id)}
                                      >
                                        <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                          <i className="dropdown_hover fa fa-eye me-3"></i>
                                          <span>View</span>
                                        </div>
                                      </button>
                                    </li>
                                  )}

                                  {hasPermission("franchise.edit") && (
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => handleEdit(customer.id)}
                                      >
                                        <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                          <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                          <span>Edit</span>
                                        </div>
                                      </button>
                                    </li>
                                  )}

                                  {hasPermission("franchise.delete") && (
                                    <li>
                                      <button
                                        className={`dropdown-item ${
                                          customer.isActive
                                            ? "text-danger"
                                            : "text-success"
                                        }`}
                                        onClick={() =>
                                          customer.isActive
                                            ? handleDeactivate(customer.id)
                                            : handleActivate(customer.id)
                                        }
                                      >
                                        <div
                                          className={`d-inline-block w-75 btn-delete justify-content-center ${
                                            customer.isActive
                                              ? "text-danger"
                                              : "text-success"
                                          }`}
                                        >
                                          <i
                                            className={`fa ${
                                              customer.isActive
                                                ? "fa-trash"
                                                : "fa-check-circle"
                                            } me-3`}
                                          ></i>
                                          <span>
                                            {customer.isActive
                                              ? "Deactivate"
                                              : "Activate"}
                                          </span>
                                        </div>
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </td>
                            {columnsVisibility.franchiseId && (
                              <td>{customer.franchiseId}</td>
                            )}
                            {columnsVisibility.franchiseName && (
                              <td>{customer.franchiseName}</td>
                            )}
                            {/* {columnsVisibility.name && (
                              <td>
                                {customer.firstName} {customer.lastName}
                              </td>
                            )} */}
                            {columnsVisibility.email && (
                              <td>{customer.email}</td>
                            )}
                            {columnsVisibility.mobileNumber && (
                              <td>{customer.mobileNumber}</td>
                            )}
                            {columnsVisibility.taxNumber && (
                              <td>{customer.taxOrGstNumber}</td>
                            )}
                            {columnsVisibility.state && (
                              <td>{customer.state}</td>
                            )}
                            {columnsVisibility.city && <td>{customer.city}</td>}
                            {columnsVisibility.zipCode && (
                              <td>{customer.zipCode}</td>
                            )}
                            {columnsVisibility.isActive && (
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  checked={customer.isActive}
                                  style={{
                                    cursor: "default",
                                    accentColor: customer.isActive
                                      ? "#78B833"
                                      : "red",
                                    width: "20px",
                                    height: "20px",
                                  }}
                                />
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
    </div>
  );
}

export default Customer;

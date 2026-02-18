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

function Vendor({ userRoles }) {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [showActiveVendors, setShowActiveVendors] = useState(true);
  const [columnsVisibility, setColumnsVisibility] = useState({
    firmName: true,
    vendorId: true,
    email: true,
    name: true,
    mobileNumber: true,
    address: true,
    city: true,
    state: true,
    country: true,
    taxNumber: true,
    zipCode: true,
    isActive: true,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [inactiveVendors, setInactiveVendors] = useState([]);
  const [filteredInactiveVendors, setFilteredInactiveVendors] = useState([]);
  const navigate = useNavigate();

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    cities: [],
    states: [],
    firmNames: [],
    emails: [],
    mobileNumbers: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    city: "",
    state: "",
    firmName: "",
    email: "",
    mobileNumber: "",
  });

  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch vendors data from API
  useEffect(() => {
    fetchVendors();
  }, []);

  // Extract filter values when vendors data changes
  useEffect(() => {
    if (vendors.length > 0 || inactiveVendors.length > 0) {
      const allVendors = [...vendors, ...inactiveVendors];

      const cities = [...new Set(allVendors.map((item) => item.city))].filter(
        Boolean
      );
      const states = [...new Set(allVendors.map((item) => item.state))].filter(
        Boolean
      );
      const firmNames = [
        ...new Set(allVendors.map((item) => item.firmName)),
      ].filter(Boolean);
      const emails = [...new Set(allVendors.map((item) => item.email))].filter(
        Boolean
      );
      const mobileNumbers = [
        ...new Set(allVendors.map((item) => item.mobileNumber)),
      ].filter(Boolean);

      setFilterValues({
        cities,
        states,
        firmNames,
        emails,
        mobileNumbers,
      });
    }
  }, [vendors, inactiveVendors]);

  // Apply filters whenever activeFilters, searchText, or vendor lists change
  useEffect(() => {
    const applyFilters = (vendorList) => {
      return vendorList.filter((vendor) => {
        // Convert all values to strings for searching
        const vendorIdStr = vendor.vendorId?.toString() || "";
        const firmNameStr = vendor.firmName?.toString() || "";
        const firstNameStr = vendor.firstname?.toString() || "";
        const lastNameStr = vendor.lastname?.toString() || "";
        const emailStr = vendor.email?.toString() || "";
        const mobileNumberStr = vendor.mobileNumber?.toString() || "";
        const cityStr = vendor.city?.toString() || "";
        const stateStr = vendor.state?.toString() || "";

        // Text search across multiple fields
        const searchMatch =
          searchText === "" ||
          vendorIdStr.toLowerCase().includes(searchText.toLowerCase()) ||
          firmNameStr.toLowerCase().includes(searchText.toLowerCase()) ||
          firstNameStr.toLowerCase().includes(searchText.toLowerCase()) ||
          lastNameStr.toLowerCase().includes(searchText.toLowerCase()) ||
          emailStr.toLowerCase().includes(searchText.toLowerCase()) ||
          mobileNumberStr.includes(searchText) || // No toLowerCase() for numbers
          cityStr.toLowerCase().includes(searchText.toLowerCase()) ||
          stateStr.toLowerCase().includes(searchText.toLowerCase());

        // Dropdown filters
        const cityMatch =
          activeFilters.city === "" || vendor.city === activeFilters.city;
        const stateMatch =
          activeFilters.state === "" || vendor.state === activeFilters.state;
        const firmNameMatch =
          activeFilters.firmName === "" ||
          vendor.firmName === activeFilters.firmName;
        const emailMatch =
          activeFilters.email === "" || vendor.email === activeFilters.email;
        const mobileNumberMatch =
          activeFilters.mobileNumber === "" ||
          vendor.mobileNumber?.toString() === activeFilters.mobileNumber;

        return (
          searchMatch &&
          cityMatch &&
          stateMatch &&
          firmNameMatch &&
          emailMatch &&
          mobileNumberMatch
        );
      });
    };

    setFilteredVendors(applyFilters(vendors));
    setFilteredInactiveVendors(applyFilters(inactiveVendors));
  }, [activeFilters, searchText, vendors, inactiveVendors]);

  const fetchVendors = async () => {
    try {
      const activeResponse = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/vendor/getallactive`
      );
      setVendors(activeResponse.data);
      setFilteredVendors(activeResponse.data);

      const inactiveResponse = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/vendor/getallinactive`
      );
      setInactiveVendors(inactiveResponse.data);
      setFilteredInactiveVendors(inactiveResponse.data);

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } catch (error) {
      console.error("Error fetching vendors:", error);
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
      firmName: "",
      email: "",
      mobileNumber: "",
    });
    setSearchText("");
  };

  const handleActivate = (id) => {
    if (window.confirm("Are you sure you want to activate this vendor?")) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/vendor/toggle-active/${id}?isActive=true`,
        {
          method: "PUT",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.isActive === true) {
            setInactiveVendors((prev) =>
              prev.filter((vendor) => vendor.id !== id)
            );
            setVendors((prev) => [...prev, data]);
            toast.success("Vendor activated successfully.");
            fetchVendors();
          } else {
            toast.error("Failed to activate vendor.");
          }
        })
        .catch((err) => {
          // console.error("Error:", err);
          toast.error("An error occurred while activating.");
        });
    }
  };

  const handleDeactivate = (id) => {
    if (window.confirm("Are you sure you want to deactivate this vendor?")) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/vendor/toggle-active/${id}?isActive=false`,
        {
          method: "PUT",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.isActive === false) {
            setVendors((prev) => prev.filter((vendor) => vendor.id !== id));
            setInactiveVendors((prev) => [...prev, data]);
            alert("Vendor deactivated successfully.");
            fetchVendors();
          } else {
            alert("Failed to deactivate vendor.");
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("An error occurred while deactivating.");
        });
    }
  };

  const exportCSV = () => {
    const dataToExport = showActiveVendors
      ? filteredVendors
      : filteredInactiveVendors;

    const csvData = dataToExport.map((vendor) => ({
      FirmName: vendor.firmName,
      "Vendor Id": vendor.vendorId,
      Email: vendor.email,
      "Mobile Number": vendor.mobileNumber,
      Address: vendor.permanentAddress,
      City: vendor.city,
      State: vendor.state,
      Country: vendor.country,
      "Tax Number": vendor.taxNumber,
      "Zip Code": vendor.zipCode,
      "Is Active": vendor.isActive ? "Yes" : "No",
    }));

    const csv = [
      [
        "Firm Name",
        "Authority Person",
        "Email",
        "Mobile Number",
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
    saveAs(blob, "vendors.csv");
  };

  const exportExcel = () => {
    const dataToExport = showActiveVendors
      ? filteredVendors
      : filteredInactiveVendors;
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "vendors.xlsx");
  };

  const printData = () => {
    const dataToExport = showActiveVendors
      ? filteredVendors
      : filteredInactiveVendors;
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
          (vendor) => `
        <tr key="${vendor.id}">
          <td class="text-center">
            <div class="dropdown">
              <button class="btn btn-outline-success rounded-5 fs-6 fw-light border-1 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Actions
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                ${hasPermission("vendor.view")
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
                ${hasPermission("vendor.edit")
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
                ${hasPermission("vendor.delete")
              ? `
                  <li>
                    <button class="dropdown-item ${vendor.isActive ? "text-danger" : "text-success"
              }">
                      <div class="d-inline-block w-75 btn-delete justify-content-center ${vendor.isActive ? "text-danger" : "text-success"
              }">
                        <i class="fa ${vendor.isActive ? "fa-trash" : "fa-check-circle"
              } me-3"></i>
                        <span>${vendor.isActive ? "Deactivate" : "Activate"
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
          ${columnsVisibility.vendorId
              ? `<td>${vendor.vendorId || ""}</td>`
              : ""
            }
          ${columnsVisibility.firmName
              ? `<td>${vendor.firmName || ""}</td>`
              : ""
            }
          ${columnsVisibility.name
              ? `<td>${vendor.firstname || ""} ${vendor.lastname || ""}</td>`
              : ""
            }
          ${columnsVisibility.email ? `<td>${vendor.email || ""}</td>` : ""}
          ${columnsVisibility.mobileNumber
              ? `<td>${vendor.mobileNumber || ""}</td>`
              : ""
            }
          ${columnsVisibility.taxNumber
              ? `<td>${vendor.taxOrGstNumber || ""}</td>`
              : ""
            }
          ${columnsVisibility.city ? `<td>${vendor.city || ""}</td>` : ""}
          ${columnsVisibility.state ? `<td>${vendor.state || ""}</td>` : ""}
          ${columnsVisibility.zipCode ? `<td>${vendor.zipCode || ""}</td>` : ""}
          ${columnsVisibility.isActive
              ? `
            <td class="text-center">
              <input type="checkbox" checked="${vendor.isActive
              }" style="cursor: default; accent-color: ${vendor.isActive ? "#78B833" : "red"
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
    const dataToExport = showActiveVendors
      ? filteredVendors
      : filteredInactiveVendors;
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Firm Name",
          "Authority Person",
          "Email",
          "Mobile Number",
          "Address",
          "City",
          "State",
          "Country",
          "Tax Number",
          "Zip Code",
          "Is Active",
        ],
      ],
      body: dataToExport.map((vendor) => [
        vendor.firmName,
        `${vendor.firstname} ${vendor.lastname}`,
        vendor.email,
        vendor.mobileNumber,
        vendor.permanentAddress,
        vendor.city,
        vendor.state,
        vendor.country,
        vendor.taxOrGstNumber,
        vendor.zipCode,
        vendor.isActive ? "Yes" : "No",
      ]),
    });
    doc.save("vendors.pdf");
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleEdit = (id) => {
    navigate(`/EditVendor/${id}`);
  };

  const handleView = (id) => {
    navigate(`/ViewVendor/${id}`);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedVendors = (
    showActiveVendors ? filteredVendors : filteredInactiveVendors
  ).slice(startIndex, endIndex);

  const hasPermission = (permission) => {
    return true; // Temporarily bypassed
    /*
    return userRoles.some((role) =>
      role.permissions.some((p) => p.name === permission)
    );
    */
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
                <h1 className="all-heading m-0">Vendors</h1>
                <span className="display-inline sub-heading">
                  Manage Vendors
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

                      {/* Firm Name Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Firm Name:</label>
                          <select
                            className="form-select"
                            name="firmName"
                            value={activeFilters.firmName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Firms</option>
                            {filterValues.firmNames.map((firm, index) => (
                              <option key={`firm-${index}`} value={firm}>
                                {firm}
                              </option>
                            ))}
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
                    className={`btn ${showActiveVendors ? "btn-primary" : "btn-outline-primary"
                      }`}
                    onClick={() => setShowActiveVendors(true)}
                  >
                    Active Vendors
                  </button>
                  <button
                    className={`btn ${!showActiveVendors ? "btn-danger" : "btn-outline-danger"
                      }`}
                    onClick={() => setShowActiveVendors(false)}
                  >
                    Inactive Vendors
                  </button>
                </div>
                {hasPermission("vendor.add") && (
                  <Link to="/AddVendor" className="btn btn-add">
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
                  <table
                    id="example1"
                    className="table table-bordered table-hover"
                  >
                    <thead>
                      <tr>
                        <th>Actions</th>
                        {columnsVisibility.vendorId && <th>Vendor ID</th>}
                        {columnsVisibility.firmName && <th>Firm Name</th>}
                        {columnsVisibility.name && <th>Vendor Name</th>}
                        {columnsVisibility.email && <th>Email</th>}
                        {columnsVisibility.mobileNumber && (
                          <th>Contact Number</th>
                        )}
                        {columnsVisibility.taxNumber && <th>GST Number</th>}
                        {columnsVisibility.state && <th>State</th>}
                        {columnsVisibility.city && <th>City</th>}
                        {columnsVisibility.zipCode && <th>Zip Code</th>}
                        {columnsVisibility.isActive && <th>Is Active</th>}
                      </tr>
                    </thead>

                    {(hasPermission("vendor.view") ||
                      hasPermission("vendor.edit") ||
                      hasPermission("vendor.delete")) && (
                        <tbody>
                          {displayedVendors.map((vendor) => (
                            <tr key={vendor.id}>
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
                                    {hasPermission("vendor.view") && (
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          onClick={() => handleView(vendor.id)}
                                        >
                                          <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                            <i className="dropdown_hover fa fa-eye me-3"></i>
                                            <span>View</span>
                                          </div>
                                        </button>
                                      </li>
                                    )}

                                    {hasPermission("vendor.edit") && (
                                      <li>
                                        <button
                                          className="dropdown-item"
                                          onClick={() => handleEdit(vendor.id)}
                                        >
                                          <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                            <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                            <span>Edit</span>
                                          </div>
                                        </button>
                                      </li>
                                    )}

                                    {hasPermission("vendor.delete") && (
                                      <li>
                                        <button
                                          className={`dropdown-item ${vendor.isActive
                                              ? "text-danger"
                                              : "text-success"
                                            }`}
                                          onClick={() =>
                                            vendor.isActive
                                              ? handleDeactivate(vendor.id)
                                              : handleActivate(vendor.id)
                                          }
                                        >
                                          <div
                                            className={`d-inline-block w-75 btn-delete justify-content-center ${vendor.isActive
                                                ? "text-danger"
                                                : "text-success"
                                              }`}
                                          >
                                            <i
                                              className={`fa ${vendor.isActive
                                                  ? "fa-trash"
                                                  : "fa-check-circle"
                                                } me-3`}
                                            ></i>
                                            <span>
                                              {vendor.isActive
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
                              {columnsVisibility.vendorId && (
                                <td>{vendor.vendorId}</td>
                              )}
                              {columnsVisibility.firmName && (
                                <td>{vendor.firmName}</td>
                              )}
                              {columnsVisibility.name && (
                                <td>
                                  {vendor.firstname}&nbsp;{vendor.lastname}
                                </td>
                              )}

                              {columnsVisibility.email && <td>{vendor.email}</td>}
                              {columnsVisibility.mobileNumber && (
                                <td>{vendor.mobileNumber}</td>
                              )}
                              {columnsVisibility.taxNumber && (
                                <td>{vendor.taxOrGstNumber}</td>
                              )}
                              {columnsVisibility.city && <td>{vendor.city}</td>}
                              {columnsVisibility.state && <td>{vendor.state}</td>}

                              {columnsVisibility.zipCode && (
                                <td>{vendor.zipCode}</td>
                              )}
                              {columnsVisibility.isActive && (
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    checked={vendor.isActive}
                                    style={{
                                      cursor: "default",
                                      accentColor: vendor.isActive
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

export default Vendor;

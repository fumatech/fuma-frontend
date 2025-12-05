import React, { useState, useEffect } from "react";


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faShoppingCart,
  faCalendar,
  faTag,
  faTh,
} from "@fortawesome/free-solid-svg-icons";
import InputTaxPurchase from "./InputTaxPurchase";
import OutputTaxSales from "./OutputTaxSales";
import ExpenseTax from "./ExpenseTax";
import { Link } from "react-router-dom";

const tabsData = [
  {
    id: "InputTaxPurchase",
    label: "Input Tax Purchase",
    icon: faList,
    component: <InputTaxPurchase />,
  },
  {
    id: "OutputTaxSales",
    label: "Output Tax Sales",
    icon: faShoppingCart,
    component: <OutputTaxSales />,
  },
  {
    id: "ExpenseTax",
    label: "Expense Tax ",
    icon: faTag,
    component: <ExpenseTax />,
  },
];





const TaxReport = () => {
  const [activeTab, setActiveTab] = useState("InputTaxPurchase");
  const [displayValue, setDisplayValue] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-12 col-md-6">
                  <h1 className=" all-heading">Tax Report</h1>
                </div>
              </div>
            </div>
          </section>

          <div className="col-12">
          <div className="card card-primary card-outline card-outline-tabs">
            <div className="p-0 border-bottom-0">
              <ul className="nav nav-tabs" role="tablist">
                {tabsData.map(({ id, label, icon }) => (
                  <li className="nav-item" key={id}>
                    <Link
                      to="#"
                      className={`nav-link ${activeTab === id ? "active" : ""}`}
                      onClick={() => setActiveTab(id)}
                      role="tab"
                      aria-controls={`product-sell-report-${id}`}
                      aria-selected={activeTab === id}
                      style={{
                        padding: "10px 15px",
                        borderTop:
                          activeTab === id ? "3px solid #007bff" : "none",
                        fontWeight: activeTab === id ? "bold" : "normal",
                        color: activeTab === id ? "#007bff" : "#000",
                        transition: "border-top 0.3s ease, color 0.3s ease",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={icon}
                        style={{ marginRight: "5px" }}
                      />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body">
              <div className="tab-content" id="product-sell-report-tabContent">
                {tabsData.map(({ id, component }) => (
                  <div
                    className={`tab-pane fade ${
                      activeTab === id ? "active show" : ""
                    }`}
                    id={`product-sell-report-${id}`}
                    aria-labelledby={`product-sell-report-${id}-tab`}
                    key={id}
                  >
                    {activeTab === id && component}{" "}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
          {/* filter 1 Product start */}
          {/* <div className="px-3 my-4">
          <label>Custom Filter</label>

          <div className="card card-default rounded-4 border-0 cardHover">
            <div className=" mx-4 my-3">
              <a
                className="btn-icon-only btn-light p-3 mb-4 fw-bold bg-transparent filter_color "
                onClick={() => setopenTaxReport(!openTaxReport)}
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
              <Collapse in={openTaxReport}>
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
        </div> */}
          {/* filter 1 end  */}
        </div>
      </div>
    </>
  );
};

export default TaxReport;

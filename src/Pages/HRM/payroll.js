import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AllPayrolls from "./AllPayrolls";
import AllPayrollGroups from "./AllPayrollGroups";
import PayComponents from "./PayComponents";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faSquare,
  faSquareCheck,
  faUserCheck,
  faUserClock,
} from "@fortawesome/free-solid-svg-icons";
const tabsData = [
  {
    id: "AllPayrolls",
    label: "AllPayrolls",
    icon: faUserClock,
    component: <AllPayrolls />,
  },
  {
    id: "AllPayrollGroups",
    label: "AllPayrollGroups",
    icon: faSquareCheck,
    component: <AllPayrollGroups />,
  },
  {
    id: "PayComponents ",
    label: "PayComponents ",
    icon: faUserCheck,
    component: <PayComponents />,
  },
];

const Payroll = () => {
  const [activeTab, setActiveTab] = useState("AllPayrolls");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <div className="wrapper">
        <div >
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-12 col-md-6">
                  <h1 className=" all-heading">Payrolls</h1>
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
                        className={`nav-link ${
                          activeTab === id ? "active" : ""
                        }`}
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
                <div
                  className="tab-content"
                  id="product-sell-report-tabContent"
                >
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
        </div>
      </div>
    </>
  );
};

export default Payroll;

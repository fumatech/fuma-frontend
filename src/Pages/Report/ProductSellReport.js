import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faShoppingCart,
  faCalendar,
  faTag,
  faTh,
} from "@fortawesome/free-solid-svg-icons";
import ByBrand from "./ByBrand";
import ByCategory from "./ByCategory";
import DetailedPurchase from "./DetailedPurchase";
import GroupedDate from "./GroupedDate";
import Detailed from "./Detailed";

const tabsData = [
  { id: "detailed", label: "Detailed", icon: faList, component: <Detailed /> },
  {
    id: "detailedPurchase",
    label: "Detailed (with Purchase)",
    icon: faShoppingCart,
    component: <DetailedPurchase />,
  },
  {
    id: "groupedDate",
    label: "Grouped (by date)",
    icon: faCalendar,
    component: <GroupedDate />,
  },
  {
    id: "byCategory",
    label: "By Category",
    icon: faTag,
    component: <ByCategory />,
  },
  { id: "byBrand", label: "By Brand", icon: faTh, component: <ByBrand /> },
];

const ProductSellReport = () => {
  const [activeTab, setActiveTab] = useState("detailed");

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1>Product Sell Report</h1>
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
      </div>
    </div>
  );
};

export default ProductSellReport;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Shifts from "./Shifts";
import AllAttendance from "./AllAttendance";
import AttendanceShift from "./AttendanceShift";
import AttendanceDate from "./AttendanceDate";
import ClockInOut from "./ClockInOut";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faCalendar,
  faSquareCheck,
  faUserCheck,
  faUserClock,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

const tabsData = [
  {
    id: "Shifts",
    label: "Shifts",
    icon: faUserClock,
    component: <Shifts />,
  },
  {
    id: "AllAttendance",
    label: "AllAttendance",
    icon: faSquareCheck,
    component: <AllAttendance />,
  },
  {
    id: "AttendanceShift",
    label: "AttendanceShift",
    icon: faUserCheck,
    component: <AttendanceShift />,
  },
  {
    id: "AttendanceDate",
    label: "AttendanceDate",
    icon: faCalendar,
    component: <AttendanceDate />,
  },
];

const Attendance = () => {
  const [activeTab, setActiveTab] = useState("Shifts");
  const [showClockInModal, setShowClockInModal] = useState(false);

  // ✅ FIX: Proper modal behavior
  useEffect(() => {
    if (showClockInModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => document.body.classList.remove("modal-open");
  }, [showClockInModal]);

  return (
    <>
      <div className="wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2 align-items-center">
              {/* Attendance heading */}
              <div className="col-4">
                <h1 className="all-heading m-0">Attendance</h1>
              </div>

              {/* Clock In button (centered, same level) */}
              <div className="col-4 d-flex justify-content-center">
                <button
                  className="btn btn-info btn-lg rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{ width: "80px", height: "80px" }}
                  onClick={() => setShowClockInModal(true)}
                >
                  <FontAwesomeIcon icon={faClock} size="2x" />
                </button>
              </div>

              <div className="col-4"></div>
            </div>
          </div>
        </section>

        <div className="col-12">
          <div className="card card-primary card-outline card-outline-tabs">
            <div className="p-0 border-bottom-0">
              {/* Tabs */}
              <ul className="nav nav-tabs" role="tablist">
                {tabsData.map(({ id, label, icon }) => (
                  <li className="nav-item" key={id}>
                    <Link
                      to="#"
                      className={`nav-link ${activeTab === id ? "active" : ""}`}
                      onClick={() => setActiveTab(id)}
                      role="tab"
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

            {/* Tab content */}
            <div className="card-body">
              <div className="tab-content">
                {tabsData.map(({ id, component }) => (
                  <div
                    key={id}
                    className={`tab-pane fade ${
                      activeTab === id ? "active show" : ""
                    }`}
                  >
                    {activeTab === id && component}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clock In Modal */}
      {showClockInModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faClock} className="mr-2" />
                    Clock In
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowClockInModal(false)}
                  >
                    <span>&times;</span>
                  </button>
                </div>

                <div className="modal-body">
                  <ClockInOut onClose={() => setShowClockInModal(false)} />
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1050 }}
            onClick={() => setShowClockInModal(false)}
          />
        </>
      )}
    </>
  );
};

export default Attendance;

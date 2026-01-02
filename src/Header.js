import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import {
  faVolumeMute,
  faDownload,
  faPlus,
  faCalculator,
  faTh,
  faMoneyBill,
  faBell,
  faUserCircle,
  faUser,
  faSignOutAlt,
  faTimes,
  faCalendarAlt,
  faTasks,
  faCompass,
} from "@fortawesome/free-solid-svg-icons";

const Calculator = ({ onClose, buttonRef }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const navigate = useNavigate();

  const calculateResult = () => {
    try {
      // Replace × with * and ÷ with / for proper evaluation
      const sanitizedInput = input
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/%/g, "*0.01*");

      // Use Function constructor instead of eval for safer evaluation
      const calculation = new Function("return " + sanitizedInput)();
      setResult(calculation.toString());
    } catch (error) {
      setResult("Error");
    }
  };

  const handleButtonClick = (value) => {
    if (value === "=") {
      calculateResult();
    } else if (value === "AC") {
      setInput("");
      setResult("");
    } else if (value === "CE") {
      setInput(input.slice(0, -1));
    } else if (value === "%") {
      setInput(input + "%");
    } else {
      setInput(input + value);
    }
  };

  const buttons = [
    "AC",
    "CE",
    "%",
    "÷",
    "7",
    "8",
    "9",
    "×",
    "4",
    "5",
    "6",
    "-",
    "1",
    "2",
    "3",
    "+",
    "0",
    ".",
    "=",
  ];

  const buttonRect = buttonRef.current?.getBoundingClientRect();
  const topPosition = buttonRect ? buttonRect.bottom + 5 : 0;
  const leftPosition = buttonRect ? buttonRect.left - 85 : 0;

  return (
    <div
      style={{
        position: "fixed",
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        backgroundColor: "#f8f9fa",
        borderRadius: "6px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
        padding: "12px",
        zIndex: 1000,
        width: "240px",
        border: "1px solid #dee2e6",
        fontSize: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          borderBottom: "1px solid #dee2e6",
          paddingBottom: "8px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "600",
            color: "#495057",
          }}
        >
          Calculator
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            color: "#6c757d",
            padding: "0",
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "8px",
          borderRadius: "4px",
          marginBottom: "12px",
          textAlign: "right",
          minHeight: "36px",
          border: "1px solid #ced4da",
          fontSize: "16px",
          color: "#495057",
        }}
      >
        {input || "0"}
      </div>

      {result && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "8px",
            borderRadius: "4px",
            marginBottom: "12px",
            textAlign: "right",
            minHeight: "24px",
            fontSize: "14px",
            color: "#6c757d",
          }}
        >
          = {result}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "6px",
        }}
      >
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleButtonClick(btn)}
            style={{
              padding: "8px 0",
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid #dee2e6",
              backgroundColor:
                btn === "="
                  ? "#007bff"
                  : ["AC", "CE", "%", "÷"].includes(btn)
                  ? "#e9ecef"
                  : "#ffffff",
              color: btn === "=" ? "#ffffff" : "#212529",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: ["AC", "CE", "%", "÷"].includes(btn) ? "500" : "400",
              gridColumn: btn === "0" ? "span 2" : "span 1",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                btn === "=" ? "#0069d9" : "#e9ecef";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                btn === "="
                  ? "#007bff"
                  : ["AC", "CE", "%", "÷"].includes(btn)
                  ? "#e9ecef"
                  : "#ffffff";
            }}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

const ClockInModal = ({ onClose, buttonRef }) => {
  const [note, setNote] = useState("");
  const buttonRect = buttonRef.current?.getBoundingClientRect();

  return (
    <div
      style={{
        position: "fixed",
        top: buttonRect ? `${buttonRect.bottom + 5}px` : 0,
        left: buttonRect ? `${buttonRect.left}px` : 0,
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "280px",
        padding: "15px",
        zIndex: 1000,
        border: "1px solid #ddd",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
          Clock In
        </h3>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div style={{ marginBottom: "15px", fontSize: "14px" }}>
        IP Address: 2401:4900:881c:77af:f2:efeb:9f62:5900
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}
        >
          Clock in note:
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            minHeight: "80px",
          }}
          placeholder="Clock in note"
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={onClose}
          style={{
            padding: "6px 12px",
            backgroundColor: "#f0f0f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
        <button
          onClick={() => {
            // Handle submit logic here
            onClose();
          }}
          style={{
            padding: "6px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const calculatorButtonRef = useRef(null);
  const downloadButtonRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = sessionStorage.getItem("userEmail");
        if (email) {
          // Call the endpoint that returns the full user object
          const response = await axios.get(
            `${process.env.REACT_APP_BASE_URL}/user/email/${email}`
          );

          if (response.data) {
            // Set the firstname from the user object
            setUserFirstName(response.data.firstname);

            // Store the full user data in session storage for profile page
            sessionStorage.setItem(
              "userProfileData",
              JSON.stringify(response.data)
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback to the username endpoint if the email endpoint fails
        try {
          const email = sessionStorage.getItem("userEmail");
          if (email) {
            const usernameResponse = await axios.get(
              `${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`
            );
            if (usernameResponse.data) {
              setUserFirstName(usernameResponse.data);
            }
          }
        } catch (fallbackError) {
          console.error("Error fetching username:", fallbackError);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_BASE_URL}/user/logout`);
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userProfileData");
      navigate("/", { replace: true });
      window.location.reload();
    } catch (error) {
      // console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    // Close other modals when opening a dropdown
    setShowClockInModal(false);
  };

  const toggleCalculator = () => {
    setActiveDropdown(activeDropdown === "calculator" ? null : "calculator");
    setShowClockInModal(false);
  };

  const toggleClockInModal = () => {
    setShowClockInModal((prev) => !prev);
    // Close other dropdowns when opening the modal
    setActiveDropdown(null);
  };

  const currentDate = new Date().toLocaleDateString("en-US");

  const navItemStyle = {
    backgroundColor: "#003cb3",
    padding: "6px 12px",
    borderRadius: "8px",
    marginLeft: "8px",
    display: "flex",
    alignItems: "center",
    color: "#fff",
    fontWeight: "500",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "all 0.3s ease",
    height: "32px",
    boxSizing: "border-box",
  };

  const navItemHover = {
    backgroundColor: "#0050d0",
  };

  const iconStyle = {
    marginRight: "6px",
    fontSize: "14px",
  };

  const handleMouseEnter = (e) => {
    Object.assign(e.currentTarget.style, navItemHover);
  };

  const handleMouseLeave = (e) => {
    Object.assign(e.currentTarget.style, { backgroundColor: "#003cb3" });
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Close the dropdown if clicked outside
        setActiveDropdown(null);
      }
    };

    // Attach listener when dropdown is active
    if (activeDropdown === "admin") {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);
  return (
    <>
      <nav
        style={{
          backgroundColor: "#003cb3",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        className="main-header navbar navbar-expand"
      >
        {/* Left side item */}
        <ul className="navbar-nav">
          <li className="nav-item">
            <a className="nav-link" data-widget="pushmenu" href="#">
              <i className="fas fa-bars text-light" />
            </a>
          </li>
        </ul>

        {/* Center-aligned nav items */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Download Icon */}
          <div
            ref={downloadButtonRef}
            style={navItemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={toggleClockInModal}
          >
            <FontAwesomeIcon
              icon={faDownload}
              style={{ marginRight: "6px", fontSize: "14px" }}
            />
          </div>

          {/* Plus Dropdown */}
          <div
            style={{ ...navItemStyle, position: "relative" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => toggleDropdown("more")}
          >
            <FontAwesomeIcon
              icon={faPlus}
              style={{ marginRight: "6px", fontSize: "14px" }}
            />
            {activeDropdown === "more" && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  padding: "15px",
                  width: "200px",
                  zIndex: 999,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "6px",
                  }}
                  className="text-dark"
                >
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    style={{ marginRight: "10px" }}
                  />
                  Calendar
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "6px",
                  }}
                  className="text-dark"
                >
                  <FontAwesomeIcon
                    icon={faTasks}
                    style={{ marginRight: "10px" }}
                  />
                  Add To-Do
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  className="text-dark"
                >
                  <FontAwesomeIcon
                    icon={faCompass}
                    style={{ marginRight: "10px" }}
                  />
                  Application Tour
                </div>
              </div>
            )}
          </div>

          {/* Calculator Icon */}
          <div
            ref={calculatorButtonRef}
            style={navItemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={toggleCalculator}
          >
            <FontAwesomeIcon
              icon={faCalculator}
              style={{ marginRight: "6px", fontSize: "14px" }}
            />
          </div>

          {/* POS Icon */}
          <div
            style={navItemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => navigate("/PosInterface")}
          >
            <FontAwesomeIcon
              icon={faTh}
              style={{ marginRight: "6px", fontSize: "14px" }}
            />
            <span style={{ marginLeft: "6px" }}>POS</span>
          </div>

          {/* Money Bill Icon */}
          <div
            style={navItemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon
              icon={faMoneyBill}
              style={{ marginRight: "6px", fontSize: "14px" }}
            />
          </div>

          {/* Current Date */}
          <div
            style={navItemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {currentDate}
          </div>

          {/* Bell Icon */}
          <div
            style={navItemStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon
              icon={faBell}
              style={{ marginRight: "6px", fontSize: "14px" }}
            />
          </div>

          {/* Admin Dropdown */}
          <div
            ref={dropdownRef}
            style={{ ...navItemStyle, position: "relative" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => toggleDropdown("admin")}
          >
            {userFirstName || "Admin"}&nbsp;
            <FontAwesomeIcon icon={faUserCircle} />
            {activeDropdown === "admin" && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  padding: "15px",
                  width: "180px",
                  zIndex: 999,
                }}
              >
                <div
                  style={{ marginBottom: "10px", fontSize: "14px" }}
                  className="text-dark"
                >
                  Signed in as <br />
                  <span style={{ fontWeight: "bold" }}>
                    {userFirstName || "Admin"}
                  </span>
                </div>
                <div
                  onClick={() => navigate("/Profile")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "#333",
                    marginBottom: "6px",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    style={{ marginRight: "10px" }}
                  />
                  Profile
                </div>
                <div
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "#e74c3c",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faSignOutAlt}
                    style={{ marginRight: "10px" }}
                  />
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {activeDropdown === "calculator" && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999, // bump this up!
            }}
            onClick={toggleCalculator}
          />
          <div style={{ position: "fixed", zIndex: 10000 }}>
            <Calculator
              onClose={toggleCalculator}
              buttonRef={calculatorButtonRef}
            />
          </div>
        </>
      )}

      {showClockInModal && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
            }}
            onClick={toggleClockInModal}
          />
          <div style={{ position: "fixed", zIndex: 10000 }}>
            <ClockInModal
              onClose={toggleClockInModal}
              buttonRef={downloadButtonRef}
            />
          </div>
        </>
      )}
    </>
  );
};

export default Header;

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/daterangepicker/daterangepicker.css";
import "../../assets/plugins/icheck-bootstrap/icheck-bootstrap.min.css";
import "../../assets/plugins/bootstrap-colorpicker/css/bootstrap-colorpicker.min.css";
import "../../assets/plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css";
import "../../assets/plugins/select2/css/select2.min.css";
import "../../assets/plugins/select2-bootstrap4-theme/select2-bootstrap4.min.css";
import "../../assets/plugins/bootstrap4-duallistbox/bootstrap-duallistbox.min.css";
import "../../assets/plugins/bs-stepper/css/bs-stepper.min.css";
import "../../assets/plugins/dropzone/min/dropzone.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../AddUser.css";

const AddCustomer = () => {
  // Basic Information
  const [emailError, setEmailError] = useState("");
  const [prefix, setPrefix] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [enableServiceStaffPin, setEnableServiceStaffPin] = useState(false);
  const [staffPin, setStaffPin] = useState("");

  const [vendorId, setVendorId] = useState("");
  const [vendorFirmName, setVendorFirmName] = useState("");
  const [shopActNumber, setShopActNumber] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Personal Information
  const [language, setLanguage] = useState("");
// Change the dateOfBirth state initialization
const [dateOfBirth, setDateOfBirth] = useState(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateContactNumber, setAlternateContactNumber] = useState("");
  const [familyContactNumber, setFamilyContactNumber] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [socialMedia1, setSocialMedia1] = useState("");
  const [socialMedia2, setSocialMedia2] = useState("");
  const [customField1, setCustomField1] = useState("");
  const [customField2, setCustomField2] = useState("");
  const [customField3, setCustomField3] = useState("");
  const [customField4, setCustomField4] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [idProofName, setIdProofName] = useState("");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");

  const [county, setCounty] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Bank Details
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [branch, setBranch] = useState("");
  const [taxPayerId, setTaxPayerId] = useState("");

  // HRM Details
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [designations, setDesignations] = useState([]);
  const [selectedDesignationId, setSelectedDesignationId] = useState("");

  // Payroll
  const [primaryWorkLocation, setPrimaryWorkLocation] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [salaryIn, setSalaryIn] = useState("month");
  const [payComponents, setPayComponents] = useState([]);
  const [selectedPayComponents, setSelectedPayComponents] = useState([]);

  // Sales
  const [salesCommissionPercentage, setSalesCommissionPercentage] =
    useState("");
  const [maxSalesDiscountPercent, setMaxSalesDiscountPercent] = useState("");
  const [allowSelectedContacts, setAllowSelectedContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [franchiseIdError, setFranchiseIdError] = useState("");
  const [franchiseIdValid, setFranchiseIdValid] = useState(false);
  const [dbName, setdbName] = useState("");

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const navigate = useNavigate();
  const checkFranchiseIdAvailability = async (franchiseId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/customer/checkFranchiseId/${franchiseId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data["FranchiseId exists "];
    } catch (error) {
      console.error("Error checking franchise ID:", error);
      return false;
    }
  };

  const validateEmail = async (value) => {
    if (!value) {
      setEmailError("");
      return;
    }

    try {
      const res = await fetch(
        `${
          process.env.REACT_APP_BASE_URL
        }/customer/check-email?email=${encodeURIComponent(value)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.emailExists) {
          setEmailError("Email already exists");
        } else {
          setEmailError("");
        }
      } else {
        setEmailError("Unexpected server response");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setEmailError("Error contacting server");
    }
  };

  const handleChange = async (e) => {
    const { name, value, checked, type } = e.target;

    switch (name) {
      // Basic Information
      case "prefix":
        setPrefix(value);
        break;
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "email":
        setEmail(value);
        await validateEmail(value);
        break;
      case "username":
        setUsername(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      case "role":
        setSelectedRoleId(value);
        break;
      case "isActive":
        setIsActive(checked);
        break;

      case "enableServiceStaffPin":
        setEnableServiceStaffPin(checked);
        break;
      case "staffPin":
        setStaffPin(value);
        break;
      case "vendorId":
        setVendorId(value);
        setdbName(`fuma_${value}`);
        setFranchiseIdError("");
        setFranchiseIdValid(false);

        if (value.trim() !== "") {
          const exists = await checkFranchiseIdAvailability(value);
          if (exists) {
            setFranchiseIdError(
              "Franchise ID already exists. Please use a different one."
            );
            setFranchiseIdValid(false);
          } else {
            setFranchiseIdError("");
            setFranchiseIdValid(true);
          }
        }
        break;
      case "vendorFirmName":
        setVendorFirmName(value);
        break;
      case "shopActNumber":
        setShopActNumber(value);
        break;
      case "cinNumber":
        setCinNumber(value);
        break;
      case "taxNumber":
        setTaxNumber(value);
        break;
      case "panNumber":
        setPanNumber(value);
        break;

      // Personal Information
      case "language":
        setLanguage(value);
        break;
      case "dateOfBirth":
        setDateOfBirth(value);
        break;
      case "gender":
        setGender(value);
        break;
      case "maritalStatus":
        setMaritalStatus(value);
        break;
      case "bloodGroup":
        setBloodGroup(value);
        break;
      case "mobileNumber":
        setMobileNumber(value);
        break;
      case "alternateContactNumber":
        setAlternateContactNumber(value);
        break;
      case "familyContactNumber":
        setFamilyContactNumber(value);
        break;
      case "facebookLink":
        setFacebookLink(value);
        break;
      case "twitterLink":
        setTwitterLink(value);
        break;
      case "socialMedia1":
        setSocialMedia1(value);
        break;
      case "socialMedia2":
        setSocialMedia2(value);
        break;
      case "customField1":
        setCustomField1(value);
        break;
      case "customField2":
        setCustomField2(value);
        break;
      case "customField3":
        setCustomField3(value);
        break;
      case "customField4":
        setCustomField4(value);
        break;
      case "guardianName":
        setGuardianName(value);
        break;
      case "idProofName":
        setIdProofName(value);
        break;
      case "idProofNumber":
        setIdProofNumber(value);
        break;
      case "permanentAddress":
        setPermanentAddress(value);
        break;
      case "currentAddress":
        setCurrentAddress(value);
        break;

      case "county":
        setCounty(value);
        break;
      case "state":
        setState(value);
        break;
      case "city":
        setCity(value);
        break;
      case "zipCode":
        setZipCode(value);
        break;

      // Bank Details
      case "accountHolderName":
        setAccountHolderName(value);
        break;
      case "accountNumber":
        setAccountNumber(value);
        break;
      case "bankName":
        setBankName(value);
        break;
      case "bankCode":
        setBankCode(value);
        break;
      case "branch":
        setBranch(value);
        break;
      case "taxPayerId":
        setTaxPayerId(value);
        break;

      // HRM Details
      case "department":
        setSelectedDepartmentId(value);
        break;
      case "designation":
        setSelectedDesignationId(value);
        break;

      // Payroll
      case "primaryWorkLocation":
        setPrimaryWorkLocation(value);
        break;
      case "basicSalary":
        setBasicSalary(value);
        break;
      case "salaryIn":
        setSalaryIn(value);
        break;
      case "payComponents":
        if (type === "select-multiple") {
          const selectedOptions = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          setSelectedPayComponents(selectedOptions);
        } else {
          setSelectedPayComponents([value]);
        }
        break;

      // Sales
      case "salesCommissionPercentage":
        setSalesCommissionPercentage(value);
        break;
      case "maxSalesDiscountPercent":
        setMaxSalesDiscountPercent(value);
        break;
      case "allowSelectedContacts":
        setAllowSelectedContacts(checked);
        break;
      case "selectedContacts":
        if (type === "select-multiple") {
          const selectedOptions = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          setSelectedContacts(selectedOptions);
        } else {
          setSelectedContacts([value]);
        }
        break;

      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (vendorId.trim() === "") {
      alert("Franchise ID is required");
      setIsSubmitting(false);
      return;
    }
    if (emailError) {
      alert("Please fix the email error before submitting.");
      return;
    }

    try {
      const exists = await checkFranchiseIdAvailability(vendorId);
      if (exists) {
        setFranchiseIdError(
          "Franchise ID already exists. Please use a different one."
        );
        setFranchiseIdValid(false);
        alert("Franchise ID already exists. Please use a different one.");
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Error verifying Franchise ID:", error);
      alert("Error verifying Franchise ID. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      setIsSubmitting(false);
      return;
    }

    const userData = {
      prefix,
      firstname: firstName,
      lastname: lastName,
      email,
      isActive,
      franchiseId: vendorId,
      franchiseName: vendorFirmName,
      shopActNumber,
      cinNumber,
      taxOrGstNumber: taxNumber,
      panNumber,
      username: email,
      password,
      language,
      dateOfBirth,
      gender,
      maritalStatus,
      bloodGroup,
      mobileNumber,
      alternateContactNumber,
      familyContactNumber,
      facebookLink,
      twitterLink,
      socialMedia1,
      socialMedia2,
      customField1,
      customField2,
      customField3,
      customField4,
      guardianName,
      idProofName,
      idProofNumber,
      permanentAddress,
      currentAddress,
      country: county,
      state,
      city,
      zipCode,
      accountHolderName,
      accountNumber,
      bankName,
      ifsc: bankCode,
      branch,
      taxPayerId,
      dbHostName: "jdbc:mysql://162.240.158.75:3306/",
      dbName,
      userType: "FRANCHISE_ADMIN",
      dbUsername: "fuma_dbuser",
      dbPassword: "Fuma@01234",
    };
    console.log(userData);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/customer/save`, // ✅ FIXED
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to save franchise");
      }

      const data = await response.json();
      alert("Franchise added successfully!");

      setShowSuccessAlert(true);

      // Hide success message after 3 seconds and navigate
      setTimeout(() => {
        setShowSuccessAlert(false);
        navigate("/Customer");
      }, 3000);
    } catch (error) {
      console.error("Error saving franchise:", error);
      alert("Error saving franchise. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading fs-2">Add Franchise</h1>
                </div>
              </div>
            </div>
          </section>

          {/* Success Alert */}
          {showSuccessAlert && (
            <div
              className="alert alert-success alert-dismissible fade show mx-3"
              role="alert"
            >
              <strong>Success!</strong> Franchise saved successfully.
              <button
                type="button"
                className="close"
                data-dismiss="alert"
                aria-label="Close"
                onClick={() => setShowSuccessAlert(false)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          )}
          <section className="content">
            <div className="container-fluid">
              <form onSubmit={handleSubmit}>
                <fieldset disabled={isSubmitting}>
                  {/* Basic Information Card */}
                  <div className="card card-default rounded-4 border-0 cardHover">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="prefix">
                              Prefix<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="prefix"
                              name="prefix"
                              value={prefix}
                              onChange={handleChange}
                              placeholder="Enter Prefix"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="firstName">
                              First Name<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="firstName"
                              name="firstName"
                              value={firstName}
                              onChange={handleChange}
                              placeholder="Enter First Name"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="lastName">
                              Last Name<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="lastName"
                              name="lastName"
                              value={lastName}
                              onChange={handleChange}
                              placeholder="Enter Last Name"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="email">
                              Email<span className="text-danger">*</span>
                            </label>
                            <input
                              type="email"
                              className="form-control"
                              id="email"
                              name="email"
                              value={email}
                              onChange={handleChange}
                              placeholder="Enter Email"
                              required
                            />
                            {emailError && (
                              <span className="text-danger">{emailError}</span>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="vendorId">
                              Franchise ID<span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <input
                                type="text"
                                className={`form-control ${
                                  franchiseIdError
                                    ? "is-invalid"
                                    : franchiseIdValid
                                    ? "is-valid"
                                    : ""
                                }`}
                                id="vendorId"
                                name="vendorId"
                                value={vendorId}
                                onChange={handleChange}
                                placeholder="Enter Franchise ID"
                                required
                              />
                              <div className="input-group-append">
                                {franchiseIdError && (
                                  <span className="input-group-text bg-danger text-white">
                                    <i className="fas fa-times"></i>
                                  </span>
                                )}
                                {franchiseIdValid && !franchiseIdError && (
                                  <span className="input-group-text bg-success text-white">
                                    <i className="fas fa-check"></i>
                                  </span>
                                )}
                              </div>
                            </div>
                            {franchiseIdError && (
                              <div className="text-danger small mt-1">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {franchiseIdError}
                              </div>
                            )}
                            {franchiseIdValid && !franchiseIdError && (
                              <div className="text-success small mt-1">
                                <i className="fas fa-check-circle mr-1"></i>
                                Franchise ID is valid and available
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="vendorFirmName">
                              Franchise Name
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="vendorFirmName"
                              name="vendorFirmName"
                              value={vendorFirmName}
                              onChange={handleChange}
                              placeholder="Enter Franchise Name"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="shopActNumber">
                              Shop Act Number
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="shopActNumber"
                              name="shopActNumber"
                              value={shopActNumber}
                              onChange={handleChange}
                              placeholder="Enter Shop Act Number"
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="cinNumber">CIN Number</label>
                            <input
                              type="text"
                              className="form-control"
                              id="cinNumber"
                              name="cinNumber"
                              value={cinNumber}
                              onChange={handleChange}
                              placeholder="Enter CIN Number"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="taxNumber">Tax/GST Number</label>
                            <input
                              type="text"
                              className="form-control"
                              id="taxNumber"
                              name="taxNumber"
                              value={taxNumber}
                              onChange={handleChange}
                              placeholder="Enter Tax Number"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="panNumber">PAN Number</label>
                            <input
                              type="text"
                              className="form-control"
                              id="panNumber"
                              name="panNumber"
                              value={panNumber}
                              onChange={handleChange}
                              placeholder="Enter pan Number"
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-check form-check-lg">
                            <br />
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="isActive"
                              name="isActive"
                              checked={isActive}
                              onChange={handleChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="isActive"
                            >
                              Is Active
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Login Details Card */}

                  <div className="card card-default rounded-4 border-0 cardHover mt-3">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-12">
                          <div className="mb-4">
                            <h3 className="h4 font-weight-bold">
                              Login Information
                            </h3>
                          </div>

                          <div className="row mb-3">
                            <div className="col-12 col-md-4"></div>

                            <div className="row mb-3">
                              <div className="col-12 col-md-4 mb-3 mb-md-0">
                                <div className="form-group">
                                  <label
                                    htmlFor="username"
                                    className="form-label"
                                  >
                                    UserName:
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    name="username"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="Enter User Name"
                                    readOnly
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4 mb-3 mb-md-0">
                                <div className="form-group">
                                  <label
                                    htmlFor="password"
                                    className="form-label"
                                  >
                                    Password:{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={handleChange}
                                    placeholder="Enter Password"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="col-12 col-md-4">
                                <div className="form-group">
                                  <label
                                    htmlFor="confirmPassword"
                                    className="form-label"
                                  >
                                    Confirm Password:{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    className="form-control"
                                    required
                                    placeholder="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    id="confirmPassword"
                                    aria-required="true"
                                    value={confirmPassword}
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information Card */}
                  <div className="card card-default rounded-4 border-0 cardHover mt-3">
                    <div className="card-body">
                      <div className="mb-4">
                        <h3 className="h4 font-weight-bold">
                          More Information
                        </h3>
                      </div>
                      <div className="row">
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="language">Language:</label>
                            <select
                              className="form-control"
                              id="language"
                              name="language"
                              value={language}
                              onChange={handleChange}
                            >
                              <option value="">Select Language</option>
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth:</label>
                            <input
                              type="date"
                              className="form-control"
                              id="dateOfBirth"
                              name="dateOfBirth"
                              value={dateOfBirth}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="gender">Gender:</label>
                            <select
                              className="form-control"
                              id="gender"
                              name="gender"
                              value={gender}
                              onChange={handleChange}
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="maritalStatus">
                              Marital Status:
                            </label>
                            <select
                              className="form-control"
                              id="maritalStatus"
                              name="maritalStatus"
                              value={maritalStatus}
                              onChange={handleChange}
                            >
                              <option value="">Select Status</option>
                              <option value="single">Single</option>
                              <option value="married">Married</option>
                              <option value="divorced">Divorced</option>
                              <option value="widowed">Widowed</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="bloodGroup">Blood Group:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="bloodGroup"
                              name="bloodGroup"
                              value={bloodGroup}
                              onChange={handleChange}
                              placeholder="Blood Group"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="mobileNumber">
                              Mobile Number:
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="mobileNumber"
                              name="mobileNumber"
                              value={mobileNumber}
                              onChange={handleChange}
                              placeholder="Mobile Number"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="alternateContactNumber">
                              Alternate Contact Number:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="alternateContactNumber"
                              name="alternateContactNumber"
                              value={alternateContactNumber}
                              onChange={handleChange}
                              placeholder="Alternate Contact"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="familyContactNumber">
                              Family Contact Number:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="familyContactNumber"
                              name="familyContactNumber"
                              value={familyContactNumber}
                              onChange={handleChange}
                              placeholder="Family Contact"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="facebookLink">Facebook Link:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="facebookLink"
                              name="facebookLink"
                              value={facebookLink}
                              onChange={handleChange}
                              placeholder="Facebook Link"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="twitterLink">Twitter Link:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="twitterLink"
                              name="twitterLink"
                              value={twitterLink}
                              onChange={handleChange}
                              placeholder="Twitter Link"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="socialMedia1">
                              Social Media 1:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="socialMedia1"
                              name="socialMedia1"
                              value={socialMedia1}
                              onChange={handleChange}
                              placeholder="Social Media 1"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="socialMedia2">
                              Social Media 2:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="socialMedia2"
                              name="socialMedia2"
                              value={socialMedia2}
                              onChange={handleChange}
                              placeholder="Social Media 2"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="customField1">
                              Custom Field 1:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="customField1"
                              name="customField1"
                              value={customField1}
                              onChange={handleChange}
                              placeholder="Custom Field 1"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="customField2">
                              Custom Field 2:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="customField2"
                              name="customField2"
                              value={customField2}
                              onChange={handleChange}
                              placeholder="Custom Field 2"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="customField3">
                              Custom Field 3:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="customField3"
                              name="customField3"
                              value={customField3}
                              onChange={handleChange}
                              placeholder="Custom Field 3"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="customField4">
                              Custom Field 4:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="customField4"
                              name="customField4"
                              value={customField4}
                              onChange={handleChange}
                              placeholder="Custom Field 4"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="guardianName">Guardian Name:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="guardianName"
                              name="guardianName"
                              value={guardianName}
                              onChange={handleChange}
                              placeholder="Guardian Name"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="idProofName">ID Proof Name:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="idProofName"
                              name="idProofName"
                              value={idProofName}
                              onChange={handleChange}
                              placeholder="ID Proof Name"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="idProofNumber">
                              ID Proof Number:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="idProofNumber"
                              name="idProofNumber"
                              value={idProofNumber}
                              onChange={handleChange}
                              placeholder="ID Proof Number"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="county">
                              Country :<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="county"
                              name="county"
                              value={county}
                              onChange={handleChange}
                              placeholder="County"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="state">
                              State:<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="state"
                              name="state"
                              value={state}
                              onChange={handleChange}
                              placeholder="State"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="city">
                              City:<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="city"
                              name="city"
                              value={city}
                              onChange={handleChange}
                              placeholder="City"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="zipCode">
                              Zip Code:<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="zipCode"
                              name="zipCode"
                              value={zipCode}
                              onChange={handleChange}
                              placeholder="Zip Code"
                              required
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="permanentAddress">
                              Permanent Address:
                              <span className="text-danger">*</span>
                            </label>
                            <textarea
                              className="form-control"
                              id="permanentAddress"
                              name="permanentAddress"
                              value={permanentAddress}
                              onChange={handleChange}
                              rows="3"
                              placeholder="Permanent Address"
                              required
                            ></textarea>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="currentAddress">
                              Current Address:
                              <span className="text-danger">*</span>
                            </label>
                            <textarea
                              className="form-control"
                              id="currentAddress"
                              name="currentAddress"
                              value={currentAddress}
                              onChange={handleChange}
                              rows="3"
                              placeholder="Current Address"
                              required
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Card */}
                  <div className="card card-default rounded-4 border-0 cardHover mt-3">
                    <div className="card-body">
                      <div className="mb-4">
                        <h3 className="h4 font-weight-bold">Bank Details</h3>
                      </div>
                      <div className="row">
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="accountHolderName">
                              Account Holder's Name:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="accountHolderName"
                              name="accountHolderName"
                              value={accountHolderName}
                              onChange={handleChange}
                              placeholder="Account Holder's Name"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="accountNumber">
                              Account Number:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="accountNumber"
                              name="accountNumber"
                              value={accountNumber}
                              onChange={handleChange}
                              placeholder="Account Number"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="bankName">Bank Name:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="bankName"
                              name="bankName"
                              value={bankName}
                              onChange={handleChange}
                              placeholder="Bank Name"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="bankCode">
                              Bank Identifier Code:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="bankCode"
                              name="bankCode"
                              value={bankCode}
                              onChange={handleChange}
                              placeholder="Bank Code"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="branch">Branch:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="branch"
                              name="branch"
                              value={branch}
                              onChange={handleChange}
                              placeholder="Branch"
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group">
                            <label htmlFor="taxPayerId">Tax Payer ID:</label>
                            <input
                              type="text"
                              className="form-control"
                              id="taxPayerId"
                              name="taxPayerId"
                              value={taxPayerId}
                              onChange={handleChange}
                              placeholder="Tax Payer ID"
                            />
                          </div>
                        </div>
                        <label>Database Name : {dbName}</label>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn btn-save btn-lg px-4 py-2 m-2"
                    >
                      Submit
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;

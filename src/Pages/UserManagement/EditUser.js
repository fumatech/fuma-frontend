import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useNavigate, useParams } from "react-router-dom";
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
import { toast } from "react-toastify";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const emailCheckTimeoutRef = useRef(null);
  const emailToastShownRef = useRef(false);
  // Basic Information
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
  const [emailExists, setEmailExists] = useState(false);
  const [allowLogin, setAllowLogin] = useState(true);
  const [enableServiceStaffPin, setEnableServiceStaffPin] = useState(false);
  const [staffPin, setStaffPin] = useState("");

  // Personal Information
  const [language, setLanguage] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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
  const [locations, setLocations] = useState([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [allLocationsChecked, setAllLocationsChecked] = useState(false);

  const [primaryWorkLocation, setPrimaryWorkLocation] = useState("");
  const [primaryWorkLocationId, setPrimaryWorkLocationId] = useState(null);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error(err));
  }, []);
  const handleAllLocationsChange = (e) => {
    const checked = e.target.checked;
    setAllLocationsChecked(checked);

    if (checked) {
      // select ALL ids
      const allIds = locations.map((loc) => loc.id);
      setSelectedLocationIds(allIds);
    } else {
      // clear all
      setSelectedLocationIds([]);
    }
  };
  const handleLocationChange = (id) => {
    if (allLocationsChecked) return; // disable manual selection

    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id]
    );
  };
  useEffect(() => {
    fetchUserData();
    fetchRoles();
    fetchDepartments();
    fetchDesignations();
    fetchPayComponents();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/${id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await response.json();

      // Set all the state values from the fetched user data
      setPrefix(userData.prefix || "");
      setFirstName(userData.firstname || "");
      setLastName(userData.lastname || "");
      setEmail(userData.email || "");
      setIsActive(userData.isActive || false);
      setUsername(userData.username || "");
      setPassword(userData.password);
      setConfirmPassword(userData.password);
      setAllowLogin(userData.allowLogin || true);
      setEnableServiceStaffPin(userData.enableServiceStaffPin || false);
      setStaffPin(userData.staffPin || "");

      if (userData.roles && userData.roles.length > 0) {
        setSelectedRoleId(userData.roles[0].id || "");
      }
      // ---------- ✅ LOCATION PRESELECTION ----------
      if (userData.locationIds && userData.locationIds.length > 0) {
        setSelectedLocationIds(userData.locationIds);

        // check if ALL locations are selected
        if (
          locations.length > 0 &&
          userData.locationIds.length === locations.length
        ) {
          setAllLocationsChecked(true);
        } else {
          setAllLocationsChecked(false);
        }
      } else {
        setSelectedLocationIds([]);
        setAllLocationsChecked(false);
      }

      // Personal Information
      setLanguage(userData.language || "");
      setDateOfBirth(userData.dateOfBirth || "");
      setGender(userData.gender || "");
      setMaritalStatus(userData.maritalStatus || "");
      setBloodGroup(userData.bloodGroup || "");
      setMobileNumber(userData.mobileNumber || "");
      setAlternateContactNumber(userData.alternateContactNumber || "");
      setFamilyContactNumber(userData.familyContactNumber || "");
      setFacebookLink(userData.facebookLink || "");
      setTwitterLink(userData.twitterLink || "");
      setSocialMedia1(userData.socialMedia1 || "");
      setSocialMedia2(userData.socialMedia2 || "");
      setCustomField1(userData.customField1 || "");
      setCustomField2(userData.customField2 || "");
      setCustomField3(userData.customField3 || "");
      setCustomField4(userData.customField4 || "");
      setGuardianName(userData.guardianName || "");
      setIdProofName(userData.idProofName || "");
      setIdProofNumber(userData.idProofNumber || "");
      setPermanentAddress(userData.permanentAddress || "");
      setCurrentAddress(userData.currentAddress || "");

      // Bank Details - use direct fields instead of parsing bankFields
      setAccountHolderName(userData.accountHolderName || "");
      setAccountNumber(userData.accountNumber || "");
      setBankName(userData.bankName || "");
      setBankCode(userData.ifsc || ""); // Note: ifsc is the field name in your entity
      setBranch(userData.branch || "");
      setTaxPayerId(userData.taxPayerId || "");

      // HRM Details
      setSelectedDepartmentId(userData.departmentId || "");
      setSelectedDesignationId(userData.designationId || "");

      // Payroll
      setPrimaryWorkLocation(userData.primaryWorkLocation || "");
      setPrimaryWorkLocationId(userData.primaryWorkLocationId || null);
      setBasicSalary(userData.basicSalary || "");
      setSalaryIn(userData.salaryIn || "month");
      if (userData.payComponentId) {
        setSelectedPayComponents([userData.payComponentId]);
      }

      // Sales
      setSalesCommissionPercentage(userData.salesCommissionPercentage || "");
      setMaxSalesDiscountPercent(userData.commisionPercent || "");
      setAllowSelectedContacts(userData.allowContacts === 1);
      setSelectedContacts(userData.selectedContacts || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchRoles = () => {
    fetch(`${process.env.REACT_APP_BASE_URL}/role/getall`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setRoles(data);
      })
      .catch((error) => console.error("Error fetching roles:", error));
  };

  const fetchDepartments = () => {
    fetch(`${process.env.REACT_APP_BASE_URL}/department/getall`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setDepartments(data);
      })
      .catch((error) => console.error("Error fetching departments:", error));
  };

  const fetchDesignations = () => {
    fetch(`${process.env.REACT_APP_BASE_URL}/designation/getall`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setDesignations(data);
      })
      .catch((error) => console.error("Error fetching designations:", error));
  };

  const fetchPayComponents = () => {
    fetch(`${process.env.REACT_APP_BASE_URL}/pay-component/all`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setPayComponents(data);
      })
      .catch((error) => console.error("Error fetching pay components:", error));
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/email/${email}`
      );
      if (response.status === 200) {
        const data = await response.json();
        return data.id !== parseInt(id); // Return true only if email exists for another user
      } else if (response.status === 404) {
        return false; // Email does not exist
      } else {
        throw new Error("Error checking email");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return false; // Handle error gracefully
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
        const emailExists = await checkEmailExists(value);
        setEmailExists(emailExists);
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
      case "allowLogin":
        setAllowLogin(checked);
        break;
      case "enableServiceStaffPin":
        setEnableServiceStaffPin(checked);
        break;
      case "staffPin":
        setStaffPin(value);
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

      case "primaryWorkLocation": {
        const selectedLocation = locations.find(
          (loc) => loc.id === Number(value)
        );

        setPrimaryWorkLocationId(Number(value));
        setPrimaryWorkLocation(selectedLocation?.name || "");
        break;
      }
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

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match!");
      return;
    }

    if (emailExists) {
      toast.warning("Email already exists. Please use a different email.");
      return;
    }

    const userData = {
      id: parseInt(id),
      prefix,
      firstname: firstName,
      lastname: lastName,
      email,
      isActive,
      username: email,
      password: password || undefined,
      allowLogin,
      enableServiceStaffPin,
      locationIds: selectedLocationIds,
      staffPin,
      roles: [
        {
          id: selectedRoleId,
          role: roles.find((role) => role.id === parseInt(selectedRoleId))
            ?.role,
        },
      ],
      language,
      dateOfBirth,
      gender,
      maritalStatus,
      bloodGroup,
      mobileNumber,
      alternateContactNumber: alternateContactNumber,
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
      // Bank Details - send as separate fields matching your entity
      accountHolderName,
      accountNumber,
      bankName,
      ifsc: bankCode, // Map bankCode to ifsc field
      branch,
      taxPayerId,
      departmentId: selectedDepartmentId,
      designationId: selectedDesignationId,
      // Payroll ✅
      primaryWorkLocation,
      primaryWorkLocationId,
      basicSalary,
      salaryIn,
      payComponentId:
        selectedPayComponents.length > 0 ? selectedPayComponents[0] : null,
      salesCommissionPercentage,
      commisionPercent: maxSalesDiscountPercent,
      allowContacts: allowSelectedContacts ? 1 : 0,
      selectedContacts,
    };

    // console.log(userData);

    fetch(`${process.env.REACT_APP_BASE_URL}/user/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
      .then((response) => {
        if (!response.ok) {
          toast.error("Failed to update user");
        }
        return response.json();
      })
      .then(() => {
        toast.success("User updated successfully!");
        navigate("/users");
      })
      .catch((error) => console.error("Error updating user:", error));
  };

  return (
    <div>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading fs-2">Edit User</h1>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid">
              <form onSubmit={handleSubmit}>
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
                          {emailExists && (
                            <small className="form-text text-danger">
                              Email already exists.
                            </small>
                          )}
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
                            Roles and Permissions
                          </h3>
                        </div>

                        <div className="row mb-3">
                          <div className="col-12 col-md-4">
                            <div className="form-check">
                              <div className="form-check form-check-lg">
                                <br />
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id="allowLogin"
                                  name="allowLogin"
                                  checked={allowLogin}
                                  onChange={handleChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="allowLogin"
                                >
                                  Allow Login
                                </label>
                              </div>
                              <br />
                            </div>
                          </div>

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
                                <small className="form-text text-muted">
                                  Leave blank to auto generate username
                                </small>
                              </div>
                            </div>

                            <div className="col-12 col-md-4 mb-3 mb-md-0">
                              <div className="form-group">
                                <label
                                  htmlFor="password"
                                  className="form-label"
                                >
                                  Password:*
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  id="password"
                                  name="password"
                                  value={password}
                                  onChange={handleChange}
                                  placeholder="Enter New Password (leave blank to keep current)"
                                />
                              </div>
                            </div>

                            <div className="col-12 col-md-4">
                              <div className="form-group">
                                <label
                                  htmlFor="confirmPassword"
                                  className="form-label"
                                >
                                  Confirm Password:*
                                </label>
                                <input
                                  className="form-control"
                                  placeholder="Confirm Password"
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

                          <div className="row mb-4">
                            <div className="col-12 col-md-6">
                              <div className="form-group">
                                <label htmlFor="role" className="form-label">
                                  Role:*
                                </label>
                                <div className="d-flex align-items-center">
                                  <select
                                    id="role"
                                    name="role"
                                    className="form-control"
                                    value={selectedRoleId}
                                    onChange={handleChange}
                                    required
                                  >
                                    <option value="">Select Role</option>
                                    {roles
                                      .filter((role) => role.role !== "Super Admin")
                                      .map((role) => (
                                        <option key={role.id} value={role.id}>
                                          {role.role}
                                        </option>
                                      ))}
                                  </select>
                                  <i
                                    className="fas fa-info-circle text-info ms-2"
                                    title="Admin can access all locations"
                                  ></i>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="row align-items-center mb-3">
                            <div className="col-12 col-md-3 mb-3 mb-md-0">
                              <h4 className="h5 mb-0">
                                Access locations
                                <i
                                  className="fas fa-info-circle text-info ms-2"
                                  title="Choose all locations this role can access. All data for the selected location will only be displayed to the user."
                                ></i>
                              </h4>
                            </div>

                            <div className="col-12 col-md-9">
                              <div className="row">
                                <div className="form-check mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="all_locations"
                                    checked={allLocationsChecked}
                                    onChange={handleAllLocationsChange}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="all_locations"
                                  >
                                    All Locations
                                  </label>
                                </div>

                                {locations.map((location) => (
                                  <div className="form-check" key={location.id}>
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`location_${location.id}`}
                                      checked={
                                        allLocationsChecked ||
                                        selectedLocationIds.includes(
                                          location.id
                                        )
                                      }
                                      disabled={allLocationsChecked}
                                      onChange={() =>
                                        handleLocationChange(location.id)
                                      }
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={`location_${location.id}`}
                                    >
                                      {location.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-default rounded-4 border-0 cardHover mt-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="mb-4">
                        <h3 className="h4 font-weight-bold">Sales</h3>
                      </div>

                      {/* Sales Commission Percentage */}
                      <div className="col-md-4 mb-3">
                        <div className="form-group">
                          <label htmlFor="salesCommissionPercentage">
                            Sales Commission Percentage (%):{" "}
                            <i
                              className="fa fa-info-circle text-info"
                              data-container="body"
                              data-toggle="popover"
                              data-placement="auto bottom"
                              data-content="Used only if Sales Commission Agent Type setting is: 'Logged In user' or 'Select from users list'"
                              data-html="true"
                              data-trigger="hover"
                            />
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="salesCommissionPercentage"
                            name="salesCommissionPercentage"
                            placeholder="Sales Commission Percentage (%)"
                            value={salesCommissionPercentage}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Max Sales Discount Percentage */}
                      <div className="col-md-4 mb-3">
                        <div className="form-group">
                          <label htmlFor="maxSalesDiscountPercent">
                            Max sales discount percent:{" "}
                            <i
                              className="fa fa-info-circle text-info"
                              data-container="body"
                              data-toggle="popover"
                              data-placement="auto bottom"
                              data-content="Maximum discount percentage that a user can give during sale. Leave it blank for no constraints"
                              data-html="true"
                              data-trigger="hover"
                            />
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="maxSalesDiscountPercent"
                            name="maxSalesDiscountPercent"
                            placeholder="Max sales discount percent"
                            value={maxSalesDiscountPercent}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      {/* Allow Selected Contacts Checkbox */}
                      <div className="col-md-4 mb-3 d-flex align-items-center">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="allowSelectedContacts"
                            name="allowSelectedContacts"
                            checked={allowSelectedContacts}
                            onChange={handleChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="allowSelectedContacts"
                          >
                            Allow Selected Contacts
                          </label>
                          <i
                            className="fa fa-info-circle text-info ms-2"
                            data-container="body"
                            data-toggle="popover"
                            data-placement="auto bottom"
                            data-content="Only allow access to selected contacts in sells/purchase customer/supplier search box"
                            data-html="true"
                            data-trigger="hover"
                          />
                        </div>
                      </div>

                      {/* Select Contacts Dropdown */}
                      {allowSelectedContacts && (
                        <div className="col-md-4 mb-3">
                          <div className="form-group">
                            <label htmlFor="selectedContacts">
                              Select Contacts:
                            </label>
                            <Select
                              isMulti
                              id="selectedContacts"
                              name="selectedContacts"
                              // options={contacts.map((contact) => ({
                              //   value: contact.id,
                              //   label: contact.name,
                              // }))}
                              // value={contacts
                              //   .filter((contact) =>
                              //     selectedContacts.includes(contact.id)
                              //   )
                              //   .map((contact) => ({
                              //     value: contact.id,
                              //     label: contact.name,
                              //   }))}
                              onChange={(selectedOptions) =>
                                handleChange({
                                  target: {
                                    name: "selectedContacts",
                                    type: "select-multiple",
                                    selectedOptions: selectedOptions.map(
                                      (opt) => ({
                                        value: opt.value,
                                      })
                                    ),
                                  },
                                })
                              }
                              classNamePrefix="react-select"
                              placeholder="Search and select contacts..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information Card */}
                <div className="card card-default rounded-4 border-0 cardHover mt-3">
                  <div className="card-body">
                    <div className="mb-4">
                      <h3 className="h4 font-weight-bold">More Information</h3>
                    </div>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Language:</label>
                          <input
                            className="form-control"
                            placeholder="language"
                            name="language"
                            value={language}
                            onChange={handleChange}
                          />
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
                          <label htmlFor="maritalStatus">Marital Status:</label>
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
                          <label htmlFor="mobileNumber">Mobile Number:</label>
                          <input
                            type="text"
                            className="form-control"
                            id="mobileNumber"
                            name="mobileNumber"
                            value={mobileNumber}
                            onChange={handleChange}
                            placeholder="Mobile Number"
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
                          <label htmlFor="socialMedia1">Social Media 1:</label>
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
                          <label htmlFor="socialMedia2">Social Media 2:</label>
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
                          <label htmlFor="customField1">Custom Field 1:</label>
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
                          <label htmlFor="customField2">Custom Field 2:</label>
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
                          <label htmlFor="customField3">Custom Field 3:</label>
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
                          <label htmlFor="customField4">Custom Field 4:</label>
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
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="permanentAddress">
                            Permanent Address:
                          </label>
                          <textarea
                            className="form-control"
                            id="permanentAddress"
                            name="permanentAddress"
                            value={permanentAddress}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Permanent Address"
                          ></textarea>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="currentAddress">
                            Current Address:
                          </label>
                          <textarea
                            className="form-control"
                            id="currentAddress"
                            name="currentAddress"
                            value={currentAddress}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Current Address"
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
                          <label htmlFor="accountNumber">Account Number:</label>
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
                    </div>
                  </div>
                </div>

                {/* HRM Details Card */}
                <div className="card card-default rounded-4 border-0 cardHover mt-3">
                  <div className="card-body">
                    <div className="mb-4">
                      <h3 className="h4 font-weight-bold">HRM Details</h3>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="department">Department:</label>
                          <select
                            className="form-control"
                            id="department"
                            name="department"
                            value={selectedDepartmentId}
                            onChange={handleChange}
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.department}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="designation">Designation:</label>
                          <select
                            className="form-control"
                            id="designation"
                            name="designation"
                            value={selectedDesignationId}
                            onChange={handleChange}
                          >
                            <option value="">Select Designation</option>
                            {designations.map((designation) => (
                              <option
                                key={designation.id}
                                value={designation.id}
                              >
                                {designation.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payroll Card */}
                <div className="card card-default rounded-4 border-0 cardHover mt-3">
                  <div className="card-body">
                    <div className="mb-4">
                      <h3 className="h4 font-weight-bold">Payroll</h3>
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="primaryWorkLocation">
                            Primary Work Location:
                          </label>
                          <select
                            className="form-control"
                            id="primaryWorkLocation"
                            name="primaryWorkLocation"
                            value={primaryWorkLocationId || ""}
                            onChange={handleChange}
                          >
                            <option value="">Select Location</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="basicSalary">Basic Salary:</label>
                          <div className="d-flex gap-2">
                            <input
                              type="number"
                              className="form-control w-50"
                              id="basicSalary"
                              name="basicSalary"
                              value={basicSalary}
                              onChange={handleChange}
                              placeholder="Basic Salary"
                            />
                            <select
                              className="form-control w-50"
                              id="salaryIn"
                              name="salaryIn"
                              value={salaryIn}
                              onChange={handleChange}
                            >
                              <option value="month">Per Month</option>
                              <option value="week">Per Week</option>
                              <option value="day">Per Day</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="payComponents">Pay Components:</label>
                          <select
                            className="form-control"
                            id="payComponents"
                            name="payComponents"
                            multiple
                            value={selectedPayComponents}
                            onChange={handleChange}
                          >
                            {payComponents.map((component) => (
                              <option key={component.id} value={component.id}>
                                {component.description} ({component.type})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EditUser;

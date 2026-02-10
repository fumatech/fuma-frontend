import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import { toast } from "react-toastify";

// Component to render each permission group
const PermissionGroup = ({
  prefix,
  permissions,
  selectAll,
  selectedPermissions,
  handleSelectAll,
  handlePermissionChange,
}) => (
  <div key={prefix} className="mb-4 border-top border-secondary pt-3">
    <div className="container ">
      <div className="row align-items-center mb-3">
        <div className="col-md-2 mb-2">
          <h4 className="text-lg font-weight-bold">
            {prefix.replace(/_/g, " ").charAt(0).toUpperCase() + prefix.replace(/_/g, " ").slice(1)}
          </h4>
        </div>

        <div className="col-md-4 mb-2 d-flex align-items-center">
          <div className="form-check mb-0 ">
            <input
              type="checkbox"
              id={`selectAll${prefix}`}
              checked={selectAll[prefix]}
              onChange={() => handleSelectAll(prefix)}
              style={{
                cursor: "default",
                accentColor: "#78B833", // Modern browsers support this
                width: "20px", // Adjust size as needed
                height: "20px", // Adjust size as needed
                // Background and border color might not apply to the checkbox itself
                // Background and border color might apply to the container cell instead
              }}
            />
            <label
              className="form-check-label ms-2"
              htmlFor={`selectAll${prefix}`}
            >
              Select all
            </label>
          </div>
        </div>

        <div className="col-md-6">
          {permissions.map((permission) => (
            <div className="form-check " key={permission.name}>
              <input
                type="checkbox"
                id={permission.name}
                checked={selectedPermissions[prefix]?.[permission.name] || false}
                onChange={() => handlePermissionChange(prefix, permission.name)}
                style={{
                  cursor: "default",
                  accentColor: "#78B833", // Modern browsers support this
                  width: "20px", // Adjust size as needed
                  height: "20px", // Adjust size as needed
                  // Background and border color might not apply to the checkbox itself
                  // Background and border color might apply to the container cell instead
                }}
              />
              <label
                className="form-check-label ms-2"
                htmlFor={permission.name}
              >
                {permission.name
                  .split(".")[1]
                  ?.replace("add", "Add ")
                  .replace("view", "View ")
                  .replace("edit", "Edit ")
                  .replace("delete", "Delete ") || "Unknown"}
                {permission.name.split(".")[0] !== prefix && (
                  <span className="text-muted small ms-1">({permission.name.split(".")[0]})</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AddRoles = () => {
  const [roleName, setRoleName] = useState("");
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [selectAll, setSelectAll] = useState({});
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [roleExists, setRoleExists] = useState(false);
  const [roleNameError, setRoleNameError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (roleName) {
      checkRoleNameExists();
    } else {
      setRoleExists(false);
      setRoleNameError("");
    }
  }, [roleName]);

  // Standard list from Permission.js to ensure consistent ordering
  const standardModules = [
    "user", "roles", "vendor", "franchise", "product", "category", "brand", "variation", "unit",
    "purchase_order", "di_purchase", "po_purchase", "return_purchase", "purchase_entry",
    "view_orders", "accepted_orders", "ship_orders", "rejected_orders",
    "so_sale", "di_sale", "all_sale_orders", "sale_return", "accepted_return", "sale_entry", "ship_return",
    "stock_transfer", "stock_adjustment", "warranty_claim", "expense", "expense_category",
    "account", "trial_balance", "cash_flow", "payment_report", "payment_method",
    "purchase_and_sale_report", "tax_report", "customers_and_suppliers_report", "stock_report",
    "stock_adjustment_report", "item_report", "product_purchase_report", "product_sell_report",
    "purchase_payment_report", "sale_payment_report", "tax_rate", "business_details",
    "business_locations", "business_category", "permission", "image_upload", "signature_upload",
    "hrm", "crm"
  ];

  // Map legacy/inconsistent prefixes to standard ones
  const legacyMapping = {
    "users": "user",
    "purchaseorder": "purchase_order",
    "purchase": "purchase_order",
    "sales": "so_sale",
    "sale": "so_sale",
    "expenses": "expense",
    "report": "stock_report",
    "settings": "business_details"
  };

  const fetchPermissions = () => {
    fetch(`${process.env.REACT_APP_BASE_URL}/permissions/getall`)
      .then((response) => response.json())
      .then((data) => {
        const grouped = data.reduce((acc, permission) => {
          if (
            permission &&
            permission.name &&
            typeof permission.name === "string"
          ) {
            let prefix = permission.name.split(".")[0].toLowerCase();

            // Normalize prefix if it's a legacy standard
            if (legacyMapping[prefix]) {
              prefix = legacyMapping[prefix];
            }

            if (!acc[prefix]) {
              acc[prefix] = [];
            }
            acc[prefix].push(permission);
          }
          return acc;
        }, {});

        const initialSelectedPermissions = {};
        const initialSelectAll = {};

        Object.keys(grouped).forEach((prefix) => {
          initialSelectedPermissions[prefix] = grouped[prefix].reduce(
            (acc, p) => ({ ...acc, [p.name]: false }),
            {}
          );
          initialSelectAll[prefix] = false;
        });

        setGroupedPermissions(grouped);
        setSelectedPermissions(initialSelectedPermissions);
        setSelectAll(initialSelectAll);
        setPermissionsLoaded(true);
      })
      .catch((error) => console.error("Error fetching permissions:", error));
  };

  const checkRoleNameExists = () => {
    fetch(
      `${process.env.REACT_APP_BASE_URL}/role/check?name=${encodeURIComponent(
        roleName
      )}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.exists) {
          setRoleExists(true);
          setRoleNameError("Role name already exists");
        } else {
          setRoleExists(false);
          setRoleNameError("");
        }
      })
      .catch((error) => console.error("Error checking role name:", error));
  };

  const handleSelectAll = (prefix) => {
    const newSelectAll = !selectAll[prefix];
    const updatedPermissions = Object.keys(selectedPermissions[prefix]).reduce(
      (acc, key) => {
        acc[key] = newSelectAll;
        return acc;
      },
      {}
    );

    setSelectedPermissions({
      ...selectedPermissions,
      [prefix]: updatedPermissions,
    });

    setSelectAll({
      ...selectAll,
      [prefix]: newSelectAll,
    });
  };

  const handlePermissionChange = (prefix, permissionName) => {
    const updatedPermissions = {
      ...selectedPermissions[prefix],
      [permissionName]: !selectedPermissions[prefix][permissionName],
    };

    const allSelected = Object.values(updatedPermissions).every(
      (value) => value
    );

    setSelectedPermissions({
      ...selectedPermissions,
      [prefix]: updatedPermissions,
    });

    setSelectAll({
      ...selectAll,
      [prefix]: allSelected,
    });
  };

  const handleRoleNameChange = (event) => {
    setRoleName(event.target.value);
  };

  const handleSave = () => {
    if (!roleName) {
      setRoleNameError("Role name is required");
      toast.warning("Role name is required");
      return;
    }
    if (roleExists) {
      toast.warning("Role name already exists!");
      return;
    }

    const selectedPermissionsArray = Object.keys(selectedPermissions).flatMap(
      (prefix) =>
        groupedPermissions[prefix]
          .filter((p) => selectedPermissions[prefix][p.name])
          .map((p) => ({ id: p.id }))
    );

    const payload = {
      role: roleName,
      permissions: selectedPermissionsArray,
    };

    fetch(`${process.env.REACT_APP_BASE_URL}/role/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          toast.error("Failed to save role");
        }
        return response.json();
      })
      .then(() => {
        toast.success("Role saved successfully!");
        setRoleName("");
        setSelectedPermissions({});
        setSelectAll({});
        navigate("/roles");
      })
      .catch((error) => {
        toast.error("Error saving role:", error);
        toast.error("Failed to save role.");
      });
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading fs-2">Add Role</h1>
              </div>
            </div>
            <div className="card cardHover rounded-3 border-0">
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="roleName" className="form-label">
                    Role Name
                  </label>
                  <input
                    type="text"
                    className="form-control col-5 "
                    id="roleName"
                    value={roleName}
                    onChange={handleRoleNameChange}
                    placeholder="Enter Role Name"
                  />
                  {roleNameError && (
                    <div className="form-text  mt-2">{roleNameError}</div>
                  )}
                </div>
                <h4 className="text-bold mt-4">Permissions:</h4>
                <br />
                {/* Static "Others" group */}
                <div className="row check_group align-items-start mb-3">
                  <div className="col-md-2">
                    <h4>Others</h4>
                  </div>

                  <div className="col-md-2">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input check_all"
                        id="selectAllOthers"
                      // Optional: Handle with state if you want to manage its state
                      />
                      <label
                        className="form-check-label"
                        htmlFor="selectAllOthers"
                      >
                        Select all
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value="view_export_buttons"
                        name="permissions[]"
                        id="viewExportButtons"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="viewExportButtons"
                      >
                        View export to buttons (csv/excel/print/pdf) on tables
                      </label>
                    </div>
                  </div>
                </div>

                {permissionsLoaded && (
                  <>
                    {standardModules.map((prefix) => (
                      groupedPermissions[prefix] && (
                        <PermissionGroup
                          key={prefix}
                          prefix={prefix}
                          permissions={groupedPermissions[prefix]}
                          selectAll={selectAll}
                          selectedPermissions={selectedPermissions}
                          handleSelectAll={handleSelectAll}
                          handlePermissionChange={handlePermissionChange}
                        />
                      )
                    ))}
                    {/* Catch-all for any other permissions not in standard order */}
                    {Object.keys(groupedPermissions)
                      .filter(prefix => !standardModules.includes(prefix))
                      .map((prefix) => (
                        <PermissionGroup
                          key={prefix}
                          prefix={prefix}
                          permissions={groupedPermissions[prefix]}
                          selectAll={selectAll}
                          selectedPermissions={selectedPermissions}
                          handleSelectAll={handleSelectAll}
                          handlePermissionChange={handlePermissionChange}
                        />
                      ))}
                  </>
                )}
              </div>
            </div>{" "}
            <button
              className="btn btn-save d-block mx-auto btn-lg px-4 py-2 m-2 "
              onClick={handleSave}
              disabled={roleExists}
            >
              Save
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AddRoles;

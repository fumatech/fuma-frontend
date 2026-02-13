import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";
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
    <div className="container">
      <div className="row align-items-center mb-3">
        <div className="col-md-2 mb-2">
          <h4 className="text-lg font-weight-bold">
            {prefix.replace(/_/g, " ").charAt(0).toUpperCase() + prefix.replace(/_/g, " ").slice(1)}
          </h4>
        </div>
        <div className="col-md-4 mb-2 d-flex align-items-center ">
          <div className="form-check mb-0">
            <input
              type="checkbox"
              id={`selectAll${prefix}`}
              checked={selectAll[prefix] || false}
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
          {permissions.map((permission) => {
            const permissionName = permission.name || ""; // Ensure permission.name is defined
            const displayName =
              permissionName
                .split(".")[1]
                ?.replace("add", "Add ")
                .replace("view", "View ")
                .replace("edit", "Edit ")
                .replace("delete", "Delete ") || "Unknown"; // Default to "Unknown" if split[1] is undefined

            return (
              <div className="form-check " key={permissionName}>
                <input
                  type="checkbox"
                  id={permissionName}
                  checked={
                    selectedPermissions[prefix]?.[permissionName] || false
                  }
                  onChange={() =>
                    handlePermissionChange(prefix, permissionName)
                  }
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
                  htmlFor={permissionName}
                >
                  {displayName}
                  {permissionName.split(".")[0] !== prefix && (
                    <span className="text-muted small ms-1">({permissionName.split(".")[0]})</span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const EditRoles = () => {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [selectAll, setSelectAll] = useState({});
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    const { roleId } = queryString.parse(location.search);
    if (roleId && permissionsLoaded) {
      fetchRoleDetails(roleId);
    }
  }, [location.search, permissionsLoaded]);

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
        const categorizedPermissions = {};

        data.forEach((permission) => {
          let category = permission.name.split(".")[0].toLowerCase();

          if (legacyMapping[category]) {
            category = legacyMapping[category];
          }

          if (!categorizedPermissions[category]) {
            categorizedPermissions[category] = [];
          }
          categorizedPermissions[category].push(permission);
        });

        const initialSelectedPermissions = {};
        const initialSelectAll = {};

        Object.keys(categorizedPermissions).forEach((category) => {
          initialSelectedPermissions[category] = categorizedPermissions[
            category
          ].reduce((acc, p) => ({ ...acc, [p.name]: false }), {});
          initialSelectAll[category] = false;
        });

        setPermissions(categorizedPermissions);
        setSelectedPermissions(initialSelectedPermissions);
        setSelectAll(initialSelectAll);
        setPermissionsLoaded(true);
      })
      .catch((error) => console.error("Error fetching permissions:", error));
  };

  const fetchRoleDetails = (roleId) => {
    fetch(`${process.env.REACT_APP_BASE_URL}/role/details/${roleId}`)
      .then((response) => response.json())
      .then((data) => {
        setRoleName(data.role);

        const updatedSelectedPermissions = {};
        const updatedSelectAll = {};

        Object.keys(permissions).forEach((category) => {
          updatedSelectedPermissions[category] = permissions[category].reduce(
            (acc, p) => {
              acc[p.name] = data.permissions.some(
                (rolePerm) => rolePerm.name === p.name
              );
              return acc;
            },
            {}
          );
          updatedSelectAll[category] = Object.values(
            updatedSelectedPermissions[category]
          ).every((val) => val);
        });

        setSelectedPermissions(updatedSelectedPermissions);
        setSelectAll(updatedSelectAll);
      })
      .catch((error) => console.error("Error fetching role details:", error));
  };

  const handleSelectAll = (category) => {
    const newSelectAll = !selectAll[category];
    const updatedPermissions = Object.keys(
      selectedPermissions[category]
    ).reduce((acc, key) => {
      acc[key] = newSelectAll;
      return acc;
    }, {});

    setSelectedPermissions({
      ...selectedPermissions,
      [category]: updatedPermissions,
    });

    setSelectAll({
      ...selectAll,
      [category]: newSelectAll,
    });
  };

  const handlePermissionChange = (category, permissionName) => {
    const updatedPermissions = {
      ...selectedPermissions[category],
      [permissionName]: !selectedPermissions[category][permissionName],
    };

    const allSelected = Object.values(updatedPermissions).every(
      (value) => value
    );

    setSelectedPermissions({
      ...selectedPermissions,
      [category]: updatedPermissions,
    });

    setSelectAll({
      ...selectAll,
      [category]: allSelected,
    });
  };

  const handleRoleNameChange = (event) => {
    setRoleName(event.target.value);
  };

  const handleSave = () => {
    const selectedPermissionsPayload = [];

    Object.keys(permissions).forEach((category) => {
      const selectedCategoryPermissions = permissions[category]
        .filter((p) => selectedPermissions[category][p.name])
        .map((p) => ({ id: p.id }));

      selectedPermissionsPayload.push(...selectedCategoryPermissions);
    });

    const payload = {
      role: roleName,
      permissions: selectedPermissionsPayload,
    };

    const roleId = queryString.parse(location.search).roleId;

    fetch(`${process.env.REACT_APP_BASE_URL}/role/update/${roleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text);
          });
        }
        return response.json();
      })
      .then(() => {
        toast.success("Role updated successfully!");
        navigate("/roles");
      })
      .catch((error) => {
        // console.error("Error updating role:", error);
        toast.error("Failed to update role.");
      });
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1>Edit Role</h1>
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
                    className="form-control col-5"
                    id="roleName"
                    value={roleName}
                    onChange={handleRoleNameChange}
                    placeholder="Enter Role Name"
                  />
                </div>
                <h4 className="text-bold mt-4">Permissions:</h4>
                {permissionsLoaded && (
                  <>
                    {standardModules.map((category) => (
                      permissions[category] && (
                        <PermissionGroup
                          key={category}
                          prefix={category}
                          permissions={permissions[category]}
                          selectAll={selectAll}
                          selectedPermissions={selectedPermissions}
                          handleSelectAll={handleSelectAll}
                          handlePermissionChange={handlePermissionChange}
                        />
                      )
                    ))}
                    {/* Catch-all for any other permissions not in standard order */}
                    {Object.keys(permissions)
                      .filter(prefix => !standardModules.includes(prefix))
                      .map((category) => (
                        <PermissionGroup
                          key={category}
                          prefix={category}
                          permissions={permissions[category]}
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
              className="btn btn-save  d-block mx-auto btn-lg px-4 py-2 m-2"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EditRoles;

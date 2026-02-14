import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";
import BackButton from "../../components/BackButton";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";

// Component to render each permission group
const PermissionGroup = ({ prefix, permissions, selectedPermissions }) => (
  <div key={prefix} className="mb-4 border-top border-secondary pt-3">
    <div className="container">
      <div className="row align-items-center mb-3">
        <div className="col-md-2 mb-2">
          <h4 className="text-lg font-weight-bold">
            {prefix.charAt(0).toUpperCase() + prefix.slice(1)}
          </h4>
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
              <div className="form-check" key={permissionName}>
                <input
                  type="checkbox"
                  id={permissionName}
                  checked={
                    selectedPermissions[prefix]?.[permissionName] || false
                  }
                  readOnly
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
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const ViewRole = () => {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
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

  const fetchPermissions = () => {
    fetch(`${process.env.REACT_APP_BASE_URL}/permissions/getall`)
      .then((response) => response.json())
      .then((data) => {
        const categorizedPermissions = {};

        data.forEach((permission) => {
          const [category] = permission.name.split(".");
          if (!categorizedPermissions[category]) {
            categorizedPermissions[category] = [];
          }
          categorizedPermissions[category].push(permission);
        });

        const initialSelectedPermissions = {};

        Object.keys(categorizedPermissions).forEach((category) => {
          initialSelectedPermissions[category] = categorizedPermissions[
            category
          ].reduce((acc, p) => ({ ...acc, [p.name]: false }), {});
        });

        setPermissions(categorizedPermissions);
        setSelectedPermissions(initialSelectedPermissions);
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
        });

        setSelectedPermissions(updatedSelectedPermissions);
      })
      .catch((error) => console.error("Error fetching role details:", error));
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6 d-flex align-items-center">
                <BackButton />
                <h1 className="all-heading fs-2">View Role</h1>
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
                    readOnly
                  />
                </div>
                <h4 className="text-bold mt-4">Permissions:</h4>
                {permissionsLoaded && (
                  <>
                    {Object.keys(permissions).map((category) => (
                      <PermissionGroup
                        key={category}
                        prefix={category}
                        permissions={permissions[category]}
                        selectedPermissions={selectedPermissions}
                      />
                    ))}
                  </>
                )}
                <button
                  className="btn btn-primary d-block mx-auto mt-4"
                  onClick={() => navigate("/roles")}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewRole;

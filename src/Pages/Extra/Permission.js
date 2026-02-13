import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const modules = [
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

const actions = ["view", "add", "edit", "delete"];

function Permission() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSavePermission = async (module, action, showToast = true) => {
    const permission = {
      name: `${module}.${action}`,
    };

    try {
      console.log(`Attempting to save permission: ${permission.name}`);
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/permissions/save`,
        permission,
      );
      if (showToast) {
        toast.success(`Permission ${permission.name} saved successfully!`);
      }
      return true;
    } catch (error) {
      console.error(`Error saving permission ${permission.name}:`, error);
      if (showToast) {
        toast.error(`Failed to save ${permission.name}. It might already exist.`);
      }
      return false;
    }
  };

  const handleSyncAll = async () => {
    toast.info("Starting synchronization... This may take a moment.");
    let successCount = 0;
    let failCount = 0;

    for (const module of modules) {
      for (const action of actions) {
        const success = await handleSavePermission(module, action, false);
        if (success) successCount++;
        else failCount++;
      }
    }

    toast.success(`Sync Complete! ${successCount} permissions added/verified.`);
    if (failCount > 0) {
      toast.info(`${failCount} permissions skipped (already exist or error).`);
    }
  };

  const filteredModules = modules.filter(m =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2 align-items-center">
              <div className="col-sm-6">
                <h1 className="all-heading">Manage Permissions</h1>
              </div>
              <div className="col-sm-6 text-end">
                <button
                  className="btn btn-primary btn-lg rounded-3 shadow-sm"
                  onClick={handleSyncAll}
                >
                  <i className="fas fa-sync pe-2"></i>
                  Sync All Standard Permissions
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-header border-0 bg-white pt-3">
                <div className="row">
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search module..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4">Module Name</th>
                        {actions.map(action => (
                          <th key={action} className="text-center">{action.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModules.map((module) => (
                        <tr key={module}>
                          <td className="ps-4 font-weight-bold text-capitalize">
                            {module.replace(/_/g, " ")}
                          </td>
                          {actions.map(action => (
                            <td key={action} className="text-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleSavePermission(module, action)}
                                title={`Add ${module}.${action}`}
                              >
                                <i className="fas fa-plus pe-1"></i> Add
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Permission;

import React, { useState } from "react";
import { toast } from "react-toastify";

const HRMSettings = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [settings, setSettings] = useState({
    leave_ref_no_prefix: "",
    leave_instructions: "",
    payroll_ref_no_prefix: "",
    is_location_required: false,
    grace_before_checkin: "",
    grace_after_checkin: "",
    grace_before_checkout: "",
    grace_after_checkout: "",
    calculate_sales_target_commission_without_tax: true,
    essentials_todos_prefix: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e, tab) => {
    e.preventDefault();
    // Handle form submission for specific tab here
    // console.log(`${tab} settings submitted:`, settings);
    // You can make API calls specific to each tab here
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "leave":
        return (
          <div className="pos-tab-content active">
            <div className="row">
              <div className="col-xs-4">
                <div className="form-group">
                  <label htmlFor="leave_ref_no_prefix">
                    Leave Reference No. prefix:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Leave Reference No. prefix"
                    name="leave_ref_no_prefix"
                    type="text"
                    id="leave_ref_no_prefix"
                    value={settings.leave_ref_no_prefix}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-xs-12">
                <div className="form-group">
                  <label htmlFor="leave_instructions">
                    Leave Instructions:
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="Leave Instructions"
                    name="leave_instructions"
                    cols="50"
                    rows="10"
                    id="leave_instructions"
                    value={settings.leave_instructions}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-12">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => handleSubmit(e, "leave")}
                >
                  Update Leave Settings
                </button>
              </div>
            </div>
          </div>
        );
      case "payroll":
        return (
          <div className="pos-tab-content active">
            <div className="row">
              <div className="col-xs-4">
                <div className="form-group">
                  <label htmlFor="payroll_ref_no_prefix">
                    Payroll Reference No. prefix:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Payroll Reference No. prefix"
                    name="payroll_ref_no_prefix"
                    type="text"
                    id="payroll_ref_no_prefix"
                    value={settings.payroll_ref_no_prefix}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-12">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => handleSubmit(e, "payroll")}
                >
                  Update Payroll Settings
                </button>
              </div>
            </div>
          </div>
        );
      case "attendance":
        return (
          <div className="pos-tab-content active">
            <div className="row">
              <div className="col-12">
                <div className="checkbox">
                  <label>
                    <input
                      className="input-icheck"
                      name="is_location_required"
                      type="checkbox"
                      checked={settings.is_location_required}
                      onChange={handleChange}
                    />{" "}
                    Is location required?
                  </label>
                </div>
              </div>
              <div className="clearfix"></div>
              <div className="col-xs-12">
                <strong>Grace Time:</strong>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="grace_before_checkin">
                    Grace before checkin:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Grace before checkin"
                    step="1"
                    name="grace_before_checkin"
                    type="number"
                    id="grace_before_checkin"
                    value={settings.grace_before_checkin}
                    onChange={handleChange}
                  />
                  <p className="help-block">
                    (in minute) this time will not counted as overtime
                  </p>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="grace_after_checkin">
                    Grace after checkin:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Grace after checkin"
                    step="1"
                    name="grace_after_checkin"
                    type="number"
                    id="grace_after_checkin"
                    value={settings.grace_after_checkin}
                    onChange={handleChange}
                  />
                  <p className="help-block">
                    (in minute) this time will not counted as late
                  </p>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="grace_before_checkout">
                    Grace before checkout:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Grace before checkout"
                    step="1"
                    name="grace_before_checkout"
                    type="number"
                    id="grace_before_checkout"
                    value={settings.grace_before_checkout}
                    onChange={handleChange}
                  />
                  <p className="help-block">
                    (in minute) this time will not counted as early left
                  </p>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="grace_after_checkout">
                    Grace after checkout:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Grace after checkout"
                    step="1"
                    name="grace_after_checkout"
                    type="number"
                    id="grace_after_checkout"
                    value={settings.grace_after_checkout}
                    onChange={handleChange}
                  />
                  <p className="help-block">
                    (in minute) this time will not counted as overtime
                  </p>
                </div>
              </div>
            </div>
            <p>
              <i className="fas fa-info-circle"></i>
              <span className="text-danger">
                "Allow users to enter their own attendance" setting has been
                moved to role.
              </span>
            </p>
            <div className="row mt-3">
              <div className="col-md-12">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => handleSubmit(e, "attendance")}
                >
                  Update Attendance Settings
                </button>
              </div>
            </div>
          </div>
        );
      case "sales":
        return (
          <div className="pos-tab-content active">
            <div className="row">
              <div className="col-xs-6">
                <div className="checkbox">
                  <label className="">
                    <input
                      className="input-icheck"
                      checked={
                        settings.calculate_sales_target_commission_without_tax
                      }
                      name="calculate_sales_target_commission_without_tax"
                      type="checkbox"
                      onChange={handleChange}
                    />{" "}
                    Calculate Sales Target Commission without Tax
                  </label>
                  <i
                    className="fa fa-info-circle text-info hover-q no-print"
                    aria-hidden="true"
                    title="If checked sales target commission will be calculated on total sales by the employee without including taxes"
                  ></i>
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-12">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => handleSubmit(e, "sales")}
                >
                  Update Sales Settings
                </button>
              </div>
            </div>
          </div>
        );
      case "essentials":
        return (
          <div className="pos-tab-content active">
            <div className="row">
              <div className="col-xs-4">
                <div className="form-group">
                  <label htmlFor="essentials_todos_prefix">
                    Todos ID Prefix:
                  </label>
                  <input
                    className="form-control"
                    placeholder="Todos ID Prefix"
                    name="essentials_todos_prefix"
                    type="text"
                    id="essentials_todos_prefix"
                    value={settings.essentials_todos_prefix}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-12">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => handleSubmit(e, "essentials")}
                >
                  Update Essentials Settings
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="wrapper">
      <div className="">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">Essentials and HRM Settings</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="row">
            <div className="col-xs-12">
              <div className="pos-tab-container tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
                <div className="tw-p-2 sm:tw-p-3">
                  <div className="tw-flow-root tw-border-gray-200">
                    <div className="">
                      <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                        <div className="row">
                          <div className="col-lg-2 col-md-2 col-sm-2 col-xs-2 pos-tab-menu">
                            <div className="list-group">
                              <button
                                type="button"
                                className={`list-group-item text-center tw-font-bold tw-text-sm md:tw-text-base ${
                                  activeTab === "leave" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("leave")}
                              >
                                Leave
                              </button>
                              <button
                                type="button"
                                className={`list-group-item text-center tw-font-bold tw-text-sm md:tw-text-base ${
                                  activeTab === "payroll" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("payroll")}
                              >
                                Payroll
                              </button>
                              <button
                                type="button"
                                className={`list-group-item text-center tw-font-bold tw-text-sm md:tw-text-base ${
                                  activeTab === "attendance" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("attendance")}
                              >
                                Attendance
                              </button>
                              <button
                                type="button"
                                className={`list-group-item text-center tw-font-bold tw-text-sm md:tw-text-base ${
                                  activeTab === "sales" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("sales")}
                              >
                                Sales Targets
                              </button>
                              <button
                                type="button"
                                className={`list-group-item text-center tw-font-bold tw-text-sm md:tw-text-base ${
                                  activeTab === "essentials" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("essentials")}
                              >
                                Essentials
                              </button>
                            </div>
                          </div>

                          <div className="col-lg-10 col-md-10 col-sm-10 col-xs-10 pos-tab">
                            {renderTabContent()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HRMSettings;

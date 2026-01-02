import React from "react";
import { FaCalendarAlt, FaMoneyBillAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const PayrollGroupPayment = () => {
  // Static data
  const paymentData = {
    employee: {
      id: 1,
      name: "Mr Admin",
      transaction_id: 70,
    },
    grossAmount: "$0.00",
    bankDetails: {
      bankName: "",
      branch: "",
      bankIdentifier: "",
      accountHolder: "",
      accountNumber: "",
      taxPayerId: "",
    },
    payment: {
      amount: "0",
      paidOn: "04/04/2025 02:27",
      account: "None",
      note: "",
      method: "cash",
    },
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading ">Add payment for payroll group</h1>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                <h4>Add payment for payroll group</h4>
                <p className="text-muted">
                  (Payroll for May 2025) - Awesome Shop - All locations
                </p>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Gross Amount</th>
                      <th>Bank Details</th>
                      <th>Add payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <input
                        type="hidden"
                        value={paymentData.employee.transaction_id}
                      />
                      <input type="hidden" value={paymentData.employee.id} />

                      {/* Employee Column */}
                      <td>{paymentData.employee.name}</td>

                      {/* Gross Amount Column */}
                      <td>{paymentData.grossAmount}</td>

                      {/* Bank Details Column */}
                      <td>
                        <strong>Bank Name:</strong>{" "}
                        {paymentData.bankDetails.bankName}
                        <br />
                        <strong>Branch:</strong>{" "}
                        {paymentData.bankDetails.branch}
                        <br />
                        <strong>Bank Identifier Code:</strong>{" "}
                        {paymentData.bankDetails.bankIdentifier}
                        <br />
                        <strong>Account Holder's Name:</strong>{" "}
                        {paymentData.bankDetails.accountHolder}
                        <br />
                        <strong>Bank Account No.:</strong>{" "}
                        {paymentData.bankDetails.accountNumber}
                        <br />
                        <strong>Tax Payer ID:</strong>{" "}
                        {paymentData.bankDetails.taxPayerId}
                        <br />
                      </td>

                      {/* Add Payment Column */}
                      <td>
                        {/* Amount */}
                        <div className="mb-3 row">
                          <label
                            htmlFor="amount_1"
                            className="col-12 col-md-4 col-form-label"
                          >
                            Amount:*
                          </label>
                          <div className="col-12 col-md-8">
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaMoneyBillAlt />
                              </span>
                              <input
                                type="text"
                                className="form-control input_number payment_amount"
                                id="amount_1"
                                value={paymentData.payment.amount}
                                data-rule-max-value="0"
                                data-msg-max-value="Maximum amount is 0.00"
                                placeholder="Enter Amount"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Paid On */}
                        <div className="mb-3 row ">
                          <label
                            htmlFor="paid_on_1"
                            className="col-12 col-md-4 col-form-label"
                          >
                            Paid on:*
                          </label>
                          <div className="col-12 col-md-8">
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaCalendarAlt />
                              </span>
                              <input
                                className="form-control paid_on"
                                id="paid_on_1"
                                type="text"
                                value={paymentData.payment.paidOn}
                                readOnly
                                required
                                placeholder="Select Date"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Payment Account */}
                        <div className="mb-3 row">
                          <label
                            htmlFor="account_id_1"
                            className="col-12 col-md-4 col-form-label"
                          >
                            Payment Account:
                          </label>
                          <div className="col-12 col-md-8">
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaMoneyBillAlt />
                              </span>
                              <select
                                className="form-select"
                                id="account_id_1"
                                value={paymentData.payment.account}
                              >
                                <option value="">None</option>
                                <option value="cash_account">
                                  Cash Account
                                </option>
                                <option value="bank_account">
                                  Bank Account
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Payment Note */}
                        <div className="mb-3 row">
                          <label
                            htmlFor="payment_note_1"
                            className="col-12 col-md-4 col-form-label"
                          >
                            Payment Note:
                          </label>
                          <div className="col-12 col-md-8">
                            <textarea
                              className="form-control"
                              id="payment_note_1"
                              rows="2"
                              placeholder="Enter Payment Note"
                              value={paymentData.payment.note}
                            ></textarea>
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-3 row">
                          <label
                            htmlFor="method_1"
                            className="col-12 col-md-4 col-form-label"
                          >
                            Payment Method:*
                          </label>
                          <div className="col-12 col-md-8">
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaMoneyBillAlt />
                              </span>
                              <select
                                className="form-select payment_types"
                                id="method_1"
                                value={paymentData.payment.method}
                              >
                                <option value="">Please Select</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="cheque">Cheque</option>
                                <option value="bank_transfer">
                                  Bank Transfer
                                </option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="container-fluid text-center mt-3">
              <button
                type="submit"
                className="btn btn-save btn-lg px-4 py-2 m-2"
              >
                Pay
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PayrollGroupPayment;

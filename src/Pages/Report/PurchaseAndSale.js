import React, { useState, useEffect } from "react";

function PurchaseAndSale() {
  const [purchasesData, setPurchasesData] = useState({});
  const [salesData, setSalesData] = useState({});

  // Function to fetch purchases data
  const fetchPurchasesData = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/purchases");
      const data = await response.json();
      setPurchasesData(data);
    } catch (error) {
      console.error("Error fetching purchases data:", error);
    }
  };

  // Function to fetch sales data
  const fetchSalesData = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/sales");
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchPurchasesData();
    fetchSalesData();
  }, []);

  // Calculate overall values
  const totalPurchases = purchasesData.totalPurchase || 0;
  const totalSales = salesData.totalSale || 0;
  const totalPurchaseReturns = purchasesData.totalReturnIncludingTax || 0;
  const totalSaleReturns = salesData.totalReturnIncludingTax || 0;

  const overall =
    totalSales - totalPurchases + totalPurchaseReturns - totalSaleReturns;
  const dueAmount = totalSales - totalPurchases; // Example calculation for due amount

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-12 col-md-6">
                  <h1 className="all-heading">Purchase And Sale</h1>
                </div>
              </div>
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">
              <div className="row">
                <div className="col-md-6">
                  <div className="card p-2 cardHover rounded-4 border-0 w-auto">
                    <div>
                      <h3 className="text-muted">Purchases</h3>
                    </div>
                    <div>
                      <div>
                        <table className="table table-striped">
                          <tbody>
                            <tr>
                              <th>Total Purchase:</th>
                              <td>
                                <span className="total_purchase">{`$ ${totalPurchases}`}</span>
                              </td>
                            </tr>
                            <tr>
                              <th>Purchase Including Tax:</th>
                              <td>
                                <span className="purchase_inc_tax">{`$ ${
                                  purchasesData.purchaseIncludingTax || 0
                                }`}</span>
                              </td>
                            </tr>
                            <tr>
                              <th>Total Purchase Return Including Tax:</th>
                              <td>
                                <span className="purchase_return_inc_tax">{`$ ${totalPurchaseReturns}`}</span>
                              </td>
                            </tr>
                            <tr>
                              <th>
                                Purchase Due:{" "}
                                <i
                                  className="fa fa-info-circle text-info hover-q no-print responsive-icon"
                                  aria-hidden="true"
                                  data-container="body"
                                  data-toggle="popover"
                                  data-placement="auto bottom"
                                  data-content="Total unpaid amount for purchases."
                                  data-html="true"
                                  data-trigger="hover"
                                  title=""
                                />
                              </th>
                              <td>
                                <span className="purchase_due">{`$ ${
                                  purchasesData.purchaseDue || 0
                                }`}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card p-2 cardHover rounded-4 border-0 w-auto">
                    <div>
                      <h3 className="text-muted">Sales</h3>
                    </div>
                    <div>
                      <div>
                        <table className="table table-striped">
                          <tbody>
                            <tr>
                              <th>Total Sale:</th>
                              <td>
                                <span className="total_sell">{`$ ${totalSales}`}</span>
                              </td>
                            </tr>
                            <tr>
                              <th>Sale Including Tax:</th>
                              <td>
                                <span className="sell_inc_tax">{`$ ${
                                  salesData.saleIncludingTax || 0
                                }`}</span>
                              </td>
                            </tr>
                            <tr>
                              <th>Total Sell Return Including Tax:</th>
                              <td>
                                <span className="total_sell_return">{`$ ${totalSaleReturns}`}</span>
                              </td>
                            </tr>
                            <tr>
                              <th>
                                Sale Due:{" "}
                                <i
                                  className="fa fa-info-circle text-info hover-q no-print responsive-icon"
                                  aria-hidden="true"
                                  data-container="body"
                                  data-toggle="popover"
                                  data-placement="auto bottom"
                                  data-content="Total amount to be received from sales"
                                  data-html="true"
                                  data-trigger="hover"
                                  title=""
                                />
                              </th>
                              <td>
                                <span className="sell_due">{`$ ${
                                  salesData.saleDue || 0
                                }`}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="card p-2 cardHover rounded-4 border-0 ">
                  <div className="col-12">
                    <div>
                      <div className="">
                        <h4 className="">
                          Overall (Sale - Sell Return) - (Purchase - Purchase
                          Return)
                          <span
                            className="text-info hover-q no-print"
                            data-toggle="popover"
                            data-placement="auto bottom"
                            data-content="-ve value = Amount to pay <br>+ve Value = Amount to receive"
                            data-html="true"
                            title=""
                          >
                            <i aria-hidden="true"></i>
                          </span>
                        </h4>
                      </div>
                      <div className="tw-flow-root tw-border-gray-200">
                        <div>
                          <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                            <h3 className="text-muted">
                              Sale - Purchase:
                              <span
                                className={`sell_minus_purchase ${
                                  overall < 0 ? "text-danger" : "text-success"
                                }`}
                              >
                                ${overall.toFixed(2)}
                              </span>
                            </h3>
                            <h3 className="text-muted">
                              Due amount:
                              <span
                                className={`difference_due ${
                                  dueAmount < 0 ? "text-danger" : "text-success"
                                }`}
                              >
                                ${dueAmount.toFixed(2)}
                              </span>
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center py-3">
                  <button
                    className="btn btn-save btn-lg px-4 py-2 m-2 "
                    onClick={handlePrint}
                  >
                    <i className="fa fa-print"></i> Print
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default PurchaseAndSale;

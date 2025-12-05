import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

function ProductStockHistory() {
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [variationId, setVariationId] = useState("");
  const [currentStock, setCurrentStock] = useState(0);
  const [productName, setProductName] = useState("");
  const [variationName, setVariationName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [stockSummary, setStockSummary] = useState({
    totalPurchase: 0,
    openingStock: 0,
    totalSellReturn: 0,
    stockTransfersIn: 0,
    totalSold: 0,
    totalStockAdjustment: 0,
    totalPurchaseReturn: 0,
    stockTransfersOut: 0,
  });

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const productIdFromURL = queryParams.get("productId");
  const variationIdFromURL = queryParams.get("variationId");

  useEffect(() => {
    if (productIdFromURL) setProductId(productIdFromURL);
    if (variationIdFromURL) setVariationId(variationIdFromURL);
  }, [productIdFromURL, variationIdFromURL]);

  const fetchProductDetails = async () => {
    if (!productId) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
      );
      const product = response.data;
      setProductName(product.productName);
      setProductSku(product.sku || "");
      setBusinessLocation(product.businessLocation || "Awesome Shop");

      const variation = product.productVariations.find(
        (variation) => variation.id === parseInt(variationId)
      );
      if (variation) {
        setVariationName(variation.variationValue);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  const fetchStockHistory = async () => {
    if (!productId || !variationId) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/stock-transactions/by-product-variation/${productId}/${variationId}`
      );
      if (Array.isArray(response.data)) {
        const sortedData = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setStockHistory(sortedData);

        // Calculate summary
        const summary = {
          totalPurchase: 0,
          openingStock: 0,
          totalSellReturn: 0,
          stockTransfersIn: 0,
          totalSold: 0,
          totalStockAdjustment: 0,
          totalPurchaseReturn: 0,
          stockTransfersOut: 0,
        };

        sortedData.forEach((transaction) => {
          const quantity = parseFloat(transaction.quantity) || 0;
          switch (transaction.transactionType) {
            case "po_purchase":
            case "di_purchase":
              summary.totalPurchase += quantity;
              break;
            case "open_stock":
              summary.openingStock += quantity;
              break;
            case "sale_return":
              summary.totalSellReturn += quantity;
              break;
            case "stock_transfer_in":
              summary.stockTransfersIn += quantity;
              break;
            case "so_sale":
            case "di_sale":
              summary.totalSold += Math.abs(quantity);
              break;
            case "adjustment":
              summary.totalStockAdjustment += Math.abs(quantity);
              break;
            case "purchase_return":
              summary.totalPurchaseReturn += Math.abs(quantity);
              break;
            case "stock_transfer_out":
              summary.stockTransfersOut += Math.abs(quantity);
              break;
          }
        });

        setStockSummary(summary);
      } else {
        console.warn("Unexpected response format: not an array");
        setStockHistory([]);
      }
    } catch (error) {
      console.error("Error fetching stock history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async () => {
    if (!productId || !variationId) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${productId}/${variationId}`
      );
      setCurrentStock(response.data || 0);
    } catch (error) {
      console.error("Error fetching current stock:", error);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    fetchStockHistory();
    fetchCurrentStock();
  }, [productId, variationId]);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case "po_purchase":
      case "di_purchase":
        return "Purchase";
      case "so_sale":
      case "di_sale":
        return "Sell";
      case "open_stock":
        return "Opening Stock";
      case "sale_return":
        return "Sell Return";
      case "purchase_return":
        return "Purchase Return";
      case "adjustment":
        return "Adjustment";
      case "stock_transfer_in":
        return "Transfer In";
      case "stock_transfer_out":
        return "Transfer Out";
      default:
        return type;
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Product stock history</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card rounded-4 border-0 shadow-sm mb-4">
              <div className="card-body">
                <h4 className="mb-3">{productName}</h4>
                <p className="mb-1">
                  <strong>Product:</strong> {productName} - {productSku}
                </p>
                <hr className="my-3" />

                <div className=" md-4">
                  {/* Variations: {variationName} ({productSku}-{variationId}) */}
                  Variation: {variationName} ({productSku})
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Quantities in</h6>
                      </div>
                      <div className="card-body">
                        {/* Quantities In table */}
                        <table className="table table-sm mb-0">
                          <tbody>
                            <tr>
                              <td>Total Purchase</td>
                              <td className="text-end text-success">
                                {stockSummary.totalPurchase} Pc(s)
                              </td>
                            </tr>
                            <tr>
                              <td>Opening Stock</td>
                              <td className="text-end text-success">
                                {stockSummary.openingStock} Pc(s)
                              </td>
                            </tr>
                            <tr>
                              <td>Total Sell Return</td>
                              <td className="text-end text-success">
                                {stockSummary.totalSellReturn} Pc(s)
                              </td>
                            </tr>
                            <tr>
                              <td>Stock Transfers (in)</td>
                              <td className="text-end text-success">
                                {stockSummary.stockTransfersIn} Pc(s)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Quantities Out</h6>
                      </div>
                      <div className="card-body">
                        {/* Quantities Out table */}
                        <table className="table table-sm mb-0">
                          <tbody>
                            <tr>
                              <td>Total Sold</td>
                              <td className="text-end text-danger">
                                {stockSummary.totalSold} Pc(s)
                              </td>
                            </tr>
                            <tr>
                              <td>Total Stock Adjustment</td>
                              <td className="text-end text-danger">
                                {stockSummary.totalStockAdjustment} Pc(s)
                              </td>
                            </tr>
                            <tr>
                              <td>Total Purchase Return</td>
                              <td className="text-end text-danger">
                                {stockSummary.totalPurchaseReturn} Pc(s)
                              </td>
                            </tr>
                            <tr>
                              <td>Stock Transfers (Out)</td>
                              <td className="text-end text-danger">
                                {stockSummary.stockTransfersOut} Pc(s)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Totals</h6>
                  </div>
                  <div className="card-body">
                    <table className="table table-sm mb-0">
                      <tbody>
                        <tr>
                          <td>
                            <strong>Current stock</strong>
                          </td>
                          <td className="text-end">
                            <strong>{currentStock} Pc(s)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="card rounded-4 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span>Show</span>
                    <select
                      className="form-select form-select-sm d-inline-block mx-2"
                      style={{ width: "70px" }}
                    >
                      <option>25</option>
                      <option>50</option>
                      <option>100</option>
                    </select>
                    <span>entries</span>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary mx-1">
                      Export CSV
                    </button>
                    <button className="btn btn-sm btn-outline-secondary mx-1">
                      Export Excel
                    </button>
                    <button className="btn btn-sm btn-outline-secondary mx-1">
                      Print
                    </button>
                    <button className="btn btn-sm btn-outline-secondary mx-1">
                      Column visibility
                    </button>
                    <button className="btn btn-sm btn-outline-secondary mx-1">
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Quantity change</th>
                        <th>New Quantity</th>
                        <th>Date</th>
                        <th>Reference No</th>
                        <th>Customer/Supplier Information</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="text-center">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : stockHistory.length > 0 ? (
                        stockHistory.map((transaction, index) => {
                          const isPositive = [
                            "po_purchase",
                            "di_purchase",
                            "sale_return",
                            "open_stock",
                            "stock_transfer_in",
                          ].includes(transaction.transactionType);
                          const sign = isPositive ? "+" : "-";
                          const quantityChange = isPositive
                            ? transaction.quantity
                            : Math.abs(transaction.quantity);
                          const quantityClass = isPositive
                            ? "text-success"
                            : "text-danger";

                          return (
                            <tr key={transaction.id || index}>
                              <td>
                                {getTransactionLabel(
                                  transaction.transactionType
                                )}
                              </td>
                              <td className={quantityClass}>
                                {sign}
                                {quantityChange}
                              </td>
                              <td>{transaction.newQuantity || "N/A"}</td>
                              <td>{formatDate(transaction.date)}</td>
                              <td>{transaction.referenceNumber || "N/A"}</td>
                              <td>
                                {transaction.customerSupplierInfo || "N/A"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No Stock History Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing 1 to {stockHistory.length} of {stockHistory.length}{" "}
                    entries
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary">
                      Previous
                    </button>
                    <button className="btn btn-sm btn-outline-secondary ms-1">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductStockHistory;

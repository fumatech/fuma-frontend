// ViewSaleReturn.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css";
import axios from "axios";

function ViewSaleReturn() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderDate, setOrderDate] = useState();
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalSaleReturnUnits, setTotalSaleReturnUnits] = useState(0);
  const [taxRates, setTaxRates] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [netTotalAmount, setNetTotalAmount] = useState();
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/tax/getall`)
      .then((response) => {
        setTaxRates(response.data);
        const rateOptions = [
          { value: "", label: "None", rate: 0 },
          ...response.data.map((rate) => ({
            value: rate.id,
            label: `${rate.taxName} (${rate.taxValue}%)`,
            rate: rate.taxValue,
          })),
        ];
        setTaxOptions(rateOptions);
      })
      .catch((error) => console.error("Error fetching tax rates:", error));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://fusionmastertech.com:8443/franchise-purchase-return/get/${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch data");

        const purchase = await response.json();
        setVendor(purchase.vendor);
        setReferenceNumber(purchase.referenceNumber);
        setAddedBy(purchase.addedBy);
        setOrderDate(new Date(purchase.orderDate));
        setLocation(purchase.location);
        setAdditionalNotes(purchase.additionalNotes);
        setNetTotalAmount(purchase.netTotalAmount);
        const selected = purchase.franchisePurchaseReturnItems.map((item) => {
          const matchedTax = taxRates.find((rate) => rate.id === item.tax);
          const taxRate = matchedTax ? matchedTax.taxValue : 0;
          const unitPrice = Number(item.unitPrice) || 0;
          const updatedQty = Number(item.updatedQuantity) || 0;
          const subTotal = updatedQty * unitPrice;
          const taxAmount = (subTotal * taxRate) / 100;
          const totalWithTax = subTotal + taxAmount;

          return {
            id: item.id,
            productName: item.productName,
            sku: item.productSku,
            quantity: Number(item.quantity) || 0,
            updatedQuantity: updatedQty,
            variationValue: item.productVariationName,
            productVariationId: item.productVariationId,
            unitPrice,
            taxRate,
            taxRateId: item.tax,
            taxAmount,
            lineTotal: subTotal,
            totalWithTax,
          };
        });

        const selectedVar = {};
        purchase.franchisePurchaseReturnItems.forEach((item) => {
          selectedVar[item.productVariationId] = true;
        });

        setSelectedProducts(selected);
        setSelectedVariations(selectedVar);
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };
    fetchData();
  }, [id, taxRates]);

  useEffect(() => {
    const totalQty = selectedProducts.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0
    );
    const totalAccepted = selectedProducts.reduce(
      (sum, p) => sum + (p.updatedQuantity || 0),
      0
    );
    setTotalUnits(totalQty);
    setTotalSaleReturnUnits(totalAccepted);
  }, [selectedProducts]);

  const handleUpdatedQuantityChange = (id, variationId, value) => {
    const updatedQty = Number(value) || 0;
    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.id === id && product.productVariationId === variationId) {
          const subTotal = updatedQty * product.unitPrice;
          const taxAmount = (subTotal * product.taxRate) / 100;
          return {
            ...product,
            updatedQuantity: updatedQty,
            lineTotal: subTotal,
            taxAmount,
            totalWithTax: subTotal + taxAmount,
          };
        }
        return product;
      })
    );
  };

  const handlePriceChange = (id, variationId, value) => {
    const unitPrice = Number(value) || 0;
    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.id === id && product.productVariationId === variationId) {
          const subTotal = unitPrice * product.updatedQuantity;
          const taxAmount = (subTotal * product.taxRate) / 100;
          return {
            ...product,
            unitPrice,
            lineTotal: subTotal,
            taxAmount,
            totalWithTax: subTotal + taxAmount,
          };
        }
        return product;
      })
    );
  };

  const handleTaxChange = (id, variationId, taxId) => {
    const selectedTax = taxOptions.find((opt) => opt.value === taxId);
    const taxRate = selectedTax ? selectedTax.rate : 0;
    setSelectedProducts((prev) =>
      prev.map((product) => {
        if (product.id === id && product.productVariationId === variationId) {
          const subTotal = product.unitPrice * product.updatedQuantity;
          const taxAmount = (subTotal * taxRate) / 100;
          return {
            ...product,
            taxRate,
            taxRateId: taxId,
            lineTotal: subTotal,
            taxAmount,
            totalWithTax: subTotal + taxAmount,
          };
        }
        return product;
      })
    );
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">View Sale Return</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <label>
                      Franchise<span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control rounded"
                      value={vendor}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label>
                      Reference No<span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control rounded"
                      value={referenceNumber}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label>
                      Added By<span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control rounded"
                      value={addedBy}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Return Date</label>
                    <DatePicker
                      selected={orderDate}
                      className="form-control py-3 rounded-1"
                      dateFormat="MM/dd/yyyy"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                {selectedProducts.length > 0 && (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product Name</th>
                          <th>Unit Price</th>
                          <th>Return Quantity</th>
                          <th>Accepted Return Quantity</th>
                          <th>Sub Total</th>
                          <th>Tax</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.map((p, idx) => (
                          <tr key={`${p.id}-${p.productVariationId}`}>
                            <td>{idx + 1}</td>
                            <td>
                              {p.productName} ({p.sku}) {p.variationValue}
                            </td>
                            <td>
                              <input
                                type="number"
                                value={p.unitPrice}
                                // min="1"
                                readOnly
                                onChange={(e) =>
                                  handlePriceChange(
                                    p.id,
                                    p.productVariationId,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={p.quantity}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={p.updatedQuantity}
                                // min="0"
                                readOnly
                                onChange={(e) =>
                                  handleUpdatedQuantityChange(
                                    p.id,
                                    p.productVariationId,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>{(p.lineTotal || 0).toFixed(2)}</td>
                            <td>
                              <select
                                className="form-control"
                                value={p.taxRateId || ""}
                                onChange={(e) =>
                                  handleTaxChange(
                                    p.id,
                                    p.productVariationId,
                                    e.target.value
                                  )
                                }
                                isDisabled={true}
                                disabled
                              >
                                <option value="">None</option>
                                {taxOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>{(p.totalWithTax || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div>Total units : {totalUnits}</div>
                    <div>Total Accepted units : {totalSaleReturnUnits}</div>
                    <div>Net Total Amount:{netTotalAmount}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                <label>Additional Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={additionalNotes}
                  readOnly
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ViewSaleReturn;

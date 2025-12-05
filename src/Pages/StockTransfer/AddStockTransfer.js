import React from "react";
import { useState, useEffect } from "react";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// const products = [
//   { id: 1, name: "Product 1", price: 10.0 },
//   { id: 2, name: "Product 2", price: 20.0 },
//   { id: 3, name: "Product 3", price: 30.0 },
//   // Add more products as needed
// ];

function AddStockTransfer() {
  const [status, setStatus] = useState("");
  const [locationFrom, setLocationFrom] = useState("");
  const [locationTo, setLocationTo] = useState("");
  const [saleDate, setSaleDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productList, setProductList] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shippingCharges, setShippingCharges] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [totalShippingAmount, setTotalShippingAmount] = useState(0);

  useEffect(() => {
    // Assuming you would set totalAmount based on other dynamic content or API responses
    setTotalShippingAmount(0); // Example static assignment for demonstration
  }, []);

  const handleShippingChargesChange = (e) => {
    setShippingCharges(e.target.value);
    updateTotalAmount();
  };

  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };

  const updateTotalAmount = () => {
    // Update total amount logic if needed
    // Example: totalAmount calculation with shipping charges
    const calculatedTotal =
      parseFloat(totalAmount) + parseFloat(shippingCharges || 0);
    setTotalShippingAmount(calculatedTotal.toFixed(2));
  };
  // Update total amount based on shipping charges
  useEffect(() => {
    updateTotalAmount();
  }, [shippingCharges]);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://api.example.com/products");
      setFilteredProducts(response.data);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products on component mount
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      fetchProducts(); // Re-fetch the original list if searchTerm is cleared
    }
  }, [searchTerm, filteredProducts]); // Added filteredProducts as a dependency

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductList([...productList, { ...product, quantity: 1 }]);
    setTotalAmount(totalAmount + product.price);
  };

  const handleQuantityChange = (index, quantity) => {
    const newProductList = [...productList];
    newProductList[index].quantity = quantity;
    const newTotalAmount = newProductList.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    setProductList(newProductList);
    setTotalAmount(newTotalAmount);
  };

  const handleStatusChange = (event) => setStatus(event.target.value);
  const handleLocationFromChange = (event) =>
    setLocationFrom(event.target.value);
  const handleLocationToChange = (event) => setLocationTo(event.target.value);

  const statusTooltip = (
    <Tooltip id="status-tooltip">
      Stock transfer will not be editable if status is completed
    </Tooltip>
  );

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-md-6">
                  <h1 className=" all-heading">Add Stock Transfer</h1>
                </div>
              </div>
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">
              <form>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      {/* Date */}
                      <div className="col-md-4 ">
                        <div className="form-group d-flex flex-row  flex-md-column ">
                          <label htmlFor="transaction_date">Sale Date:*</label>
                          <DatePicker
                            selected={saleDate}
                            onChange={(date) => setSaleDate(date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                          />
                        </div>
                      </div>

                      {/* Reference No */}
                      <div className="form-group col-md-4">
                        <label htmlFor="referenceNo">Reference No:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="referenceNo"
                          name="referenceNo"
                        />
                      </div>

                      {/* Status */}
                      <div className="form-group col-md-4">
                        <label htmlFor="status">
                          Status:*
                          <span>
                            <OverlayTrigger
                              placement="bottom"
                              overlay={statusTooltip}
                            >
                              <i className="fa fa-info-circle text-info mr-2" />
                            </OverlayTrigger>
                          </span>
                        </label>
                        <div className="d-flex align-items-center">
                          <select
                            id="status"
                            name="status"
                            className="form-control"
                            required
                            value={status}
                            onChange={handleStatusChange}
                          >
                            <option value="" disabled>
                              Please Select
                            </option>
                            <option value="pending">Pending</option>
                            <option value="in_transit">In Transit</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      {/* Location (From) */}
                      <div className="form-group col-md-6">
                        <label htmlFor="location_id">Location (From):*</label>
                        <select
                          id="location_id"
                          name="location_id"
                          className="form-control"
                          required
                          value={locationFrom}
                          onChange={handleLocationFromChange}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          {/* Populate dynamically */}
                          <option value="1">Awesome Shop</option>
                        </select>
                      </div>

                      {/* Location (To) */}
                      <div className="form-group col-md-6">
                        <label htmlFor="transfer_location_id">
                          Location (To):*
                        </label>
                        <select
                          id="transfer_location_id"
                          name="transfer_location_id"
                          className="form-control"
                          required
                          value={locationTo}
                          onChange={handleLocationToChange}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          {/* Populate dynamically */}
                          <option value="1">Awesome Shop</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dymaic Search */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      {/* <div className="py-2 align-middle"> */}
                      <div className="row">
                        <div className="col-sm-o4fset-2">
                          <div className="form-group">
                            <div className="input-group">
                              <span className="input-group-prepend">
                                <span className="input-group-text">
                                  <i className="fa fa-search" />
                                </span>
                              </span>
                              <input
                                className="form-control ui-autocomplete-input"
                                placeholder="Search products for stock adjustment"
                                value={searchTerm}
                                onChange={handleSearchChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedProduct && (
                        <div className="row">
                          <div className="col-sm-10 col-sm-offset-1">
                            <div className="table-responsive">
                              <table className="table table-bordered table-striped table-condensed">
                                <thead>
                                  <tr>
                                    <th className="text-center">Product</th>
                                    <th className="text-center">Quantity</th>
                                    <th className="text-center">Unit Price</th>
                                    <th className="text-center">Subtotal</th>
                                    <th className="text-center">
                                      <i
                                        className="fa fa-trash"
                                        aria-hidden="true"
                                      />
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {productList.map((item, index) => (
                                    <tr key={item.id}>
                                      <td>{item.name}</td>
                                      <td>
                                        <input
                                          type="number"
                                          value={item.quantity}
                                          min="1"
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              index,
                                              parseInt(e.target.value, 10)
                                            )
                                          }
                                        />
                                      </td>
                                      <td>{item.price.toFixed(2)}</td>
                                      <td>
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}
                                      </td>
                                      <td>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => {
                                            const newProductList =
                                              productList.filter(
                                                (_, i) => i !== index
                                              );
                                            const removedProduct =
                                              productList[index];
                                            setProductList(newProductList);
                                            setTotalAmount(
                                              totalAmount -
                                                removedProduct.price *
                                                  removedProduct.quantity
                                            );
                                          }}
                                        >
                                          <i className="fa fa-trash" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="text-center">
                                    <td colSpan={3} />
                                    <td>
                                      <div className="pull-right">
                                        <b>Total: </b>
                                        <span>{totalAmount.toFixed(2)}</span>
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                      {loading && <div>Loading...</div>}
                      {error && (
                        <div className="alert alert-danger">{error}</div>
                      )}
                      <div className="row">
                        <div className="col-sm-10 col-sm-offset-1">
                          {filteredProducts.length > 0 && (
                            <ul className="list-group">
                              {filteredProducts.map((product) => (
                                <li
                                  key={product.id}
                                  className="list-group-item d-flex justify-content-between align-items-center"
                                  onClick={() => handleProductSelect(product)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {product.name}
                                  <span className="badge badge-primary badge-pill">
                                    {product.price.toFixed(2)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      {/* </div> */}
                    </div>
                  </div>
                </div>

                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      {/* Shipping Charges */}
                      <div className=" col-md-4">
                        <div className="form-group">
                          <label htmlFor="shipping_charges">
                            Shipping Charges:
                          </label>
                          <input
                            className="form-control input_number"
                            placeholder="Shipping Charges"
                            name="shipping_charges"
                            type="number"
                            value={shippingCharges}
                            onChange={handleShippingChargesChange}
                            id="shipping_charges"
                          />
                        </div>
                      </div>

                      {/* Additional Notes: */}
                      <div className=" col-md-4">
                        <div className="form-group">
                          <label htmlFor="additional_notes">
                            Additional Notes:
                          </label>
                          <textarea
                            className="form-control"
                            rows={2}
                            name="additional_notes"
                            id="additional_notes"
                            value={additionalNotes}
                            onChange={handleAdditionalNotesChange}
                          />
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="col-md-4 pt-md-5 text-right">
                        <b>Total Amount:</b>{" "}
                        <span id="final_total_text">{totalShippingAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="container-fluid text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2 "
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default AddStockTransfer;

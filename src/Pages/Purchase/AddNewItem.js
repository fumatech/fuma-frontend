import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

function AddNewItem() {
  const [defaultPurchasePrice, setDefaultPurchasePrice] = useState({
    excTax: "",
    incTax: "",
  });

  const [profitMargin, setProfitMargin] = useState(25.0);
  const [defaultSellingPrice, setDefaultSellingPrice] = useState({
    excTax: "",
    incTax: "",
  });

  const handlePurchasePriceChange = (e) => {
    const { name, value } = e.target;
    setDefaultPurchasePrice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfitMarginChange = (e) => {
    setProfitMargin(e.target.value);
  };

  const handleSellingPriceChange = (e) => {
    const { name, value } = e.target;
    setDefaultSellingPrice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading">Add new products</h1>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid"></div>
            <form>
              <div className="card card-default rounded-4 border-0 cardHover">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="dropdown">
                        <div className="">
                          <label className="me-2 d-md-inline">
                            product name
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="productName"
                            name="productName"
                            placeholder="Enter here.."
                            // value={referenceNumber}
                            // onChange={(e) => setReferenceNumber(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* SKU No */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="SKUNumber">
                          SKU No<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control rounded"
                          id="SKUNumber"
                          name="SKUNumber"
                          placeholder="Enter here.."
                          // value={SKUNumber}
                          // onChange={(e) => setSKUNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/*Barcode Types */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="barcode_type">Barcode Type:*</label>
                        <select
                          className="form-control select2"
                          required
                          id="barcode_type"
                          name="barcode_type"
                          //   value={barcodeType}
                          //   onChange={handleChange}
                        >
                          <option value="C128">Code 128 (C128)</option>
                          <option value="C39">Code 39 (C39)</option>
                          <option value="EAN13">EAN-13</option>
                          <option value="EAN8">EAN-8</option>
                          <option value="UPCA">UPC-A</option>
                          <option value="UPCE">UPC-E</option>
                        </select>
                      </div>
                    </div>

                    {/* Unit  */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="unit_id">Unit:*</label>
                        <select
                          className="form-control select2"
                          required
                          id="unit_id"
                          name="unit_id"
                          //   value={unitId}
                          //   onChange={handleChange}
                        >
                          <option value="" selected>
                            Please Select
                          </option>
                          <option value="1">Pieces (Pc(s))</option>
                        </select>
                      </div>
                    </div>

                    {/* Brand */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="brand_id">Brand:</label>
                        <select
                          className="form-control select2"
                          id="brand_id"
                          name="brand_id"
                          //   value={brandId}
                          //   onChange={handleChange}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          {/* Add your brand options here */}
                          {/* Example: */}
                          <option value="1">Brand 1</option>
                          <option value="2">Brand 2</option>
                          <option value="3">Brand 3</option>
                        </select>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="category_id">Category:</label>
                        <select
                          className="form-control select2"
                          id="category_id"
                          name="category_id"
                          //   value={categoryId}
                          //   onChange={handleChange}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          {/* Add your category options here */}
                          {/* Example: */}
                          <option value="1">Category 1</option>
                          <option value="2">Category 2</option>
                          <option value="3">Category 3</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <br />
                        <label>
                          <div>
                            <input
                              className="input-icheck"
                              id="enable_stock"
                              //   checked={enableStock}
                              name="enable_stock"
                              type="checkbox"
                              // value="1"
                              // onChange={handleStockChange}
                              style={{ position: "absolute", opacity: 0 }}
                            />
                            <ins
                              className="iCheck-helper"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                display: "block",
                                width: "100%",
                                height: "100%",
                                margin: 0,
                                padding: 0,
                                background: "#fff",
                                border: 0,
                                opacity: 0,
                              }}
                            ></ins>
                          </div>
                          <strong>Manage Stock?</strong>
                        </label>
                        <i
                          className="fa fa-info-circle text-info hover-q no-print"
                          aria-hidden="true"
                          data-container="body"
                          data-toggle="popover"
                          data-placement="auto bottom"
                          data-content="Enable or disable stock management for a product. <br><br><small class='text-muted'>Stock Management should be disabled mostly for services. Example: Hair-Cutting, Repairing, etc.</small>"
                          data-html="true"
                          data-trigger="hover"
                        />
                        <p className="help-block">
                          <i>Enable stock management at product level</i>
                        </p>
                      </div>
                    </div>

                    <div className="col-md-4" id="alert_quantity_div">
                      <div className="form-group">
                        <label htmlFor="alert_quantity">Alert quantity:</label>
                        <input
                          className="form-control input_number"
                          placeholder="Alert quantity"
                          min="0"
                          name="alert_quantity"
                          type="text"
                          id="alert_quantity"
                          // value={alertQuantity}
                          // onChange={handleAlertQuantityChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="product_locations">
                          Business Locations:
                        </label>
                        <i
                          className="fa fa-info-circle text-info hover-q no-print"
                          aria-hidden="true"
                          data-container="body"
                          data-toggle="popover"
                          data-placement="auto bottom"
                          data-content="Locations where product will be available."
                          data-html="true"
                          data-trigger="hover"
                        />
                        <select
                          className="form-control select2"
                          multiple
                          id="product_locations"
                          name="product_locations[]"
                          // value={productLocations}
                          // onChange={handleLocation}
                        >
                          <option value="1" selected>
                            Fuma (BL0001)
                          </option>
                          {/* Add more options as needed */}
                          <option value="2">Location 2</option>
                          <option value="3">Location 3</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="weight">Weight:</label>
                        <input
                          className="form-control"
                          placeholder="Weight"
                          name="weight"
                          type="text"
                          id="weight"
                          // value={weight}
                          // onChange={handleWeightChange}
                        />
                      </div>
                    </div>

                    <div className="clearfix">
                      <div className="col-md-8">
                        <div className="form-group">
                          <label htmlFor="product_description">
                            Product Description:
                          </label>
                          <textarea
                            className="form-control"
                            name="product_description"
                            cols="50"
                            rows="10"
                            id="product_description"
                            // value={productDescription}
                            // onChange={handleDescriptionChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="tax">Applicable Tax:</label>
                        <select
                          className="form-control select2"
                          id="tax"
                          name="tax"
                          // value={tax}
                          // onChange={handleTaxChange}
                        >
                          <option value="">Please Select</option>
                          <option value="none">None</option>
                          {/* Add other tax options as needed */}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="tax_type">
                          Selling Price Tax Type:*
                        </label>
                        <select
                          className="form-control select2"
                          required
                          id="tax_type"
                          name="tax_type"
                          // value={taxType}
                          // onChange={handleTaxTypeChange}
                        >
                          <option value="inclusive">Inclusive</option>
                          <option value="exclusive">Exclusive</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <br />
                        <label>
                          <input
                            className="input-icheck"
                            name="not_for_selling"
                            type="checkbox"
                            value="1"
                            //   checked={notForSelling}
                            //   onChange={handleCheckboxChange}
                            style={{ marginRight: "5px" }}
                          />
                          <span>Not for selling</span>
                        </label>
                        <i
                          className="fa fa-info-circle text-info hover-q no-print"
                          aria-hidden="true"
                          data-container="body"
                          data-toggle="popover"
                          data-placement="auto bottom"
                          data-content="If checked, product will not be displayed in sales screen for selling purposes."
                          data-html="true"
                          data-trigger="hover"
                          title=""
                        />
                      </div>
                    </div>

                    <div className="clearfix"></div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="product_custom_field1">
                          Custom Field1:
                        </label>
                        <input
                          className="form-control"
                          placeholder="Custom Field1"
                          name="customField1"
                          type="text"
                          id="product_custom_field1"
                          // value={customFields.customField1}
                          // onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="product_custom_field2">
                          Custom Field2:
                        </label>
                        <input
                          className="form-control"
                          placeholder="Custom Field2"
                          name="customField2"
                          type="text"
                          id="product_custom_field2"
                          // value={customFields.customField2}
                          // onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="product_custom_field3">
                          Custom Field3:
                        </label>
                        <input
                          className="form-control"
                          placeholder="Custom Field3"
                          name="customField3"
                          type="text"
                          id="product_custom_field3"
                          // value={customFields.customField3}
                          // onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label htmlFor="product_custom_field4">
                          Custom Field4:
                        </label>
                        <input
                          className="form-control"
                          placeholder="Custom Field4"
                          name="customField4"
                          type="text"
                          id="product_custom_field4"
                          // value={customFields.customField4}
                          // onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="clearfix"></div>
                  </div>

                  <div className="row">
                    <div className="form-group col-md-12">
                      <div className="table-responsive">
                        <table className="table table-bordered add-product-price-table table-condensed">
                          <thead>
                            <tr>
                              <th>Default Purchase Price</th>
                              <th>
                                x Margin(%)
                                <i
                                  className="fa fa-info-circle text-info hover-q no-print"
                                  aria-hidden="true"
                                  data-container="body"
                                  data-toggle="popover"
                                  data-placement="auto bottom"
                                  data-content="Default profit margin for the product. <br><small class='text-muted'>(<i>You can manage default profit margin in Business Settings.</i>)</small>"
                                  data-html="true"
                                  data-trigger="hover"
                                  title=""
                                ></i>
                              </th>
                              <th>Default Selling Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <div className="row">
                                  <div className="col-sm-6">
                                    <label htmlFor="single_dpp">
                                      Exc. tax:*
                                    </label>
                                    <input
                                      className="form-control input-sm dpp input_number"
                                      placeholder="Exc. tax"
                                      required
                                      name="excTax"
                                      type="text"
                                      id="single_dpp"
                                      aria-required="true"
                                      value={defaultPurchasePrice.excTax}
                                      onChange={handlePurchasePriceChange}
                                    />
                                  </div>

                                  <div className="col-sm-6">
                                    <label htmlFor="single_dpp_inc_tax">
                                      Inc. tax:*
                                    </label>
                                    <input
                                      className="form-control input-sm dpp_inc_tax input_number"
                                      placeholder="Inc. tax"
                                      required
                                      name="incTax"
                                      type="text"
                                      id="single_dpp_inc_tax"
                                      aria-required="true"
                                      value={defaultPurchasePrice.incTax}
                                      onChange={handlePurchasePriceChange}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td>
                                <br />
                                <input
                                  className="form-control input-sm input_number"
                                  id="profit_percent"
                                  required
                                  name="profit_percent"
                                  type="text"
                                  value={profitMargin}
                                  aria-required="true"
                                  onChange={handleProfitMarginChange}
                                />
                              </td>

                              <td>
                                <label>
                                  <span className="dsp_label">Exc. tax</span>
                                </label>
                                <input
                                  className="form-control input-sm dsp input_number"
                                  placeholder="Exc. tax"
                                  id="single_dsp"
                                  required
                                  name="excTax"
                                  type="text"
                                  aria-required="true"
                                  value={defaultSellingPrice.excTax}
                                  onChange={handleSellingPriceChange}
                                />

                                <input
                                  className="form-control input-sm hide input_number"
                                  placeholder="Inc. tax"
                                  id="single_dsp_inc_tax"
                                  required
                                  name="incTax"
                                  type="text"
                                  aria-required="true"
                                  value={defaultSellingPrice.incTax}
                                  onChange={handleSellingPriceChange}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}

export default AddNewItem;

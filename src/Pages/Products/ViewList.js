import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Add this import
import axios from "axios";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";

function ViewList() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [stockData, setStockData] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [taxes, setTaxes] = useState([]); // State for taxes
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const parseComboVariations = (comboString) => {
    try {
      return JSON.parse(comboString);
    } catch (e) {
      console.error("Error parsing comboVariations:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all necessary data in parallel
        const [productRes, categoriesRes, brandsRes, unitsRes, taxesRes] =
          await Promise.all([
            axios.get(
              `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
            ),
            axios.get(`${process.env.REACT_APP_BASE_URL}/categories/getall`),
            axios.get(`${process.env.REACT_APP_BASE_URL}/brands/getall`),
            axios.get(`${process.env.REACT_APP_BASE_URL}/units/getall`),
            axios.get(`${process.env.REACT_APP_BASE_URL}/tax/getall`), // Fetch taxes
          ]);

        setProduct(productRes.data);
        setCategories(categoriesRes.data);
        setBrands(brandsRes.data);
        setUnits(unitsRes.data);
        setTaxes(taxesRes.data);

        // Fetch stock data for each variation
        const stockPromises = productRes.data.productVariations.map(
          (variation) =>
            axios.get(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock-byvariation/${variation.id}`
            )
        );

        const stockResults = await Promise.all(stockPromises);
        const stockDataMap = {};
        stockResults.forEach((res, index) => {
          const variationId = productRes.data.productVariations[index].id;
          stockDataMap[variationId] =
            typeof res.data === "number" ? res.data : 0;
        });
        setStockData(stockDataMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Helper functions to get names by ID
  const getCategoryName = (id) => {
    const category = categories.find((cat) => cat.id == id);
    return category ? category.categoryName : id;
  };
  const getTaxDetails = (id) => {
    if (!id) return "N/A";
    const tax = taxes.find((t) => t.id == id);
    return tax ? `${tax.taxName} (${tax.taxValue}%)` : id;
  };

  const getBrandName = (id) => {
    const brand = brands.find((b) => b.id == id);
    return brand ? brand.brandName : id;
  };

  const getUnitName = (id) => {
    const unit = units.find((u) => u.id == id);
    return unit ? unit.name : id;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading product details...</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="alert alert-danger">Product not found</div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6 d-flex align-items-center">
                  <BackButton />
                  <h1>View Product</h1>
                </div>
              </div>

              {/* Wrap the content in a printable area */}
              <div id="printable-area">
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-12">
                        <div className="invoice p-3 mb-3">
                          <div className="row">
                            <div className="col-12">
                              <h4>
                                {product.productName}
                                <small className="float-right">
                                  Date: {new Date().toLocaleDateString()}
                                </small>
                              </h4>
                            </div>
                          </div>

                          <div className="row invoice-info">
                            <div className="col-md-3 invoice-col">
                              <address>
                                <strong>Category:</strong>{" "}
                                {getCategoryName(product.category)}
                                <br />
                                <strong>Brand:</strong>{" "}
                                {getBrandName(product.brand)}
                                <br />
                                <strong>Unit:</strong>{" "}
                                {getUnitName(product.unit)}
                                <br />
                                <strong>Product Type:</strong>{" "}
                                {product.productType}
                                <br />
                                <strong>Description:</strong>{" "}
                                {product.description}
                              </address>
                            </div>

                            <div className="col-md-3 invoice-col">
                              <address>
                                <strong>SKU:</strong> {product.sku}
                                <br />
                                <strong>Barcode:</strong> {product.barcode}
                                <br />
                                <strong>Available In Locations:</strong>{" "}
                                {product.businessLocation}
                                <br />
                                <strong>Manage Stock:</strong>{" "}
                                {product.manageStock ? "Yes" : "No"}
                                <br />
                                <strong>Alert quantity:</strong>{" "}
                                {product.alertQuantity || ""}
                              </address>
                            </div>

                            <div className="col-md-3 invoice-col">
                              <address>
                                <strong>Expires in:</strong>{" "}
                                {product.expiryPeriod || "Not applicable"}
                                <br />
                                <strong>Selling Price tax type:</strong>{" "}
                                {product.sellingPriceTaxType || "Exclusive"}
                                <br />
                                <strong>Applicable Tax:</strong>{" "}
                                {getTaxDetails(product.applicableTax)}
                              </address>
                            </div>

                            <div className="col-md-3">
                              {product.productImage && (
                                <img
                                  src={`${process.env.REACT_APP_BASE_URL}${product.productImage}`}
                                  alt={product.productName}
                                  className="img-fluid rounded"
                                  style={{
                                    maxWidth: "200px",
                                    maxHeight: "200px",
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Product Variations */}
                          <div className="row mt-4">
                            <div className="col-12">
                              <h5>Product Variations</h5>
                              <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                  <thead className="thead-light">
                                    <tr>
                                      <th>#</th>
                                      <th>Variation Name</th>
                                      <th>Sub SKU</th>
                                      <th>Current Stock</th>
                                      <th>Purchase Price (Exc. Tax)</th>
                                      <th>Purchase Price (Inc. Tax)</th>
                                      <th>Selling Price</th>
                                      <th>Margin</th>
                                      <th>Image</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.productVariations.map(
                                      (variation, index) => {
                                        if (
                                          product.productType === "COMBO" &&
                                          variation.comboVariations
                                        ) {
                                          const comboItems =
                                            parseComboVariations(
                                              variation.comboVariations
                                            );
                                          return comboItems.map((item, i) => (
                                            <tr key={`${variation.id}-${i}`}>
                                              <td>
                                                {index + 1}.{i + 1}
                                              </td>
                                              <td>{item.productName}</td>
                                              <td>{item.subSku || "-"}</td>
                                              <td>{`1 ${getUnitName(
                                                product.unit
                                              )}`}</td>
                                              <td>
                                                {item.defaultPurchasePriceExcTax ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {item.defaultPurchasePriceIncTax ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {item.defaultSellingPrice ||
                                                  "N/A"}
                                              </td>
                                              <td>{item.margin}</td>
                                              <td>-</td>
                                            </tr>
                                          ));
                                        } else {
                                          return (
                                            <tr key={variation.id}>
                                              <td>{index + 1}</td>
                                              <td>
                                                {variation.variationValue ||
                                                  variation.variationName}
                                              </td>
                                              <td>{variation.subSku}</td>
                                              <td>
                                                {stockData[variation.id] !==
                                                  undefined
                                                  ? `${stockData[variation.id]
                                                  } ${getUnitName(
                                                    product.unit
                                                  )}`
                                                  : 0}
                                              </td>
                                              <td>
                                                {variation.defaultPurchasePriceExcTax ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {variation.defaultPurchasePriceIncTax ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {variation.defaultSellingPrice ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {variation.margin || "N/A"}%
                                              </td>
                                              <td>
                                                {variation.variationProductImages ? (
                                                  <img
                                                    src={`${process.env.REACT_APP_BASE_URL}${variation.variationProductImages}`}
                                                    alt="Variation"
                                                    style={{
                                                      width: "50px",
                                                      height: "50px",
                                                      objectFit: "cover",
                                                    }}
                                                  />
                                                ) : (
                                                  "No image"
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        }
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          {/* Product Stock */}
                          <div className="row mt-4">
                            <div className="col-12">
                              <h5>Product Stock Details</h5>
                              <div className="table-responsive">
                                <table className="table table-bordered table-hover">
                                  <thead className="thead-light">
                                    <tr>
                                      <th>#</th>
                                      <th>Sub SKU</th>
                                      <th>Product Name</th>
                                      <th>Location</th>
                                      <th>Unit Price</th>
                                      <th>Current Stock</th>
                                      <th>Stock Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.productVariations.map(
                                      (variation, index) => {
                                        if (
                                          product.productType === "COMBO" &&
                                          variation.comboVariations
                                        ) {
                                          const comboItems =
                                            parseComboVariations(
                                              variation.comboVariations
                                            );
                                          return comboItems.map((item, i) => (
                                            <tr
                                              key={`${variation.id}-stock-${i}`}
                                            >
                                              <td>
                                                {index + 1}.{i + 1}
                                              </td>
                                              <td>{item.subSku || "-"}</td>
                                              <td>{item.productName}</td>
                                              <td>
                                                {product.businessLocation}
                                              </td>
                                              <td>
                                                {item.defaultSellingPrice ||
                                                  "N/A"}
                                              </td>
                                              <td>{`1 ${getUnitName(
                                                product.unit
                                              )}`}</td>
                                              <td>
                                                {item.defaultSellingPrice
                                                  ? (
                                                    item.defaultSellingPrice *
                                                    1
                                                  ).toFixed(2)
                                                  : "N/A"}
                                              </td>
                                            </tr>
                                          ));
                                        } else {
                                          return (
                                            <tr key={variation.id}>
                                              <td>{index + 1}</td>
                                              <td>{variation.subSku}</td>
                                              <td>
                                                {product.productName} -{" "}
                                                {variation.variationValue ||
                                                  variation.variationName}
                                              </td>
                                              <td>
                                                {product.businessLocation}
                                              </td>
                                              <td>
                                                {variation.defaultSellingPrice ||
                                                  "N/A"}
                                              </td>
                                              <td>
                                                {stockData[variation.id] !==
                                                  undefined
                                                  ? `${stockData[variation.id]
                                                  } ${getUnitName(
                                                    product.unit
                                                  )}`
                                                  : 0}
                                              </td>
                                              <td>
                                                {variation.defaultSellingPrice &&
                                                  stockData[variation.id] !==
                                                  undefined
                                                  ? (
                                                    variation.defaultSellingPrice *
                                                    stockData[variation.id]
                                                  ).toFixed(2)
                                                  : "N/A"}
                                              </td>
                                            </tr>
                                          );
                                        }
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print and Back Buttons */}
              <div className="row no-print">
                <div className="col-12">
                  <button
                    type="button"
                    className="btn btn-primary float-right mr-2"
                    onClick={handlePrint}
                  >
                    <i className="fas fa-print mr-1"></i> Print
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary float-right mr-2"
                    onClick={() => window.history.back()}
                  >
                    <i className="fas fa-arrow-left mr-1"></i> Back
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

export default ViewList;

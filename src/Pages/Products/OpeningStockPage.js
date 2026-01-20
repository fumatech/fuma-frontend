import React, { useState, useEffect } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

const OpeningStockPage = () => {
  const { productId } = useParams(); // Fetch the product ID from URL params
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Fetch product details
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const text = await response.text();
        if (!text) throw new Error("Empty product response");
        const productData = JSON.parse(text);

        // Fetch existing stock transactions
        const stockRes = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transactions/by-product/${productId}`
        );

        let stockTransactions = [];
        if (stockRes.ok) {
          const stockText = await stockRes.text();
          stockTransactions = stockText ? JSON.parse(stockText) : [];
        }

        // Prepare rows for SINGLE, VARIABLE, or COMBO
        const rows = productData.productVariations.map((variation) => {
          const existingTx = stockTransactions.find(
            (tx) =>
              tx.variationId === variation.id &&
              tx.transactionType === "open_stock"
          );

          return {
            ...variation,
            productName: productData.productName,
            productId: productData.id,
            variationId: variation.id,
            id: existingTx?.id || null,
            totalStock: existingTx ? existingTx.quantity : "", // empty if not present
            date: existingTx ? existingTx.date : "",
            note: existingTx ? existingTx.note : "",
            defaultPurchasePriceExcTax:
              variation.defaultPurchasePriceExcTax || 0, // always show product price
          };
        });

        setSelectedProduct(rows);
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handleSave = async () => {
    if (!selectedProduct || selectedProduct.length === 0) {
      alert("No product data to save.");
      return;
    }

    try {
      for (const product of selectedProduct) {
        const payload = {
          productId: product.productId,
          variationId: product.variationId,
          quantity: Number(product.totalStock) || 0,
          transactionType: "open_stock",
          date: product.date || new Date().toISOString().split("T")[0],
          note: product.note || "Stock updated after opening stock",
        };

        if (product.id) {
          // Update existing transaction
          await fetch(
            `${process.env.REACT_APP_BASE_URL}/stock-transactions/update/${product.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
        } else {
          // Create new transaction
          await fetch(
            `${process.env.REACT_APP_BASE_URL}/stock-transactions/add`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify([payload]), // API expects array
            }
          );
        }
      }

      alert("Open Stock saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("An error occurred while saving.");
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            <h1>Add or Edit Opening Stock</h1>
            {selectedProduct.length > 0 ? (
              <div className="card card-default rounded-4 border-0 cardHover px-4 py-2">
                <p>
                  <strong>Product Name:</strong>{" "}
                  {selectedProduct[0]?.productName || "N/A"}
                </p>
                <Form>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Variation</th>
                        <th>Quantity Remaining</th>
                        <th>Unit Cost (Before Tax)</th>
                        <th>Subtotal (Before Tax)</th>
                        <th>Date</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.map((product, index) => (
                        <tr key={index}>
                          <td>{product.variationValue || "N/A"}</td>
                          <td>
                            <Form.Control
                              type="number"
                              placeholder="Enter Quantity"
                              value={product.totalStock || ""}
                              onChange={(e) => {
                                const updatedProducts = [...selectedProduct];
                                updatedProducts[index].totalStock =
                                  e.target.value;
                                setSelectedProduct(updatedProducts);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              placeholder="Enter Unit Cost"
                              value={product.defaultPurchasePriceExcTax || ""}
                              onChange={(e) => {
                                const updatedProducts = [...selectedProduct];
                                updatedProducts[
                                  index
                                ].defaultPurchasePriceExcTax = e.target.value;
                                setSelectedProduct(updatedProducts);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              value={(
                                (Number(product.totalStock) || 0) *
                                (Number(product.defaultPurchasePriceExcTax) ||
                                  0)
                              ).toFixed(2)}
                              readOnly
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="date"
                              value={product.date || ""}
                              onChange={(e) => {
                                const updatedProducts = [...selectedProduct];
                                updatedProducts[index].date = e.target.value;
                                setSelectedProduct(updatedProducts);
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              as="textarea"
                              rows={1}
                              placeholder="Enter a note"
                              value={product.note || ""}
                              onChange={(e) => {
                                const updatedProducts = [...selectedProduct];
                                updatedProducts[index].note = e.target.value;
                                setSelectedProduct(updatedProducts);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="mt-3 text-center py-4">
                    <Button variant="secondary" onClick={() => navigate(-1)}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      className="ms-2"
                    >
                      Save
                    </Button>
                  </div>
                </Form>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OpeningStockPage;

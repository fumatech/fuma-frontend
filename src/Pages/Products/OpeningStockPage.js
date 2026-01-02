import React, { useState, useEffect } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const OpeningStockPage = () => {
  const { productId } = useParams(); // Fetch the product ID from URL params
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState([]);

  useEffect(() => {
    // Fetch product details by product ID
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
        );
        const productData = await response.json();

        if (
          productData.productType === "SINGLE" ||
          productData.productType === "VARIABLE"
        ) {
          setSelectedProduct(
            productData.productVariations.map((variation) => ({
              ...variation,
              productName: productData.productName,
              productId: productData.id,
              variationId: variation.id,
              totalStock: "",
              date: "", // Initialize date for each row
              note: "", // Initialize note for each row
            }))
          );
        } else if (productData.productType === "COMBO") {
          setSelectedProduct(
            productData.productVariations.map((combo) => ({
              ...combo,
              productName: productData.productName,
              productId: productData.id,
              totalStock: "",
              date: "",
              note: "",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handleSave = async () => {
    if (!selectedProduct || selectedProduct.length === 0) {
      toast.warning("No product data to save.");
      return;
    }

    const payload = selectedProduct.map((product) => ({
      productId: product.productId,
      variationId: product.variationId,
      quantity: Number(product.totalStock) || 0,
      transactionType: "open_stock",
      date: product.date || new Date().toISOString().split("T")[0], // Use row-specific date
      note: product.note || "Stock updated after opening stock", // Use row-specific note
    }));

    // console.log(payload); // Log the payload to see the structure before sending

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-transactions/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success("Open Stock Added successfully!");
        navigate(-1); // Navigate back to the previous page
      } else {
        toast.error("Failed to save stock.");
      }
    } catch (error) {
      // console.error("Error saving data:", error);
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content ">
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
                              placeholder="Unit Cost"
                              value={product.defaultPurchasePriceExcTax || ""}
                              readOnly
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

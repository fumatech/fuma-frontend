import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function BusinessDetails() {
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState(null);

  const [businessDetails, setBusinessDetails] = useState({
    id: "",
    name: "",
    address: "",
    email: "",
    phoneNumber: "",
    website: "",
    logo: "",
    taxOrGstNumber: "",
    shopActNumber: "",
    cinNumber: "",
    panNumber: "",
  });

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/business-details/getall`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setBusinessDetails(data[0]);
        }
      } catch (error) {
        console.error("Error fetching business details:", error);
      }
    };

    fetchBusinessDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "logo" && files) {
      setLogoFile(files[0]); // store the file
    } else {
      setBusinessDetails({
        ...businessDetails,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/business-details/update/${businessDetails.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(businessDetails),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update business details");
      }

      toast.success("Business details updated successfully!");
      navigate("/Dashboard");
    } catch (error) {
      //console.error("Error updating business details:", error);
      toast.error("Failed to update business details. Please try again.");
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading fs-2">Update Business Details</h1>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid">
              <form onSubmit={handleSubmit}>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="name">Business Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={businessDetails.name}
                            onChange={handleChange}
                            placeholder="Enter Business Name"
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="address">Address</label>
                          <input
                            type="text"
                            className="form-control"
                            id="address"
                            name="address"
                            value={businessDetails.address}
                            onChange={handleChange}
                            placeholder="Enter Address"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="email">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={businessDetails.email}
                            onChange={handleChange}
                            placeholder="Enter Email"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="phoneNumber">Phone Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={businessDetails.phoneNumber}
                            onChange={handleChange}
                            placeholder="Enter Phone Number"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="website">Website</label>
                          <input
                            type="text"
                            className="form-control"
                            id="website"
                            name="website"
                            value={businessDetails.website}
                            onChange={handleChange}
                            placeholder="Enter Website"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="logo">Logo URL</label>
                          <input
                            type="text"
                            className="form-control"
                            id="logo"
                            name="logo"
                            value={businessDetails.logo}
                            onChange={handleChange}
                            placeholder="Enter Logo URL"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="taxOrGstNumber">Tax/GST Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="taxOrGstNumber"
                            name="taxOrGstNumber"
                            value={businessDetails.taxOrGstNumber}
                            onChange={handleChange}
                            placeholder="Enter Tax/GST Number"
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="shopActNumber">Shop Act Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="shopActNumber"
                            name="shopActNumber"
                            value={businessDetails.shopActNumber}
                            onChange={handleChange}
                            placeholder="Enter Shop Act Number"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="cinNumber">CIN Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cinNumber"
                            name="cinNumber"
                            value={businessDetails.cinNumber}
                            onChange={handleChange}
                            placeholder="Enter CIN Number"
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="panNumber">PAN Number</label>
                          <input
                            type="text"
                            className="form-control"
                            id="panNumber"
                            name="panNumber"
                            value={businessDetails.panNumber}
                            onChange={handleChange}
                            placeholder="Enter PAN Number"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group text-center">
                      <button type="submit" className="btn btn-primary ">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default BusinessDetails;

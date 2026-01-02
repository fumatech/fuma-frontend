import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function Permission() {
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Create the permission object with formatted name
    const permission = {
      name: `${startName}.${endName}`, // Format as "startName.endName"
    };

    try {
      // Send POST request to the API
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/permissions/save`,
        permission
      );
      toast.success("Permission saved Sucessfully");
      // console.log("Permission saved:", response.data);
      setStartName("");
      setEndName("");
    } catch (error) {
      toast.error("There was an error saving the permission!");
      // Handle error
    }
  };

  return (
    <>
      <div>
        <div className="wrapper">
          <div className="content-wrapper">
            <section className="content-header">
              <div className="container-fluid">
                <div className="row mb-2">
                  <div className="col-sm-6">
                    <h1 className="all-heading ">Add Permission</h1>
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
                            <label htmlFor="startName">
                              Start Name<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="startName"
                              name="startName"
                              value={startName}
                              onChange={(e) => setStartName(e.target.value)}
                              placeholder="Enter here.."
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="endName">
                              End Name<span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="endName"
                              name="endName"
                              value={endName}
                              onChange={(e) => setEndName(e.target.value)}
                              placeholder="Enter here..."
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="container-fluid text-center mt-3">
                    <button
                      type="submit"
                      className="btn btn-save btn-lg px-4 py-2 m-2"
                    >
                      Save
                    </button>
                  </div>
                  x
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default Permission;

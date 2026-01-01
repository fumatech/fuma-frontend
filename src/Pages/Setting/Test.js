import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function Test() {
  const [dbName, setDbName] = useState("");
  const [dbUsername, setDbUsername] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Form Data:", { dbName, dbUsername, dbPassword });

    const requestData = {
      dbName,
      dbUsername,
      dbPassword,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/create/database`,
        requestData
      );

      toast.success("Database created successfully");
      setDbName("");
      setDbUsername("");
      setDbPassword("");
    } catch (error) {
      toast.error("Failed to create database");
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading fs-2">Create New Database</h1>
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
                        <label htmlFor="dbName">Database Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="dbName"
                          value={dbName}
                          onChange={(e) => setDbName(e.target.value)}
                          required
                          placeholder="Enter Database Name"
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="dbUsername">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          id="dbUsername"
                          value={dbUsername}
                          onChange={(e) => setDbUsername(e.target.value)}
                          required
                          placeholder="Enter Username"
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="dbPassword">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          id="dbPassword"
                          value={dbPassword}
                          onChange={(e) => setDbPassword(e.target.value)}
                          required
                          placeholder="Enter Password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group text-center">
                    <button type="submit" className="btn btn-primary">
                      Create Database
                    </button>
                  </div>

                  {message && <p className="text-center mt-3">{message}</p>}
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Test;

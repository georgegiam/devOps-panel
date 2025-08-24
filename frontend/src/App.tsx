import React from "react";
import { Link } from "react-router-dom";
import { useMonitoring } from "./hooks/useMonitoring";
import LiveView from "./components/LiveView";
import HistoricalCharts from "./components/HistoricalCharts";

// css
import styles from "../src/css/App.module.css";

const App: React.FC = () => {
  const { liveData, historical } = useMonitoring();

  // Current date and time formatted
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className={`${styles.navContainer} container-fluid w-50`}>
          <Link className="navbar-brand" to="/">
            DevOps Panel
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item">
                <button
                  className="nav-link"
                  data-bs-toggle="modal"
                  data-bs-target="#exampleModal"
                >
                  <i className="fa-solid fa-headphones me-1"></i> Support
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className={`${styles.dashboard} container w-50 mb-5 mt-5`}>
        <div className="d-flex mb-3">
          <div className="me-auto align-self-center">
            <h2>Monitoring Dashboard</h2>
          </div>
          <div className="align-self-center">
            <h6>{formatted}</h6>
          </div>
        </div>

        <hr />
        <div className="alert alert-warning" role="alert">
          <i className="fa-solid fa-circle-info me-2"></i> The endpoints live
          status cards update automatically every hour.
        </div>

        {/* live status  */}
        <div className="mt-4">
          <h4 className="mb-4">Endpoints Live Status</h4>
          {liveData.length === 0 ? (
            <p>Loading live data...</p>
          ) : (
            <LiveView liveData={liveData} />
          )}
        </div>

        {/* historical charts */}
        <div className="mt-5">
          <h3 className="mb-4">Hourly Historical Data (Past Week)</h3>
          <div className="alert alert-warning" role="alert">
            <i className="fa-solid fa-circle-info me-2"></i> The endpoints
            charts update automatically every hour (at the top of the hour) and
            retain data of the past 7 days.
          </div>
          {historical.length === 0 ? (
            <p>Loading historical data...</p>
          ) : (
            <HistoricalCharts historical={historical} />
          )}
        </div>
      </div>

      <div
        className="modal fade"
        id="exampleModal"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Support
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              For any enquiries please contact{" "}
              <strong>g.giamouridis@soton.ac.uk</strong>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;

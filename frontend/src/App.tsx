import React from "react";
import { useMonitoring } from "./hooks/useMonitoring";
import LiveView from "./components/LiveView";
import HistoricalCharts from "./components/HistoricalCharts";

const App: React.FC = () => {
  const { liveData, historical } = useMonitoring();

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid w-50">
          <a className="navbar-brand" href="#">
            DevOps Panel
          </a>
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
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="#">
                  Home
                </a>
              </li> */}
            </ul>
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="#">
                  About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container w-50 mt-5">
        <h2 className="mb-4">Devops Monitoring Dashboard</h2>
        <hr />
        <div className="alert alert-warning" role="alert">
          The endpoints live status cards updates automatically every hour.
        </div>

        {/* Live Status Section */}
        <div className="mt-4">
          <h4 className="mb-4">Endpoints Live Status</h4>
          {liveData.length === 0 ? (
            <p>Loading live data...</p>
          ) : (
            <LiveView liveData={liveData} />
          )}
        </div>

        {/* Historical Charts Section */}
        <div className="mt-5">
          <h3 className="mb-4">Hourly Historical Data (Past Week)</h3>
          <div className="alert alert-warning" role="alert">
            The endpoints charts update automatically every hour (at the top of
            the hour) and retain data of the past 7 days.
          </div>
          {historical.length === 0 ? (
            <p>Loading historical data...</p>
          ) : (
            <HistoricalCharts historical={historical} />
          )}
        </div>
      </div>
    </>
  );
};

export default App;

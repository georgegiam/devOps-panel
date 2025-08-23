import React from "react";
import { useMonitoring } from "./hooks/useMonitoring";
import LiveView from "./components/LiveView";
import HistoricalCharts from "./components/HistoricalCharts";

const App: React.FC = () => {
  const { liveData, historical } = useMonitoring();

  return (
    <>
      <div className="container w-50 mt-5">
        <h1 className="mb-4">Devops Monitoring Dashboard</h1>
        <hr />

        {/* Live Status Section */}
        <div className="mt-4">
          <h4 className="mb-4">Live Status</h4>
          {liveData.length === 0 ? (
            <p>Loading live data...</p>
          ) : (
            <LiveView liveData={liveData} />
          )}
        </div>

        {/* Historical Charts Section */}
        <div className="mt-5">
          <h3 className="mb-4">Historical Data (Past Week)</h3>
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

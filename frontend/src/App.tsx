import React from "react";
import { useMonitoring } from "./hooks/useMonitoring";
import LiveView from "./components/LiveView";
import HistoricalCharts from "./components/HistoricalCharts";

const App: React.FC = () => {
  const { liveData } = useMonitoring(); // only live data

  return (
    <div className="container w-50 mt-5">
      <h1 className="mb-4">DevOps Monitoring Dashboard</h1>
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

      {/* Daily Aggregates Section */}
      <div className="mt-5">
        <h3 className="mb-4">Daily Aggregates (Past 7 Days)</h3>
        <HistoricalCharts /> {/* no prop */}
      </div>
    </div>
  );
};

export default App;

import React from "react";
import { useMonitoring } from "./hooks/useMonitoring";
import LiveView from "./components/LiveView";
import HistoricalCharts from "./components/HistoricalCharts";

const App: React.FC = () => {
  const { liveData, historical } = useMonitoring();

  return (
    <>
      <div className="container my-4">
        <h1 className="mb-4">Monitoring Dashboard</h1>

        {/* Live Status Section */}
        <section className="mb-5">
          <h3>Live Status</h3>
          {liveData.length === 0 ? (
            <p>Loading live data...</p>
          ) : (
            <LiveView liveData={liveData} />
          )}
        </section>

        {/* Historical Charts Section */}
        <section>
          <h3>Historical Data (Past Week)</h3>
          {historical.length === 0 ? (
            <p>Loading historical data...</p>
          ) : (
            <HistoricalCharts historical={historical} />
          )}
        </section>
      </div>
    </>
  );
};

export default App;

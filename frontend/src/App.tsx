import React from "react";
import { useMonitoring } from "./hooks/useMonitoring";
import LiveView from "./components/LiveView";

const App: React.FC = () => {
  const { liveData } = useMonitoring();

  return (
    <div className="container my-4">
      <h1 className="mb-4">Monitoring Dashboard</h1>

      <section className="mb-5">
        <h3>Live Status</h3>
        <LiveView liveData={liveData} />
      </section>
    </div>
  );
};

export default App;

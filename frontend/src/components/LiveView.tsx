import type { StatusCheck } from "../types";
import React from "react";

interface LiveViewProps {
  liveData: StatusCheck[];
}

const LiveView: React.FC<LiveViewProps> = ({ liveData }) => {
  return (
    <div className="row">
      {liveData.map((check) => (
        <div key={check.id} className="col-12 col-md-6 col-lg-4 mb-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="card-title">{check.region}</h4>
              <p className="card-text">
                <strong>Status:</strong>{" "}
                {check.isOnline ? (
                  <span className="text-success">Online</span>
                ) : (
                  <span className="text-danger">Offline</span>
                )}
              </p>
              <p className="card-text">
                <strong>Response time:</strong> {check.responseTime} ms
              </p>
              <p className="card-text">
                <strong>Status code:</strong> {check.statusCode}
              </p>
              <p className="card-text">
                <strong>Last update:</strong>{" "}
                {new Date(check.timestamp).toLocaleTimeString()}
              </p>
              <p className="card-text">
                <strong>Next update:</strong>{" "}
                {new Date(
                  new Date(check.timestamp).getTime() + 60 * 60 * 1000
                ).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveView;

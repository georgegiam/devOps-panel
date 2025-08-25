import type { StatusCheck } from "../types";
import React from "react";

// parse a JSON string and return null if invalid or empty
function safeParse(json: string | null): any | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// pretty print JSON for the raw section
function prettyJson(input: unknown): string {
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

// badge helper
function BoolBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="badge text-bg-success">Up</span>
  ) : (
    <span className="badge text-bg-danger">Down</span>
  );
}

interface LiveViewProps {
  liveData: StatusCheck[];
}

const LiveView: React.FC<LiveViewProps> = ({ liveData }) => {
  return (
    <div className="row">
      {liveData.map((check) => {
        const modalId = `details-${check.id}`;
        const parsed = safeParse(check.stats);

        // fields from parsed stats (optional)
        // const status = parsed?.status ?? (check.isOnline ? "ok" : "error");
        const roles: string[] = Array.isArray(parsed?.roles)
          ? parsed.roles
          : [];
        const version = parsed?.version ?? "—";
        const services = parsed?.results?.services ?? {};
        const sStats = parsed?.results?.stats ?? {};
        const server = sStats?.server ?? {};
        const workers: [string, any][] = Array.isArray(server?.workers)
          ? server.workers
          : [];

        const lastUpdateLocal = new Date(check.timestamp).toLocaleString();

        return (
          <div key={check.id} className="col-12 col-md-6 col-lg-4 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <h4 className="card-title mb-0">{check.region}</h4>
                  {check.isOnline ? (
                    <span className="badge text-bg-success">Online</span>
                  ) : (
                    <span className="badge text-bg-danger">Offline</span>
                  )}
                </div>

                <p className="text-muted mb-3">
                  Last update: {new Date(check.timestamp).toLocaleTimeString()}
                </p>

                <div className="mt-auto">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    data-bs-toggle="modal"
                    data-bs-target={`#${modalId}`}
                  >
                    Show details
                  </button>
                </div>
              </div>
            </div>

            {/* start details modal */}
            <div
              className="modal fade"
              id={modalId}
              aria-labelledby={`${modalId}-label`}
              aria-hidden="true"
            >
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h1 className="modal-title fs-5" id={`${modalId}-label`}>
                      {check.region}
                    </h1>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    />
                  </div>

                  <div className="modal-body">
                    {/* summary */}
                    <div className="mb-3">
                      <div className="row g-2">
                        <div className="col-sm-6">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Status</div>
                            <div className="mt-1">
                              {check.isOnline ? (
                                <span className="badge text-bg-success">
                                  Online
                                </span>
                              ) : (
                                <span className="badge text-bg-danger">
                                  Offline
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Endpoint URL</div>
                            <div className="mt-1">
                              <code className="text-break">
                                {check.endpoint}
                              </code>
                            </div>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Version</div>
                            <div className="mt-1">{version}</div>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Last check</div>
                            <div className="mt-1">{lastUpdateLocal}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* metrics */}
                    <div className="mb-3">
                      <div className="row g-2">
                        <div className="col-sm-6 col-lg-3">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Response time</div>
                            <div className="mt-1">{check.responseTime} ms</div>
                          </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">HTTP status</div>
                            <div className="mt-1">{check.statusCode}</div>
                          </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Online users</div>
                            <div className="mt-1">{sStats?.online ?? "—"}</div>
                          </div>
                        </div>
                        <div className="col-sm-6 col-lg-3">
                          <div className="p-2 border rounded">
                            <div className="fw-semibold">Servers</div>
                            <div className="mt-1">
                              {sStats?.servers_count ?? "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* roles */}
                    {roles.length > 0 && (
                      <div className="mb-3">
                        <div className="fw-semibold mb-1">Roles</div>
                        <div className="d-flex flex-wrap gap-2">
                          {roles.map((r) => (
                            <span key={r} className="badge text-bg-secondary">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* services */}
                    {services && Object.keys(services).length > 0 && (
                      <div className="mb-3">
                        <div className="fw-semibold mb-1">Services</div>
                        <ul className="list-group">
                          {Object.entries(services).map(([name, ok]) => (
                            <li
                              key={name}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <span className="text-capitalize">{name}</span>
                              <BoolBadge ok={Boolean(ok)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* server metrics */}
                    {(server?.cpus != null ||
                      server?.active_connections != null ||
                      sStats?.cpu_load != null ||
                      sStats?.timers != null ||
                      sStats?.wait_time != null) && (
                      <div className="mb-3">
                        <div className="fw-semibold mb-1">Server Metrics</div>
                        <div className="row g-2">
                          <div className="col-sm-6 col-lg-3">
                            <div className="p-2 border rounded">
                              <div className="fw-semibold">CPUs</div>
                              <div className="mt-1">{server?.cpus ?? "—"}</div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-3">
                            <div className="p-2 border rounded">
                              <div className="fw-semibold">
                                Active connections
                              </div>
                              <div className="mt-1">
                                {server?.active_connections ?? "—"}
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-3">
                            <div className="p-2 border rounded">
                              <div className="fw-semibold">CPU load</div>
                              <div className="mt-1">
                                {sStats?.cpu_load ?? "—"}
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6 col-lg-3">
                            <div className="p-2 border rounded">
                              <div className="fw-semibold">Timers</div>
                              <div className="mt-1">
                                {sStats?.timers ?? "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* workers table */}
                    {workers.length > 0 && (
                      <div className="mb-3">
                        <div className="fw-semibold mb-1">Workers</div>
                        <div className="table-responsive">
                          <table className="table table-sm table-striped mb-0">
                            <thead>
                              <tr>
                                <th>Worker</th>
                                <th className="text-end">Wait (ms)</th>
                                <th className="text-end">Workers</th>
                                <th className="text-end">Waiting</th>
                                <th className="text-end">Idle</th>
                                <th className="text-end">Return (ms)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workers.map(([name, w]) => (
                                <tr key={name}>
                                  <td className="text-break">{name}</td>
                                  <td className="text-end">
                                    {w?.wait_time ?? "—"}
                                  </td>
                                  <td className="text-end">
                                    {w?.workers ?? "—"}
                                  </td>
                                  <td className="text-end">
                                    {w?.waiting ?? "—"}
                                  </td>
                                  <td className="text-end">{w?.idle ?? "—"}</td>
                                  <td className="text-end">
                                    {w?.time_to_return ?? "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* raw json */}
                    <details>
                      <summary className="mb-2">Show raw JSON</summary>
                      <pre className="mb-0 p-2 border rounded bg-light">
                        {check.stats
                          ? prettyJson(parsed ?? check.stats)
                          : "No stats payload"}
                      </pre>
                    </details>
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
            {/* end details modal */}
          </div>
        );
      })}
    </div>
  );
};

export default LiveView;

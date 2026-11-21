
// import { useState } from "react";
// import ReactMarkdown from "react-markdown";

// const API_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// export default function AISecurityAnalysis({ agentId }) {
//   const [analysis, setAnalysis] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   async function generateAnalysis() {
//     if (!agentId) {
//       setError("Please select an agent first.");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `${API_URL}/ai/analyze/${agentId}`,
//         { method: "POST" }
//       );

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(data.message || "Analysis failed");
//       }

//       setAnalysis(data.analysis);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <section style={{
//       padding: "24px",
//       border: "1px solid #ddd",
//       borderRadius: "12px",
//       marginTop: "20px"
//     }}>
//       <h2>AI Security Analysis</h2>
//       <p>Analyze your latest security report using Gemini AI.</p>

//       <button
//         onClick={generateAnalysis}
//         disabled={loading || !agentId}
//       >
//         {loading ? "Analyzing..." : "Generate AI Analysis"}
//       </button>

//       {error && (
//         <p role="alert" style={{ color: "red" }}>
//           {error}
//         </p>
//       )}

//       {analysis && (
//         <article style={{
//           marginTop: "20px",
//           lineHeight: "1.7"
//         }}>
//           <ReactMarkdown>{analysis}</ReactMarkdown>
//         </article>
//       )}
//     </section>
//   );
// }


import { useState } from "react";
import ReactMarkdown from "react-markdown";
import api from "../services/api";
import "./AISecurityAnalysis.css";

function getRiskLevel(text) {
  const match = text?.match(
    /Risk Level:\s*\**\s*(Low|Medium|High|Critical)/i
  );
  return match ? match[1].toLowerCase() : "unknown";
}

function formatDate(date) {
  if (!date) return "Unknown date";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Unknown date"
    : parsed.toLocaleString();
}

export default function AISecurityAnalysis({ agentId }) {
  const [analysis, setAnalysis] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  async function generateAnalysis() {
    if (!agentId || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        `/ai/analyze/${agentId}`
      );

      if (!response.data?.success) {
        throw new Error("AI analysis failed.");
      }

      setAnalysis(response.data.analysis || "");

      if (showHistory) {
        await fetchHistory();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to generate AI analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    if (!agentId) return;

    setLoadingHistory(true);

    try {
      const response = await api.get(
        `/ai/history/${agentId}`
      );

      setHistory(response.data.analyses ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load analysis history."
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  async function toggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    setShowHistory(true);
    setError("");
    await fetchHistory();
  }

  const riskLevel = getRiskLevel(analysis);

  return (
    <section className="ai-security">
      {/* Header */}
      <div className="ai-security-header">
        <div className="ai-security-heading">
          <div className="ai-security-icon">
            🛡️
          </div>

          <div>
            <h2>AI Security Intelligence</h2>
            <p className="ai-security-subtitle">
              Gemini-powered endpoint threat assessment
            </p>
          </div>
        </div>

        <span className="ai-security-status">
          <span className="ai-status-dot" />
          AI ENGINE READY
        </span>
      </div>

      {/* Action buttons */}
      <div className="ai-security-actions">
        <button
          type="button"
          className="ai-btn ai-btn-primary"
          onClick={generateAnalysis}
          disabled={loading || !agentId}
        >
          {loading ? (
            <>
              <span className="ai-spinner" />
              Analyzing Endpoint...
            </>
          ) : (
            <>✦ Generate AI Analysis</>
          )}
        </button>

        <button
          type="button"
          className="ai-btn ai-btn-secondary"
          onClick={toggleHistory}
          disabled={loadingHistory || !agentId}
        >
          {loadingHistory
            ? "Loading History..."
            : showHistory
              ? "Hide Analysis History"
              : "◷ View Analysis History"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="ai-security-error" role="alert">
          ⚠ {error}
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && (
        <div className="ai-empty-state">
          <div className="ai-empty-icon">◎</div>
          <h3>Ready to Analyze</h3>
          <p>
            Generate an AI-powered security assessment
            for the selected endpoint.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="ai-loading-banner" role="status">
          <span className="ai-spinner" />
          Gemini is analyzing the latest security report...
        </div>
      )}

      {/* Latest analysis */}
      {analysis && (
        <div className="ai-security-panel">
          <div className="ai-panel-header">
            <div>
              <p className="ai-panel-eyebrow">
                SECURITY ASSESSMENT
              </p>
              <h3>Latest Threat Analysis</h3>
            </div>

            {riskLevel !== "unknown" && (
              <span
                className={`ai-risk-badge ai-risk-${riskLevel}`}
              >
                {riskLevel.toUpperCase()} RISK
              </span>
            )}
          </div>

          <div className="ai-security-markdown">
            <ReactMarkdown>
              {analysis}
            </ReactMarkdown>
          </div>

          <div className="ai-analysis-footer">
            <span>✦ Generated by Gemini AI</span>
            <span>Advisory assessment only</span>
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="ai-history-section">
          <div className="ai-history-heading">
            <h3>Analysis History</h3>
            <span className="ai-history-count">
              {history.length} records
            </span>
          </div>

          {loadingHistory ? (
            <div className="ai-loading-banner">
              <span className="ai-spinner" />
              Loading saved analyses...
            </div>
          ) : history.length === 0 ? (
            <div className="ai-empty-state">
              <p>No previous analyses found.</p>
            </div>
          ) : (
            <div className="ai-security-history">
              {history.map((item) => {
                const historyRisk = getRiskLevel(
                  item.analysis
                );

                return (
                  <details
                    className="ai-history-card"
                    key={item._id}
                  >
                    <summary className="ai-history-summary">
                      <div className="ai-history-meta">
                        <strong>Security Assessment</strong>
                        <span>
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      <div className="ai-history-right">
                        {historyRisk !== "unknown" && (
                          <span
                            className={`ai-risk-badge ai-risk-${historyRisk}`}
                          >
                            {historyRisk.toUpperCase()}
                          </span>
                        )}
                        <span className="ai-history-chevron">
                          ▾
                        </span>
                      </div>
                    </summary>

                    <div className="ai-history-content">
                      <div className="ai-security-markdown">
                        <ReactMarkdown>
                          {item.analysis || ""}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

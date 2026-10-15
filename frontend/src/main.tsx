import React, { Component, lazy, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const Screen = lazy(() =>
  window.location.pathname.replace(/\/$/, "") === "/review"
    ? import("./Review")
    : import("./App"),
);
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <h1>We couldn’t render this workspace.</h1>
        <p>Your source data has not changed.</p>
        <button onClick={() => location.reload()}>Reload workspace</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <Suspense fallback={<p role="status">Loading AETHER…</p>}>
        <Screen />
      </Suspense>
    </Boundary>
  </React.StrictMode>,
);

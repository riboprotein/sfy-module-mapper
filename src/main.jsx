import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Client as Styletron } from "styletron-engine-atomic";
import { Provider as StyletronProvider } from "styletron-react";
import { LightTheme, BaseProvider } from "baseui";
import App from "./App";

// Remove if you're not using index.css for any global styles
import "./index.css";

// Initialize Styletron
const engine = new Styletron();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>
        <App />
      </BaseProvider>
    </StyletronProvider>
  </StrictMode>,
);

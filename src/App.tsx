import "reactflow/dist/style.css";
import React from "react";
import { FactoryPlanner } from "./components/FactoryPlanner";
import { useStyletron } from "baseui";

function App(): JSX.Element {
  const [css] = useStyletron();

  return (
    <div
      className={css({
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      })}
    >
      <FactoryPlanner />
    </div>
  );
}

export default App;

import React from "react";
import { Global } from "@emotion/core";

import globalStyles from "./styles";

const App: React.FC = () => {
  return (
    <>
      <Global styles={globalStyles} />
      <div>Hello world</div>
    </>
  );
};

export default App;

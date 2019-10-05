import React from "react";
import { hot } from "react-hot-loader/root";
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

export default hot(App);

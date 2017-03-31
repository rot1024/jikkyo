import React from "react";
import TitleBar from "./components/molecures/titlebar";
import WindowBorder from "./components/atoms/window-border";

// eslint-disable-next-line react/prefer-stateless-function
export default class App extends React.PureComponent {

  static propTypes = {

  };

  render() {
    return (
      <div>
        <WindowBorder visible />
        <TitleBar title="jikkyo" visible />
        <h1>Hello!</h1>
      </div>
    );
  }

}

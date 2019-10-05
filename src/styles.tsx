import { css } from "@emotion/core";

const globalStyles = css`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body,
  #root {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  html {
    position: fixed;
    background-color: #000;
    color: #fff;
  }
`;

export default globalStyles;

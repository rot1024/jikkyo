import React from "react";
import classNames from "classnames";

import styles from "./style.css";

const WindowBorder = ({ visible }) => (
  <div className={classNames(styles.border, visible && styles.visible)} />
);

WindowBorder.propTypes = {
  visible: React.PropTypes.bool
};

export default WindowBorder;

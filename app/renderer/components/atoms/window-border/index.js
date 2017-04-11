import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import styles from "./style.css";

const WindowBorder = ({ visible }) => (
  <div className={classNames(styles.border, visible && styles.visible)} />
);

WindowBorder.propTypes = {
  visible: PropTypes.bool
};

export default WindowBorder;

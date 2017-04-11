import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import styles from "./style.css";

const TitleBar = ({ title, visible }) => (
  <div className={classNames(styles.titlebar, visible && styles.visible)}>
    {title}
  </div>
);

TitleBar.propTypes = {
  title: PropTypes.string,
  visible: PropTypes.bool
};

export default TitleBar;

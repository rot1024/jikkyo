import React from "react";
import classNames from "classnames";

import styles from "./style.css";

const TitleBar = ({ title, visible }) => (
  <div className={classNames(styles.titlebar, visible && styles.visible)}>
    {title}
  </div>
);

TitleBar.propTypes = {
  title: React.PropTypes.string,
  visible: React.PropTypes.bool
};

export default TitleBar;

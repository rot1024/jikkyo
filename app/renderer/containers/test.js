import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { a } from "../../actions/test";

const TestContainer = ({ handleClick, value }) => (
  <div>
    <div>{value}</div>
    <button onClick={() => handleClick(1)}>+1</button>
  </div>
);

TestContainer.propTypes = {
  handleClick: PropTypes.func,
  value: PropTypes.number
};

export default connect(state => ({
  value: state.test.value
}), {
  handleClick: a
})(TestContainer);

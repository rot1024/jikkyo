import React from "react";
import { connect } from "react-redux";

import { a } from "../../actions/test";

const TestContainer = ({ handleClick, value }) => (
  <div>
    <div>{value}</div>
    <button onClick={() => handleClick(1)}>+1</button>
  </div>
);

TestContainer.propTypes = {
  handleClick: React.PropTypes.func,
  value: React.PropTypes.number
};

export default connect(state => ({
  value: state.test.value
}), {
  handleClick: a
})(TestContainer);

import { handleActions } from "redux-actions";
import { a } from "../actions/test";

export default handleActions({
  [a]: (state, action) => ({
    ...state,
    value: state.value + action.payload
  })
}, {
  value: 0
});

import React, { createContext, useReducer } from "react";
import PropTypes from "prop-types";

const initialState = {
  user: null,
  isUserFetched: false
};

function reducer(state, action) {
  console.log(action);
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isUserFetched: true
      };
    case "UNSET_USER":
      return {
        ...state,
        ...initialState
      };
    default:
      return state;
  }
}

// TODO: saving this file in dev mode causes app to break
// consider extracting reducer into separate file
export const Context = createContext(initialState);

export default function Store({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>;
}

Store.propTypes = {
  children: PropTypes.any
};

import React, { createContext, useReducer } from "react";
import PropTypes from "prop-types";

function reducer(state, action) {
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
      user: null
    };
  default:
    return state;
  }
}

const initialState = {
  user: null,
  isUserFetched: false
};

export const Context = createContext(initialState);

export default function Store({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
  );
}

Store.propTypes = {
  children: PropTypes.any
};

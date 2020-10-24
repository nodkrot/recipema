import React, { createContext, useReducer } from "react";
import PropTypes from "prop-types";

const initialState = {
  user: null,
  userState: "none"
};

function reducer(state, action) {
  console.log(action);
  switch (action.type) {
    case "FETCH_USER":
      return {
        ...state,
        userState: "fetching"
      };
    case "SET_AUTH_USER":
      return {
        ...state,
        user: action.payload,
        userState: "auth"
      };
    case "SET_GUEST_USER":
      return {
        ...state,
        user: null,
        userState: "guest"
      };
    default:
      return state;
  }
}

export const Context = createContext(initialState);

export default function Store({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>;
}

Store.propTypes = {
  children: PropTypes.any
};

import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { UserRoles } from "../utilities/constants.js";

export default function PrivateRoute({ children, user, roles }) {
  if (user && roles.indexOf(user.role) !== -1) {
    return children;
  }

  return <Navigate to="/login" replace />;
}

PrivateRoute.defaultProps = {
  roles: [UserRoles.CUSTOMER]
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.array,
  user: PropTypes.object
};

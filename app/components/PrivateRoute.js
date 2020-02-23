import React from "react";
import PropTypes from "prop-types";
import { Route, Redirect } from "react-router-dom";
import { UserRoles } from "../utilities/constants.js";

export default function PrivateRoute({
  component: Component,
  user,
  roles,
  ...rest
}) {
  if (user && roles.indexOf(user.role) !== -1) {
    return <Route {...rest} render={props => <Component {...props} />} />;
  }

  return <Route {...rest} render={() => <Redirect to="/login" />} />;
}

PrivateRoute.defaultProps = {
  roles: [UserRoles.CUSTOMER]
};

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
  roles: PropTypes.array,
  user: PropTypes.object
};

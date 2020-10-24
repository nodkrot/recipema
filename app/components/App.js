import React, { useContext } from "react";
import { Router, Route, Redirect } from "react-router-dom";
import CacheRoute, { CacheSwitch } from "react-router-cache-route";
import PrivateRoute from "./PrivateRoute.js";
import Dashboard from "./Dashboard.js";
import ListView from "./ListView.js";
import SingleView from "./SingleView";
import Login from "./Login.js";
import { Context } from "../utilities/store.js";
import history from "../utilities/history.js";
import { UserRoles } from "../utilities/constants.js";

export default function App() {
  const [{ user }] = useContext(Context);

  return (
    <Router history={history}>
      <CacheSwitch>
        <CacheRoute exact path="/" component={ListView} />
        <Route path="/recipe/:recipeId" component={SingleView} />
        <Route path="/login" component={Login} />
        <PrivateRoute
          user={user}
          roles={[UserRoles.ADMIN]}
          path="/dashboard/:recipeId"
          component={Dashboard}
        />
        <PrivateRoute
          user={user}
          roles={[UserRoles.ADMIN]}
          path="/dashboard"
          component={Dashboard}
        />
        <Redirect from="*" to="/" />
      </CacheSwitch>
    </Router>
  );
}

import React, { useEffect, useContext } from "react";
import { Router, Route, Redirect, Switch } from "react-router-dom";
import PrivateRoute from "./PrivateRoute.js";
import Dashboard from "./Dashboard.js";
import ListView from "./ListView.js";
import SingleView from "./SingleView";
import Login from "./Login.js";
import { Context } from "../utilities/store.js";
import { auth, getUser } from "../utilities/firebase.js";
import history from "../utilities/history.js";
import { UserRoles } from "../utilities/constants.js";

export default function App() {
  const [{ user, isUserFetched }, dispatch] = useContext(Context);

  useEffect(() => {
    const unregisterAuthObserver = auth.onAuthStateChanged(async authState => {
      if (!authState) {
        return dispatch({ type: "RECEIVE_USER", payload: null });
      }

      try {
        const userData = await getUser(authState.uid);

        return dispatch({ type: "RECEIVE_USER", payload: userData });
      } catch (err) {
        return dispatch({ type: "RECEIVE_USER", payload: null });
      }
    });

    return () => unregisterAuthObserver();
  }, []);

  if (!isUserFetched) return null;

  return (
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={ListView} />
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
      </Switch>
    </Router>
  );
}

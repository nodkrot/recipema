import React, { useContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute.js";
import Dashboard from "./Dashboard.js";
import ListView from "./ListView.js";
import SingleView from "./SingleView";
import Login from "./Login.js";
import { Context } from "../utilities/store.js";
import { UserRoles } from "../utilities/constants.js";
import { getUser } from "../utilities/firebase.js";

export default function App() {
  const [{ user, userState }, dispatch] = useContext(Context);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      dispatch({ type: "FETCH_USER" });

      getUser(userId)
        .then((user) => {
          dispatch({ type: "SET_AUTH_USER", payload: user });
        })
        .catch(() => {
          console.warn("Unable to fetch user");
          dispatch({ type: "SET_GUEST_USER" });
        });
    } else {
      dispatch({ type: "SET_GUEST_USER" });
    }
  }, []);

  if (userState === "none" || userState === "fetching") return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListView />} />
        <Route path="/recipe/:recipeId" element={<SingleView />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard/:recipeId"
          element={
            <PrivateRoute user={user} roles={[UserRoles.ADMIN]}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute user={user} roles={[UserRoles.ADMIN]}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

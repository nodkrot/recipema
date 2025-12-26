import React, { useContext, useEffect, useMemo } from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PrivateRoute from "./PrivateRoute.js";
import Dashboard from "./Dashboard.js";
import ListView from "./ListView.js";
import SingleView from "./SingleView";
import Login from "./Login.js";
import { Context } from "../utilities/store.js";
import { UserRoles } from "../utilities/constants.js";
import { getUser } from "../utilities/firebase.js";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false
    }
  }
});

function RootLayout({ user }) {
  return <Outlet />;
}

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

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          element: <RootLayout user={user} />,
          children: [
            {
              path: "/",
              element: <ListView />
            },
            {
              path: "/recipe/:recipeId",
              element: <SingleView />
            },
            {
              path: "/login",
              element: <Login />
            },
            {
              path: "/dashboard/:recipeId",
              element: (
                <PrivateRoute user={user} roles={[UserRoles.ADMIN]}>
                  <Dashboard />
                </PrivateRoute>
              )
            },
            {
              path: "/dashboard",
              element: (
                <PrivateRoute user={user} roles={[UserRoles.ADMIN]}>
                  <Dashboard />
                </PrivateRoute>
              )
            },
            {
              path: "*",
              element: <Navigate to="/" replace />
            }
          ]
        }
      ]),
    [user]
  );

  if (userState === "none" || userState === "fetching") return null;

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

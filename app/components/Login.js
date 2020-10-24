import React, { useContext } from "react";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase, { auth, getUser, upsertUser } from "../utilities/firebase.js";
import history from "../utilities/history.js";
import { Context } from "../utilities/store.js";
import { UserRoles } from "../utilities/constants.js";
import "./Login.css";

export default function Login() {
  const [, dispatch] = useContext(Context);
  const uiConfig = {
    signInFlow: "redirect",
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    callbacks: {
      signInSuccessWithAuthResult: (authResult) => {
        getUser(authResult.user.uid)
          .then(async (user) => {
            try {
              const newUser = !user
                ? await upsertUser({
                    uid: authResult.user.uid,
                    name: authResult.user.displayName,
                    email: authResult.user.email,
                    role: UserRoles.CUSTOMER,
                    createdAt: new Date().toISOString(),
                    loggedInAt: new Date().toISOString()
                  })
                : await upsertUser(
                    Object.assign({}, user, {
                      loggedInAt: new Date().toISOString()
                    })
                  );

              localStorage.setItem("userId", authResult.user.uid);
              dispatch({ type: "SET_AUTH_USER", payload: newUser });
              history.push("/dashboard");
            } catch (err) {
              console.warn("Unable to upsert user");
            }
          })
          .catch(() => {
            console.warn("Unable to fetch user");
          });

        return false;
      }
    }
  };

  return (
    <div className="login">
      <a href="/" className="login__logo">
        RecipeMa
      </a>
      <div className="login__wrapper">
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
      </div>
    </div>
  );
}

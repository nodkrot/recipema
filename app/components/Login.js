import React, { useContext } from "react";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase, { auth, getUser, createUser } from "../utilities/firebase.js";
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
      signInSuccessWithAuthResult: async (authResult) => {
        try {
          let user = await getUser(authResult.user.uid);

          if (!user) {
            user = await createUser({
              uid: authResult.user.uid,
              name: authResult.user.displayName,
              email: authResult.user.email,
              role: UserRoles.CUSTOMER,
              loggedInAt: Date.now()
            });
          }

          dispatch({ type: "SET_USER", payload: user });
          history.push("/dashboard");
        } catch (err) {
          console.log("Unable to fetch or create user");
        }

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

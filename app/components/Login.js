import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getUser, upsertUser } from "../utilities/firebase.js";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Context } from "../utilities/store.js";
import { UserRoles } from "../utilities/constants.js";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [, dispatch] = useContext(Context);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const googleProvider = new GoogleAuthProvider();
      const authResult = await signInWithPopup(auth, googleProvider);

      const user = await getUser(authResult.user.uid);

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
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <a href="/" className="login__logo">
        RecipeMa
      </a>
      <div className="login__wrapper">
        <button
          className="login__google-button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <p className="login__error">{error}</p>}
      </div>
    </div>
  );
}

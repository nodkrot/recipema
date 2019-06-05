import React from 'react'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import firebase, { auth, setUser } from '../firebase.js'
import './Login.css'

const uiConfig = {
  signInFlow: 'redirect',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: (authResult) => {
      // Save logged in/registered user
      setUser({
        uid: authResult.user.uid,
        name: authResult.user.displayName,
        email: authResult.user.email,
        loggedInAt: Date.now()
      })

      return false
    }
  }
}

export default function Login() {
  return (
    <div className="login">
      <a href="/" className="login__logo">RecipeMa</a>
      <div className="login__wrapper">
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth}/>
      </div>
    </div>
  )
}

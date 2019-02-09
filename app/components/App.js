import React, { useState, useEffect } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import Dashboard from './Dashboard/Dashboard.js'
import Login from './Login/Login.js'
import { auth } from '../firebase.js'
import history from '../history.js'

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(null)

  useEffect(() => {
    if (isSignedIn) history.push('/dashboard')
  }, [isSignedIn])

  useEffect(() => {
    // This will automatically handle redirect whenever user is signed in
    const unregisterAuthObserver = auth.onAuthStateChanged((user) => {
      setIsSignedIn(Boolean(user))
    })

    return () => unregisterAuthObserver()
  }, [])

  if (isSignedIn === null) return null

  return (
    <Router history={history}>
      <Switch>
        <Route path="/login" component={Login} />
        {isSignedIn && <Route path="/dashboard" component={Dashboard} />}
        <Redirect from="*" to="/login" />
      </Switch>
    </Router>
  )
}

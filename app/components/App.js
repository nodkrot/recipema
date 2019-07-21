import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import Dashboard from './Dashboard.js'
import ListView from './ListView.js'
import SingleView from './SingleView'
import Login from './Login.js'
import { auth } from '../firebase.js'
import history from '../history.js'

const PrivateRoute = ({ component: Component, auth, ...rest }) => (
  <Route {...rest} render={(props) => (
    auth ? <Component {...props} /> : <Redirect to="/login" />
  )} />
)

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
  auth: PropTypes.bool.isRequired
}

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(null)

  useEffect(() => {
    const unregisterAuthObserver = auth.onAuthStateChanged((user) => {
      setIsSignedIn(Boolean(user))
    })

    return () => unregisterAuthObserver()
  }, [])

  if (isSignedIn === null) return null

  return (
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={ListView} />
        <Route path="/recipe/:recipeId" component={SingleView} />
        <Route path="/login" component={Login} />
        <PrivateRoute auth={isSignedIn} path="/dashboard" component={Dashboard} />
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  )
}

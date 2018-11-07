import React, { Component } from 'react'
import { Router, Route, Redirect, Switch } from 'react-router-dom'
import Dashboard from './Dashboard/Dashboard.js'
import Login from './Login/Login.js'
import firebase from '../firebase.js'
import history from '../history.js'

export default class App extends Component {

  constructor(props) {
    super(props)

    this.state = { isSignedIn: null }
  }

  componentDidMount() {
    // This will automatically handle redirect whenever user is signed in
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged((user) => {
      this.setState({ isSignedIn: Boolean(user) }, () => {
        if (user) history.push('/dashboard')
      })
    })
  }

  componentWillUnmount() {
    this.unregisterAuthObserver()
  }

  render() {
    if (this.state.isSignedIn === null) return null

    return (
      <Router history={history}>
        <Switch>
          <Route path="/login" component={Login} />
          {this.state.isSignedIn && <Route path="/dashboard" component={Dashboard} />}
          <Redirect from="*" to="/login" />
        </Switch>
      </Router>
    )
  }
}

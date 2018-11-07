import React, { Component } from 'react'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import Dashboard from './Dashboard/Dashboard.js'
import Login from './Login/Login.js'
import firebase from '../firebase.js'

class App extends Component {

  constructor(props) {
    super(props)

    this.state = { isSignedIn: null }
  }

  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged((user) => {
      this.setState({ isSignedIn: Boolean(user) })
    })
  }

  componentWillUnmount() {
    this.unregisterAuthObserver()
  }

  render() {
    if (this.state.isSignedIn === null) return null
    // <Redirect from="*" to="login" />
    // console.log(this.state)
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/login" component={Login} />
          {this.state.isSignedIn && <Route path="/dashboard" component={Dashboard} />}

        </Switch>
      </BrowserRouter>
    )
  }
}

export default App

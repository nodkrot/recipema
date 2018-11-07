import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import firebase from '../../firebase.js'
import './styles.css'

class Login extends Component {

  constructor(props) {
    super(props)

    this.uiConfig = {
      signInFlow: 'popup',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => {
          props.history.push('/dashboard')
        }
      }
    }
  }

  render() {
    return (
      <div className="login">
        <a href="/" className="login__logo">RecipeMa</a>
        <StyledFirebaseAuth uiConfig={this.uiConfig} firebaseAuth={firebase.auth()}/>
      </div>
    )
  }
}

export default withRouter(Login)

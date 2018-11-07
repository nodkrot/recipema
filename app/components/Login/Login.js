import React, { Component } from 'react'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import firebase from '../../firebase.js'
import './styles.css'

export default class Login extends Component {

  constructor(props) {
    super(props)

    this.uiConfig = {
      signInFlow: 'redirect',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => false
      }
    }
  }

  render() {
    return (
      <div className="login">
        <a href="/" className="login__logo">RecipeMa</a>
        <div className="login__wrapper">
          <StyledFirebaseAuth uiConfig={this.uiConfig} firebaseAuth={firebase.auth()}/>
        </div>
      </div>
    )
  }
}

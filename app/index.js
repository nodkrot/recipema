import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App.js'
import 'antd/dist/antd.css'
import './styles.css'

ReactDOM.render(<App />, document.getElementById('root'))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}

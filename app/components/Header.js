import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import './Header.css'

export default function Header({ path = '/', children }) {
  return (
    <div className="header">
      <Link to={path} className="header__logo">RecipeMa</Link>
      <div className="header__header-space">
        {children}
      </div>
    </div>
  )
}

Header.propTypes = {
  path: PropTypes.string,
  children: PropTypes.any
}

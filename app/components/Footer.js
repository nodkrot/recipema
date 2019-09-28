import React from 'react'
import Icon from 'antd/lib/icon'
import './Footer.css'

export default function Footer() {
  return (
    <div className="footer">
      Made with <Icon type="heart" /> {new Date().getFullYear()}
    </div>
  )
}
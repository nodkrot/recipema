import React from "react";
import Icon from "antd/es/icon";
import "./Footer.css";

export default function Footer() {
  return (
    <div className="footer">
      Made with <Icon type="heart" /> {new Date().getFullYear()} |{" "}
      <a href="https://appletreelabs.com" target="_blank" rel="noopener noreferrer">
        Appletreelabs, Inc
      </a>
    </div>
  );
}

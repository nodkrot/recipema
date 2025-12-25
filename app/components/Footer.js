import React from "react";
import { HeartFilled } from "@ant-design/icons";
import "./Footer.css";

export default function Footer() {
  return (
    <div className="footer">
      Made with <HeartFilled style={{ color: "#ff4d4f" }} /> {new Date().getFullYear()} |{" "}
      <a href="https://appletreelabs.com" target="_blank" rel="noopener noreferrer">
        Appletreelabs, Inc
      </a>
    </div>
  );
}

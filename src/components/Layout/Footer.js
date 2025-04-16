import React from "react";
import { Layout } from "antd";

const { Footer } = Layout;

const FooterBar = () => {
  return (
    <Footer
      style={{ textAlign: "center", background: "#001529", color: "#fff" }}
    >
      © {new Date().getFullYear()} GameMKT. All Rights Reserved.
    </Footer>
  );
};

export default FooterBar;

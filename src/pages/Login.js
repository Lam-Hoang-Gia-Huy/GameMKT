import React from "react";
import { Layout } from "antd";
import LoginForm from "../components/loginpage/Loginform";
import background from "../assets/backbround.avif";
const { Content } = Layout;

function Login() {
  return (
    <Layout className="flex w-screen min-h-screen">
      <Layout>
        <Content className="flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <img
              src={background}
              className="w-full h-full object-cover"
              alt="background"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </div>
          <div className="relative z-10 flex justify-center items-center min-h-screen p-4">
            <div className="w-full max-w-2xl bg-opacity-90 rounded-xl shadow-2xl p-8 sm:p-10">
              <LoginForm />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Login;

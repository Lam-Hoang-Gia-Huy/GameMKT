import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Form,
  Input,
  Button,
  Typography,
  message,
  Card,
  Steps,
  Space,
} from "antd";
import { MailOutlined, LockOutlined, CodeOutlined } from "@ant-design/icons";
import {
  sendVerificationCode,
  verifyCode,
  resetPassword,
} from "../api/apiClient";
import background from "../assets/backbround.avif"; // Assuming the same background image path
const { Content } = Layout;
const { Title, Text } = Typography;
const { Step } = Steps;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0: Email, 1: Code, 2: New Password
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSendCode = async (values) => {
    setLoading(true);
    try {
      await sendVerificationCode(values.email);
      setEmail(values.email);
      message.success("Verification code sent to your email!");
      setCurrentStep(1);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (values) => {
    setLoading(true);
    try {
      await verifyCode(email, values.code);
      message.success("Code verified successfully!");
      setCurrentStep(2);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Invalid or expired code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      await resetPassword(email, values.password);
      navigate("/login");
      message.success("Password reset successfully! You can now log in.");
      setCurrentStep(0);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form
            name="send_code"
            onFinish={handleSendCode}
            layout="vertical"
            style={{ maxWidth: 400, margin: "0 auto" }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                Send Verification Code
              </Button>
            </Form.Item>
          </Form>
        );
      case 1:
        return (
          <Form
            name="verify_code"
            onFinish={handleVerifyCode}
            layout="vertical"
            style={{ maxWidth: 400, margin: "0 auto" }}
          >
            <Form.Item
              name="code"
              label="Verification Code"
              rules={[
                {
                  required: true,
                  message: "Please input the verification code!",
                },
              ]}
            >
              <Input
                prefix={<CodeOutlined />}
                placeholder="Enter the code"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Verify Code
                </Button>
                <Button type="link" onClick={() => setCurrentStep(0)} block>
                  Resend Code
                </Button>
              </Space>
            </Form.Item>
          </Form>
        );
      case 2:
        return (
          <Form
            name="reset_password"
            onFinish={handleResetPassword}
            layout="vertical"
            style={{ maxWidth: 400, margin: "0 auto" }}
          >
            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: "Please input your new password!" },
                { min: 8, message: "Password must be at least 8 characters!" },
                {
                  pattern:
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
                  message:
                    "Password must contain at least one letter, one number, and one special character!",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        );
      default:
        return null;
    }
  };

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
            <div className="w-full max-w-2xl bg-white bg-opacity-90 rounded-xl shadow-2xl p-8 sm:p-10">
              <Title level={2} style={{ textAlign: "center" }}>
                Reset Your Password
              </Title>
              <Text
                type="secondary"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Follow the steps below to reset your password.
              </Text>
              <Card
                bordered={false}
                style={{ borderRadius: 8, boxShadow: "none" }}
              >
                <Steps current={currentStep} style={{ marginBottom: 24 }}>
                  <Step title="Enter Email" />
                  <Step title="Verify Code" />
                  <Step title="Reset Password" />
                </Steps>
                {renderForm()}
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ResetPasswordPage;

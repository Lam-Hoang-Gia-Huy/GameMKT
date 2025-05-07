import React, { useState, useRef } from "react";
import { Form, Input, Button, Typography, message, Space } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import ReCAPTCHA from "react-google-recaptcha";
import { resendConfirmationEmail } from "../../api/apiClient";

const { Title, Text } = Typography;

const Register = () => {
  const [captchaValue, setCaptchaValue] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [form] = Form.useForm();
  const recaptchaRef = useRef(null);
  const sitekey =
    process.env.REACT_APP_RECAPTCHA_SITE_KEY || "your_default_site_key_here";

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleRegister = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://marvelous-gentleness-production.up.railway.app/api/Authentication/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            "confirm-password": values.confirmPassword,
            fullname: values.fullname,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Registration unsuccessful.");

      message.success(
        data?.message ||
          "Registration successful! Please check your email to confirm your account."
      );
      form.resetFields();
      setCaptchaValue(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    } catch (err) {
      const errors = err.response?.data?.errors || [err.message];
      message.error(errors.join(", ") || "Registration unsuccessful.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (values) => {
    if (isResending) return;
    setIsResending(true);

    try {
      const response = await resendConfirmationEmail(values.resendEmail);
      message.success(
        response.data?.message || "Confirmation email resent successfully!"
      );
      form.setFieldsValue({ resendEmail: "" });
    } catch (err) {
      message.error(
        err.response?.data?.message || "Failed to resend confirmation email."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <Title level={2} style={{ textAlign: "center" }}>
        Create Your Account
      </Title>
      <Text
        type="secondary"
        style={{ display: "block", textAlign: "center", marginBottom: 24 }}
      >
        Fill in the details below to register.
      </Text>

      <Form
        form={form}
        name="register"
        onFinish={handleRegister}
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

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Please input your password!" },
            {
              pattern:
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/,
              message:
                "Password must be 8-15 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)!",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password!" },
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
            placeholder="Confirm your password"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="fullname"
          label="Full Name"
          rules={[{ required: true, message: "Please input your full name!" }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your full name"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          ></div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            block
            size="large"
          >
            Register
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, maxWidth: 400, margin: "24px auto" }}>
        <Text
          strong
          style={{ display: "block", textAlign: "center", marginBottom: 16 }}
        >
          Resend Confirmation Email
        </Text>
        <Form
          name="resend_email"
          onFinish={handleResendEmail}
          layout="vertical"
        >
          <Form.Item
            name="resendEmail"
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
              loading={isResending}
              block
              size="large"
            >
              Resend Confirmation Email
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;

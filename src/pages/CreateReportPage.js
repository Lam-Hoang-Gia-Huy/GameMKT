import React, { useState } from "react";
import { Form, Input, Button, Alert, Spin, Card, Row, Col } from "antd";
import { createReport } from "../api/apiClient"; // Import hàm mới
import useAuth from "../components/Hooks/useAuth";
import { useNavigate } from "react-router-dom";

const CreateReport = () => {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await createReport(values.detail);

      if (response.data.success) {
        setSuccess("Report created successfully!");
        form.resetFields();
        setTimeout(() => navigate("/reports"), 2000); // Chuyển hướng sau 2 giây
      } else {
        setError(response.data.message || "Failed to create report.");
      }
    } catch (err) {
      console.error("Error creating report:", err);
      setError(
        "An error occurred while creating the report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" style={{ padding: "50px 0" }}>
      <Col xs={24} sm={16} md={12} lg={8}>
        <Card title="Create New Report" bordered>
          {loading && (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Spin size="large" />
            </div>
          )}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}
          {success && (
            <Alert
              message="Success"
              description={success}
              type="success"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={loading}
          >
            <Form.Item
              name="detail"
              label="Report Detail"
              rules={[
                { required: true, message: "Please enter the report detail!" },
              ]}
            >
              <Input.TextArea rows={5} placeholder="Describe your report..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Submit Report
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default CreateReport;

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import {
  fetchAllPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
} from "../api/apiClient";

const PlatformManagement = () => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [form] = Form.useForm();

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const response = await fetchAllPlatforms();
      if (response.data.success) {
        setPlatforms(response.data.data);
      } else {
        message.error("Failed to fetch platforms");
      }
    } catch (error) {
      message.error("Error fetching platforms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const showModal = (platform = null) => {
    setEditingPlatform(platform);
    if (platform) {
      form.setFieldsValue({
        Name: platform.name,
        Description: platform.description,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPlatform(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingPlatform) {
        // Update platform
        await updatePlatform(editingPlatform["platform-id"], values);
        message.success("Platform updated successfully");
      } else {
        await createPlatform(values);
        message.success("Platform created successfully");
      }
      fetchPlatforms();
      handleCancel();
    } catch (error) {
      message.error(
        `Error ${editingPlatform ? "updating" : "creating"} platform`
      );
    }
  };

  const handleDelete = async (platformId) => {
    try {
      await deletePlatform(platformId);
      message.success("Platform deleted successfully");
      fetchPlatforms();
    } catch (error) {
      message.error("Error deleting platform");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "platform-id",
      key: "platform-id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button
            type="primary"
            onClick={() => showModal(record)}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this platform?"
            onConfirm={() => handleDelete(record["platform-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={() => showModal()}
        style={{ marginBottom: 16 }}
      >
        Add Platform
      </Button>
      <Table
        columns={columns}
        dataSource={platforms}
        rowKey="platform-id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editingPlatform ? "Edit Platform" : "Add Platform"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="Name"
            label="Name"
            rules={[
              { required: true, message: "Please enter the platform name" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Description"
            label="Description"
            rules={[
              { required: true, message: "Please enter the description" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPlatform ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlatformManagement;

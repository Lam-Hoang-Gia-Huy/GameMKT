import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  InputNumber,
} from "antd";
import {
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/apiClient";
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetchAllCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        message.error("Failed to fetch categories");
      }
    } catch (error) {
      message.error("Error fetching categories");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Show modal for creating or editing a category
  const showModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue({
        parentCategoryId: category["parent-category-id"],
        name: category.name,
        description: category.description,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
  };

  // Handle form submission for creating or updating a category
  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        // Update category
        await updateCategory(editingCategory["category-id"], {
          "parent-category-id": values.parentCategoryId,
          name: values.name,
          description: values.description,
        });
        message.success("Category updated successfully");
      } else {
        // Create category
        await createCategory({
          ParentCategoryId: values.parentCategoryId,
          Name: values.name,
          Description: values.description,
        });
        message.success("Category created successfully");
      }
      fetchCategories(); // Refresh the category list
      handleCancel(); // Close the modal
    } catch (error) {
      message.error(
        `Error ${editingCategory ? "updating" : "creating"} category`
      );
    }
  };

  // Handle category deletion
  const handleDelete = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      message.success("Category deleted successfully");
      fetchCategories(); // Refresh the category list
    } catch (error) {
      message.error("Error deleting category");
    }
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "category-id",
      key: "category-id",
    },
    {
      title: "Parent Category ID",
      dataIndex: "parent-category-id",
      key: "parent-category-id",
      render: (text) => text || "None",
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
            title="Are you sure to delete this category?"
            onConfirm={() => handleDelete(record["category-id"])}
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
        Add Category
      </Button>
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="category-id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="parentCategoryId"
            label="Parent Category ID"
            rules={[
              {
                type: "number",
                min: 0,
                message:
                  "Parent Category ID must be a positive number or empty",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} placeholder="Optional" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter the category name" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
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
              {editingCategory ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;

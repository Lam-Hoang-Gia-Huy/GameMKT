import React, { useState, useEffect } from "react";
import { Button, Select, Modal, List, message, Space } from "antd";
import {
  fetchAllCategories,
  addCategoryToProject,
  removeCategoryFromProject,
} from "../../api/apiClient";

const { Option } = Select;

const CategorySelector = ({ projectId, initialCategories = [], onUpdate }) => {
  const [allCategories, setAllCategories] = useState([]);
  const [projectCategories, setProjectCategories] = useState(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setProjectCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchAllCategories();
        setAllCategories(response.data.data || []);
      } catch (error) {
        message.error("Failed to load categories");
      }
    };

    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      await addCategoryToProject(projectId, selectedCategory);

      const addedCategory = allCategories.find(
        (c) => c["category-id"] === selectedCategory
      );

      if (addedCategory) {
        const newCategories = [...projectCategories, addedCategory];
        setProjectCategories(newCategories);
        onUpdate?.(newCategories);
      }

      message.success("Category added successfully");
      setSelectedCategory(null);
    } catch (error) {
      message.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCategory = (categoryId) => {
    Modal.confirm({
      title: "Confirm Deletion",
      content:
        "Are you sure you want to remove this category from the project?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          await removeCategoryFromProject(projectId, categoryId);

          const newCategories = projectCategories.filter(
            (c) => c["category-id"] !== categoryId
          );
          setProjectCategories(newCategories);
          onUpdate?.(newCategories);

          message.success("Category removed successfully");
        } catch (error) {
          message.error("Failed to remove category");
        }
      },
    });
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={() => setModalVisible(true)}
        style={{ marginTop: 8 }}
      >
        Manage Categories
      </Button>

      <Modal
        title="Project Categories"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <Select
              style={{ width: 300 }}
              placeholder="Select a category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              showSearch
              optionFilterProp="children"
            >
              {allCategories
                .filter(
                  (cat) =>
                    !projectCategories.some(
                      (pc) => pc["category-id"] === cat["category-id"]
                    )
                )
                .map((category) => (
                  <Option
                    key={category["category-id"]}
                    value={category["category-id"]}
                  >
                    {category.name}
                  </Option>
                ))}
            </Select>
            <Button
              type="primary"
              onClick={handleAddCategory}
              loading={loading}
              disabled={!selectedCategory}
            >
              Add
            </Button>
          </Space>

          <List
            size="small"
            bordered
            dataSource={projectCategories}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRemoveCategory(item["category-id"])}
                  >
                    Remove
                  </Button>,
                ]}
              >
                {item.name}
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default CategorySelector;

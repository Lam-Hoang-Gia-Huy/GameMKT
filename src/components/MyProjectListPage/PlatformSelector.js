import React, { useState, useEffect } from "react";
import { Button, Select, Modal, List, message, Space } from "antd";
import {
  fetchAllPlatforms,
  addPlatformToProject,
  removePlatformFromProject,
} from "../../api/apiClient";

const { Option } = Select;

const PlatformSelector = ({ projectId, initialPlatforms = [], onUpdate }) => {
  const [allPlatforms, setAllPlatforms] = useState([]);
  const [projectPlatforms, setProjectPlatforms] = useState(initialPlatforms);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setProjectPlatforms(initialPlatforms);
  }, [initialPlatforms]);

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const response = await fetchAllPlatforms();
        setAllPlatforms(response.data.data || []);
      } catch (error) {
        message.error("Failed to load platforms");
      }
    };

    loadPlatforms();
  }, []);

  const handleAddPlatform = async () => {
    if (!selectedPlatform) return;

    try {
      setLoading(true);
      await addPlatformToProject(projectId, selectedPlatform);

      const addedPlatform = allPlatforms.find(
        (p) => p["platform-id"] === selectedPlatform
      );

      if (addedPlatform) {
        const newPlatforms = [...projectPlatforms, addedPlatform];
        setProjectPlatforms(newPlatforms);
        onUpdate?.(newPlatforms);
      }

      message.success("Platform added successfully");
      setSelectedPlatform(null);
    } catch (error) {
      message.error("Failed to add platform");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlatform = (platformId) => {
    Modal.confirm({
      title: "Confirm Deletion",
      content:
        "Are you sure you want to remove this platform from the project?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          await removePlatformFromProject(projectId, platformId);

          const newPlatforms = projectPlatforms.filter(
            (p) => p["platform-id"] !== platformId
          );
          setProjectPlatforms(newPlatforms);
          onUpdate?.(newPlatforms);

          message.success("Platform removed successfully");
        } catch (error) {
          message.error("Failed to remove platform");
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
        Manage Platforms
      </Button>

      <Modal
        title="Project Platforms"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <Select
              style={{ width: 300 }}
              placeholder="Select a platform"
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              showSearch
              optionFilterProp="children"
            >
              {allPlatforms
                .filter(
                  (plat) =>
                    !projectPlatforms.some(
                      (pp) => pp["platform-id"] === plat["platform-id"]
                    )
                )
                .map((platform) => (
                  <Option
                    key={platform["platform-id"]}
                    value={platform["platform-id"]}
                  >
                    {platform.name}
                  </Option>
                ))}
            </Select>
            <Button
              type="primary"
              onClick={handleAddPlatform}
              loading={loading}
              disabled={!selectedPlatform}
            >
              Add
            </Button>
          </Space>

          <List
            size="small"
            bordered
            dataSource={projectPlatforms}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRemovePlatform(item["platform-id"])}
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

export default PlatformSelector;

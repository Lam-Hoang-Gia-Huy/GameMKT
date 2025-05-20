import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
} from "antd";
import {
  fetchRewardsByProjectId,
  addReward,
  updateReward,
  deleteReward,
} from "../../api/apiClient";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { confirm } = Modal;
const { Text } = Typography;

const RewardList = ({ projectId, projectStatus }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [form] = Form.useForm();
  const isVisible = projectStatus === "VISIBLE";

  useEffect(() => {
    loadRewards();
  }, [projectId]);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const response = await fetchRewardsByProjectId(projectId);
      if (response.data.success) {
        setRewards(response.data.data || []);
      } else {
        if (
          response.data.message === "No rewards found for the given project."
        ) {
          message.info("No rewards found for this project.");
          setRewards([]);
        } else {
          message.error(response.data.message || "Failed to fetch rewards");
        }
      }
    } catch (error) {
      if (
        error.response?.data?.message !==
        "No rewards found for the given project."
      ) {
        message.error(
          error.response?.data?.message || "Failed to fetch rewards"
        );
      } else {
        message.info("No rewards found for this project.");
        setRewards([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateRewardAmount = async (amount, rewardId = null) => {
    // Check if the amount already exists in other rewards
    const existingReward = rewards.find(
      (reward) =>
        reward.amount === amount &&
        (!rewardId || reward["reward-id"] !== rewardId) // Exclude the current reward if editing
    );
    if (existingReward) {
      throw new Error(
        "A reward with this amount already exists for this project."
      );
    }
  };

  const showEditModal = (reward) => {
    if (isVisible) {
      message.warning(
        "Cannot edit rewards for a VISIBLE project. Please contact staff or admin by creating a report to request changes."
      );
      return;
    }
    setEditingReward(reward);
    form.setFieldsValue(reward);
    setIsModalVisible(true);
  };

  const handleAddReward = () => {
    if (isVisible) {
      message.warning(
        "Cannot add rewards for a VISIBLE project. Please contact staff or admin to request changes."
      );
      return;
    }
    setEditingReward(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleDelete = (rewardId) => {
    if (isVisible) {
      message.warning(
        "Cannot delete rewards for a VISIBLE project. Please contact staff or admin to request changes."
      );
      return;
    }
    confirm({
      title: "Are you sure you want to delete this reward?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await deleteReward(rewardId);
          if (response.data.success) {
            message.success("Reward deleted successfully");
            loadRewards();
          } else {
            message.error(response.data.message || "Failed to delete reward");
          }
        } catch (error) {
          message.error(
            error.response?.data?.message || "Failed to delete reward"
          );
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      // Validate reward amount for duplicates
      await validateRewardAmount(
        values.amount,
        editingReward ? editingReward["reward-id"] : null
      );

      const rewardData = {
        ...values,
        "project-id": projectId,
        "created-datetime": new Date(),
      };

      if (editingReward) {
        if (isVisible) {
          message.warning(
            "Cannot edit rewards for a VISIBLE project. Please contact staff or admin to request changes."
          );
          return;
        }
        const response = await updateReward(
          editingReward["reward-id"],
          rewardData
        );
        if (response.data.success) {
          message.success("Reward updated successfully");
        } else {
          message.error(response.data.message || "Failed to update reward");
        }
      } else {
        const response = await addReward(rewardData);
        if (response.data.success) {
          message.success("Reward added successfully");
        } else {
          message.error(response.data.message || "Failed to add reward");
        }
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingReward(null);
      loadRewards();
    } catch (error) {
      message.error(error.message || "Failed to add or update reward");
    }
  };

  const columns = [
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `${amount}$`,
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
    },
    {
      title: "Created At",
      dataIndex: "created-datetime",
      key: "created-datetime",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            disabled={isVisible}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record["reward-id"])}
            disabled={isVisible}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Rewards</h2>
      {isVisible && (
        <Text
          type="danger"
          style={{ display: "block", marginBottom: 16, fontSize: 15 }}
        >
          <b>Note:</b> Rewards cannot be added, edited, or deleted for a VISIBLE
          project. Please contact staff or admin by creating a report to request
          changes.
        </Text>
      )}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddReward}
        disabled={isVisible}
        style={{ marginBottom: 16 }}
      >
        Add Reward
      </Button>
      <Table
        columns={columns}
        dataSource={rewards}
        rowKey="reward-id"
        loading={loading}
      />

      <Modal
        title={editingReward ? "Edit Reward" : "Add Reward"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: "Please enter the amount" },
              {
                validator: async (_, value) => {
                  if (value) {
                    await validateRewardAmount(
                      value,
                      editingReward ? editingReward["reward-id"] : null
                    );
                  }
                },
              },
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Enter amount (e.g., 10)"
              disabled={isVisible && editingReward}
            />
          </Form.Item>
          <Form.Item
            name="details"
            label="Details"
            rules={[{ required: true, message: "Please enter the details" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reward details (e.g., Exclusive T-shirt for backers)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RewardList;

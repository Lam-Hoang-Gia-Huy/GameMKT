import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Empty,
  Divider,
  Modal,
  Button,
  Input,
  Select,
  Pagination,
  Dropdown,
  Menu,
  Space,
  message,
  Skeleton,
  Spin,
  Tag,
} from "antd";
import {
  MoreOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import TipTapViewer from "../TipTapViewer";
import TipTapEditor from "../TipTapEditor";
import {
  fetchPostsByProject,
  createPost,
  updatePost,
  deletePost,
} from "../../api/apiClient";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ProjectUpdates = ({ projectId, isCreator = false }) => {
  const [updates, setUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newStatus, setNewStatus] = useState("PUBLIC");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUpdateId, setEditUpdateId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState("PUBLIC");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteUpdateId, setDeleteUpdateId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 5;

  // Fetch updates when projectId changes or when updates are modified
  useEffect(() => {
    if (projectId) {
      fetchUpdates();
    }
  }, [projectId, currentPage]);

  const fetchUpdates = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetchPostsByProject(
        projectId,
        currentPage,
        pageSize
      );

      if (response.data.success) {
        const updatesData = response.data.data["list-data"] || [];
        setUpdates(updatesData);
        setTotalUpdates(response.data.data["total-records"] || 0);
      } else {
        message.error("Failed to load updates");
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
      message.error("Error loading updates");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (update) => {
    setSelectedUpdate(update);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUpdate(null);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setNewTitle("");
    setNewContent("");
    setNewStatus("PUBLIC");
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddUpdate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      message.warning("Please enter a title and content");
      return;
    }

    try {
      setActionLoading(true);
      const postData = {
        ProjectId: projectId,
        Title: newTitle,
        Description: newContent,
        Status: newStatus,
      };

      const response = await createPost(postData);

      if (response.data.success) {
        message.success("Update added successfully");
        handleCloseAddModal();
        fetchUpdates(); // Refresh the list
      } else {
        message.error("Failed to add update");
      }
    } catch (error) {
      console.error("Error adding update:", error);
      message.error("Error adding update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (update) => {
    setEditUpdateId(update["post-id"]);
    setEditTitle(update.title);
    setEditContent(update.description);
    setEditStatus(update.status || "PUBLIC");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditUpdateId(null);
    setEditTitle("");
    setEditContent("");
    setEditStatus("PUBLIC");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      message.warning("Please enter a title and content");
      return;
    }

    try {
      setActionLoading(true);
      const postData = {
        ProjectId: projectId,
        Title: editTitle,
        Description: editContent,
        Status: editStatus,
      };

      const response = await updatePost(editUpdateId, postData);

      if (response.data.success) {
        message.success("Update saved successfully");
        handleCloseEditModal();
        fetchUpdates(); // Refresh the list
      } else {
        message.error("Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      message.error("Error updating post");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteUpdateId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteUpdateId(null);
  };

  const handleDeleteUpdate = async () => {
    if (!deleteUpdateId) return;

    try {
      setActionLoading(true);
      const response = await deletePost(deleteUpdateId);

      if (response.data.success) {
        message.success("Update deleted successfully");
        handleCloseDeleteModal();
        fetchUpdates(); // Refresh the list
      } else {
        message.error("Failed to delete update");
      }
    } catch (error) {
      console.error("Error deleting update:", error);
      message.error("Error deleting update");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const menu = (update) => (
    <Menu onClick={(e) => e.domEvent.stopPropagation()}>
      <Menu.Item key="edit" onClick={() => handleOpenEditModal(update)}>
        Edit
      </Menu.Item>
      <Menu.Item
        key="delete"
        onClick={() => handleOpenDeleteModal(update["post-id"])}
        danger
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  // Helper function to truncate HTML content
  const truncateContent = (content, maxLength = 200) => {
    if (!content) return "";

    if (content.length > maxLength) {
      return content.substring(0, maxLength) + "...";
    }
    return content;
  };

  // Format date to locale string
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "No date available";
    }
  };

  return (
    <div className="project-updates">
      {isCreator && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAddModal}
          style={{ marginBottom: 16 }}
        >
          Add Update
        </Button>
      )}

      {loading ? (
        <div style={{ padding: "20px 0" }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
          <Divider />
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </div>
      ) : updates.length > 0 ? (
        <>
          {updates.map((update) => (
            <Card
              key={update["post-id"]}
              style={{
                marginBottom: 16,
                cursor: "pointer",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              hoverable
              onClick={() => handleOpenModal(update)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Title level={4} style={{ marginBottom: "8px" }}>
                    {update.title}
                  </Title>
                  <Space>
                    <Text type="secondary">
                      <CalendarOutlined style={{ marginRight: 5 }} />
                      {formatDate(update["created-datetime"])}
                    </Text>
                    {update.status && <Tag color="blue">{update.status}</Tag>}
                  </Space>
                </div>
                {isCreator && (
                  <Dropdown
                    overlay={menu(update)}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined style={{ fontSize: "20px" }} />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                )}
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <div
                className="update-content"
                style={{ maxHeight: "100px", overflow: "hidden" }}
              >
                <TipTapViewer
                  content={truncateContent(update.description, 200)}
                />
              </div>
              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <Button
                  type="link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(update);
                  }}
                >
                  Read More
                </Button>
              </div>
            </Card>
          ))}
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalUpdates}
            onChange={handlePageChange}
            style={{ textAlign: "center", marginTop: 16 }}
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} updates`}
          />
        </>
      ) : (
        <Card>
          <Empty
            description={
              <Text type="secondary">
                {projectId
                  ? "No updates available"
                  : "Please select a project to view updates"}
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {/* View Update Modal */}
      <Modal
        title={selectedUpdate?.title}
        open={isModalOpen}
        onCancel={handleCloseModal}
        width="800px"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Close
          </Button>,
        ]}
        bodyStyle={{ padding: "16px", maxHeight: "70vh", overflowY: "auto" }}
      >
        {selectedUpdate ? (
          <>
            <Space wrap>
              <Text type="secondary">
                <CalendarOutlined style={{ marginRight: 5 }} />
                {formatDate(selectedUpdate["created-datetime"])}
              </Text>
              {selectedUpdate.status && (
                <Tag color="blue">{selectedUpdate.status}</Tag>
              )}
              {selectedUpdate.user && (
                <Text type="secondary">
                  Posted by: {selectedUpdate.user.fullname}
                </Text>
              )}
            </Space>
            <Divider />
            <div className="update-content">
              <TipTapViewer content={selectedUpdate.description} />
            </div>
          </>
        ) : (
          <Empty description="Content not found" />
        )}
      </Modal>

      {/* Add Update Modal */}
      <Modal
        title="Add New Update"
        open={isAddModalOpen}
        onCancel={handleCloseAddModal}
        width="800px"
        style={{ top: 20 }}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseAddModal}
            disabled={actionLoading}
          >
            Cancel
          </Button>,
          <Button
            key="add"
            type="primary"
            onClick={handleAddUpdate}
            loading={actionLoading}
          >
            Add Update
          </Button>,
        ]}
      >
        <Spin spinning={actionLoading}>
          <Input
            placeholder="Enter title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <Select
            value={newStatus}
            onChange={setNewStatus}
            style={{ width: "100%", marginBottom: 12 }}
          >
            <Option value="PUBLIC">PUBLIC</Option>
            <Option value="PRIVATE">PRIVATE</Option>
            <Option value="EXCLUSIVE">EXCLUSIVE</Option>
          </Select>
          <TipTapEditor content={newContent} setContent={setNewContent} />
        </Spin>
      </Modal>

      {/* Edit Update Modal */}
      <Modal
        title="Edit Update"
        open={isEditModalOpen}
        width="800px"
        style={{ top: 20 }}
        onCancel={handleCloseEditModal}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseEditModal}
            disabled={actionLoading}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveEdit}
            loading={actionLoading}
          >
            Save Changes
          </Button>,
        ]}
      >
        <Spin spinning={actionLoading}>
          <Input
            placeholder="Enter title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <Select
            value={editStatus}
            onChange={setEditStatus}
            style={{ width: "100%", marginBottom: 12 }}
          >
            <Option value="PUBLIC">PUBLIC</Option>
            <Option value="PRIVATE">PRIVATE</Option>
            <Option value="EXCLUSIVE">EXCLUSIVE</Option>
          </Select>
          <TipTapEditor content={editContent} setContent={setEditContent} />
        </Spin>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", marginRight: 8 }}
            />
            Confirm Deletion
          </div>
        }
        open={isDeleteModalOpen}
        onCancel={handleCloseDeleteModal}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseDeleteModal}
            disabled={actionLoading}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleDeleteUpdate}
            loading={actionLoading}
          >
            Delete
          </Button>,
        ]}
      >
        <Paragraph>
          Are you sure you want to delete this update? This action cannot be
          undone.
        </Paragraph>
      </Modal>
    </div>
  );
};

export default ProjectUpdates;

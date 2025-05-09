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
  Avatar,
} from "antd";
import {
  MoreOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import TipTapViewer from "../TipTapViewer";
import TipTapEditor from "../TipTapEditor";
import {
  fetchPostsByProject,
  createPost,
  updatePost,
  deletePost,
  fetchCommentsByPostId,
  addCommentToPost,
  updateComment,
  deleteComment,
} from "../../api/apiClient";
import useAuth from "../../components/Hooks/useAuth";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProjectUpdates = ({ projectId, isCreator = false }) => {
  const { auth } = useAuth();
  const currentUserId = auth?.id ? Number(auth.id) : null; // Convert to number to match API

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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] =
    useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const pageSize = 5;

  // Fetch updates when projectId or currentPage changes
  useEffect(() => {
    if (projectId) {
      fetchUpdates();
    }
  }, [projectId, currentPage]);

  // Fetch comments when selectedUpdate changes
  useEffect(() => {
    if (selectedUpdate) {
      fetchComments();
    }
  }, [selectedUpdate]);

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

  const sortCommentsByDate = (comments) => {
    // Sort the comments array by created-datetime
    const sortedComments = [...comments].sort((a, b) => {
      return new Date(a["created-datetime"]) - new Date(b["created-datetime"]);
    });

    // Recursively sort nested comments
    return sortedComments.map((comment) => {
      if (comment.comments && comment.comments.length > 0) {
        return {
          ...comment,
          comments: sortCommentsByDate(comment.comments),
        };
      }
      return comment;
    });
  };

  const fetchComments = async () => {
    if (!selectedUpdate) return;

    try {
      setCommentsLoading(true);
      const response = await fetchCommentsByPostId(selectedUpdate["post-id"]);
      if (response.data.success) {
        const fetchedComments = response.data.data || [];
        const sortedComments = sortCommentsByDate(fetchedComments);
        setComments(sortedComments);
      } else {
        message.error(response.data.message || "Failed to load comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      message.error("Error loading comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenModal = (update) => {
    setSelectedUpdate(update);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUpdate(null);
    setComments([]);
    setNewComment("");
    setEditingCommentId(null);
    setEditingCommentContent("");
    setReplyingToCommentId(null);
    setReplyContent("");
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
        fetchUpdates();
      } else {
        message.error(response.data.message || "Failed to add update");
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
        fetchUpdates();
      } else {
        message.error(response.data.message || "Failed to update post");
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
        fetchUpdates();
      } else {
        message.error(response.data.message || "Failed to delete update");
      }
    } catch (error) {
      console.error("Error deleting update:", error);
      message.error("Error deleting update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      message.warning("Please enter a comment");
      return;
    }
    if (!currentUserId) {
      message.warning("Please log in to comment");
      return;
    }

    try {
      setActionLoading(true);
      const response = await addCommentToPost(
        selectedUpdate["post-id"],
        newComment,
        ""
      );
      if (response.data.success) {
        message.success("Comment added successfully");
        setNewComment("");
        fetchComments();
      } else {
        message.error(response.data.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      message.error("Error adding comment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!replyContent.trim()) {
      message.warning("Please enter a reply");
      return;
    }
    if (!currentUserId) {
      message.warning("Please log in to reply");
      return;
    }

    try {
      setActionLoading(true);
      const response = await addCommentToPost(
        selectedUpdate["post-id"],
        replyContent,
        parentCommentId.toString()
      );
      if (response.data.success) {
        message.success("Reply added successfully");
        setReplyContent("");
        setReplyingToCommentId(null);
        fetchComments();
      } else {
        message.error(response.data.message || "Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      message.error("Error adding reply");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment["comment-id"]);
    setEditingCommentContent(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentContent.trim()) {
      message.warning("Please enter comment content");
      return;
    }

    try {
      setActionLoading(true);
      const response = await updateComment(commentId, editingCommentContent);
      if (response.data.success) {
        message.success("Comment updated successfully");
        setEditingCommentId(null);
        setEditingCommentContent("");
        fetchComments();
      } else {
        message.error(response.data.message || "Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      message.error("Error updating comment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleOpenDeleteCommentModal = (commentId) => {
    setDeleteCommentId(commentId);
    setIsDeleteCommentModalOpen(true);
  };

  const handleCloseDeleteCommentModal = () => {
    setIsDeleteCommentModalOpen(false);
    setDeleteCommentId(null);
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      setActionLoading(true);
      const response = await deleteComment(deleteCommentId);
      if (response.data.success) {
        message.success("Comment deleted successfully");
        handleCloseDeleteCommentModal();
        fetchComments();
      } else {
        message.error(response.data.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      message.error("Error deleting comment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplyClick = (commentId) => {
    setReplyingToCommentId(commentId);
    setReplyContent("");
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent("");
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

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date
        .toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        })
        .replace(/,/, "");
    } catch (e) {
      return "No date available";
    }
  };

  const renderComment = (comment, depth = 0) => {
    return (
      <div
        key={comment["comment-id"]}
        style={{
          marginBottom: 16,
          padding: "12px 16px",
          background: depth % 2 === 0 ? "#f5f5f5" : "rgb(237 237 237)",
          border: "1px solid #e8e8e8",
          borderRadius: 6,
          marginLeft: depth * 24,
          position: "relative",
          transition: "background 0.2s",
          "&:hover": {
            background: "#e6f7ff",
          },
        }}
      >
        {/* Connecting line for nested comments */}
        {depth > 0 && (
          <div
            style={{
              position: "absolute",
              left: -12,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#d9d9d9",
            }}
          />
        )}
        <Space align="start" style={{ width: "100%" }}>
          <Avatar
            src={comment.user.avatar}
            size={40}
            style={{ flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Text strong style={{ fontSize: 15 }}>
                {comment.user.fullname}
              </Text>
              <Space>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  {formatDate(comment["created-datetime"])}
                </Text>
                {comment.status === "Updated" && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    (Edited at {formatDate(comment["updated-datetime"])})
                  </Text>
                )}
              </Space>
            </Space>
            {editingCommentId === comment["comment-id"] ? (
              <div style={{ marginTop: 12 }}>
                <TextArea
                  value={editingCommentContent}
                  onChange={(e) => setEditingCommentContent(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 8, borderRadius: 4 }}
                />
                <Space>
                  <Button
                    type="primary"
                    onClick={() => handleSaveEditComment(comment["comment-id"])}
                    loading={actionLoading}
                    style={{ borderRadius: 4 }}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEditComment}
                    style={{ borderRadius: 4 }}
                  >
                    Cancel
                  </Button>
                </Space>
              </div>
            ) : (
              <>
                <Paragraph
                  style={{
                    margin: "8px 0",
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}
                >
                  {comment.content}
                </Paragraph>
                {currentUserId && (
                  <Space size="small">
                    <Button
                      type="link"
                      icon={<MessageOutlined />}
                      onClick={() => handleReplyClick(comment["comment-id"])}
                      style={{ color: "#1890ff", padding: "0 8px" }}
                    >
                      Reply
                    </Button>
                    {comment["user-id"] === currentUserId && (
                      <>
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => handleEditComment(comment)}
                          style={{ color: "#52c41a", padding: "0 8px" }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="link"
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            handleOpenDeleteCommentModal(comment["comment-id"])
                          }
                          style={{ color: "#ff4d4f", padding: "0 8px" }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Space>
                )}
              </>
            )}
            {replyingToCommentId === comment["comment-id"] && (
              <div style={{ marginTop: 12 }}>
                <TextArea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 8, borderRadius: 4 }}
                />
                <Space>
                  <Button
                    type="primary"
                    onClick={() => handleAddReply(comment["comment-id"])}
                    loading={actionLoading}
                    disabled={!currentUserId}
                    style={{ borderRadius: 4 }}
                  >
                    Post Reply
                  </Button>
                  <Button
                    onClick={handleCancelReply}
                    style={{ borderRadius: 4 }}
                  >
                    Cancel
                  </Button>
                </Space>
              </div>
            )}
            {comment.comments && comment.comments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {comment.comments.map((childComment) =>
                  renderComment(childComment, depth + 1)
                )}
              </div>
            )}
          </div>
        </Space>
      </div>
    );
  };

  return (
    <div
      className="project-updates"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}
    >
      {isCreator && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAddModal}
          style={{ marginBottom: 24, borderRadius: 6 }}
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
                marginBottom: 24,
                cursor: "pointer",
                borderRadius: 8,
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
              hoverable
              onClick={() => handleOpenModal(update)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <Title
                    level={4}
                    style={{ marginBottom: 8, color: "#1f1f1f" }}
                  >
                    {update.title}
                  </Title>
                  <Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      <CalendarOutlined style={{ marginRight: 6 }} />
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
                style={{ maxHeight: "120px", overflow: "hidden" }}
              >
                <TipTapViewer
                  content={truncateContent(update.description, 200)}
                />
              </div>
              <div style={{ textAlign: "right", marginTop: 12 }}>
                <Button
                  type="link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(update);
                  }}
                  style={{ color: "#1890ff" }}
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
            style={{ textAlign: "center", marginTop: 24 }}
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} updates`}
          />
        </>
      ) : (
        <Card style={{ borderRadius: 8 }}>
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
        width="80%"
        style={{ maxWidth: "900px", top: 20 }}
        footer={[
          <Button
            key="close"
            onClick={handleCloseModal}
            style={{ borderRadius: 4 }}
          >
            Close
          </Button>,
        ]}
        bodyStyle={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}
      >
        {selectedUpdate ? (
          <>
            <Space wrap style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 6 }} />
                {formatDate(selectedUpdate["created-datetime"])}
              </Text>
              {selectedUpdate.status && (
                <Tag color="blue">{selectedUpdate.status}</Tag>
              )}
              {selectedUpdate.user && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Posted by: {selectedUpdate.user.fullname}
                </Text>
              )}
            </Space>
            <Divider style={{ margin: "16px 0" }} />
            <div className="update-content" style={{ lineHeight: 1.8 }}>
              <TipTapViewer content={selectedUpdate.description} />
            </div>
            <Divider style={{ margin: "24px 0" }} />
            <div className="comments-section">
              <Title level={5} style={{ marginBottom: 16 }}>
                Comments
              </Title>
              {commentsLoading ? (
                <Spin tip="Loading comments..." />
              ) : comments.length > 0 ? (
                comments.map((comment) => renderComment(comment))
              ) : (
                <Text type="secondary">No comments yet.</Text>
              )}
              <Divider style={{ margin: "24px 0" }} />
              <div style={{ marginTop: 24 }}>
                <TextArea
                  placeholder={
                    currentUserId
                      ? "Write a comment..."
                      : "Please log in to comment"
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  style={{ marginBottom: 12, borderRadius: 4 }}
                  disabled={!currentUserId}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                  loading={actionLoading}
                  disabled={!currentUserId}
                  style={{ borderRadius: 4 }}
                >
                  Post Comment
                </Button>
              </div>
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
        width="80%"
        style={{ maxWidth: "900px", top: 20 }}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseAddModal}
            disabled={actionLoading}
            style={{ borderRadius: 4 }}
          >
            Cancel
          </Button>,
          <Button
            key="add"
            type="primary"
            onClick={handleAddUpdate}
            loading={actionLoading}
            style={{ borderRadius: 4 }}
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
            style={{ marginBottom: 16, borderRadius: 4 }}
          />
          <Select
            value={newStatus}
            onChange={setNewStatus}
            style={{ width: "100%", marginBottom: 16 }}
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
        width="80%"
        style={{ maxWidth: "900px", top: 20 }}
        onCancel={handleCloseEditModal}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseEditModal}
            disabled={actionLoading}
            style={{ borderRadius: 4 }}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveEdit}
            loading={actionLoading}
            style={{ borderRadius: 4 }}
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
            style={{ marginBottom: 16, borderRadius: 4 }}
          />
          <Select
            value={editStatus}
            onChange={setEditStatus}
            style={{ width: "100%", marginBottom: 16 }}
          >
            <Option value="PUBLIC">PUBLIC</Option>
            <Option value="PRIVATE">PRIVATE</Option>
            <Option value="EXCLUSIVE">EXCLUSIVE</Option>
          </Select>
          <TipTapEditor content={editContent} setContent={setEditContent} />
        </Spin>
      </Modal>

      {/* Delete Update Confirmation Modal */}
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
            style={{ borderRadius: 4 }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleDeleteUpdate}
            loading={actionLoading}
            style={{ borderRadius: 4 }}
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

      {/* Delete Comment Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", marginRight: 8 }}
            />
            Confirm Deletion
          </div>
        }
        open={isDeleteCommentModalOpen}
        onCancel={handleCloseDeleteCommentModal}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="cancel"
            onClick={handleCloseDeleteCommentModal}
            disabled={actionLoading}
            style={{ borderRadius: 4 }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleDeleteComment}
            loading={actionLoading}
            style={{ borderRadius: 4 }}
          >
            Delete
          </Button>,
        ]}
      >
        <Paragraph>
          Are you sure you want to delete this comment? This action cannot be
          undone.
        </Paragraph>
      </Modal>
    </div>
  );
};

export default ProjectUpdates;

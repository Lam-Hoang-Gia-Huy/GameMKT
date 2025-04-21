import React, { useState, useEffect } from "react";
import {
  List,
  Avatar,
  Button,
  Input,
  Form,
  Typography,
  Card,
  message,
  Spin,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { apiAuth } from "../../api/apiClient";
import useAuth from "../../components/Hooks/useAuth"; // Import useAuth to get user info

const { TextArea } = Input;
const { Text } = Typography;

const ProjectComments = ({ projectId }) => {
  const { auth } = useAuth(); // Get auth info
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingComment, setReplyingComment] = useState(null); // Track comment being replied to
  const [replyText, setReplyText] = useState(""); // Text for replies
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  // Fetch comments for the project
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await apiAuth.get(
        `/api/Comment/GetCommentsByProjectId?projectId=${projectId}`
      );
      if (response.data.success) {
        setComments(response.data.data);
      } else {
        message.error(response.data.message || "Failed to fetch comments");
      }
    } catch (error) {
      message.error("Error fetching comments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new comment or reply
  const handleAddComment = async (parentCommentId = "") => {
    const content = parentCommentId ? replyText : newComment;
    if (!content.trim()) {
      message.warning("Comment cannot be empty");
      return;
    }

    if (!auth?.id) {
      message.warning("You must be logged in to comment");
      return;
    }

    const formData = new FormData();
    formData.append("ProjectId", projectId);
    formData.append("Content", content);
    formData.append("ParentCommentId", parentCommentId);

    try {
      const response = await apiAuth.post("/api/Comment/project", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        message.success("Comment added successfully");
        if (parentCommentId) {
          setReplyText("");
          setReplyingComment(null);
        } else {
          setNewComment("");
        }
        fetchComments(); // Refresh comments
      } else {
        message.error(response.data.message || "Failed to add comment");
      }
    } catch (error) {
      message.error("Error adding comment");
      console.error(error);
    }
  };

  // Edit a comment
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) {
      message.warning("Comment cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append("CommentId", commentId);
    formData.append("Content", editText);

    try {
      const response = await apiAuth.put(
        "/api/Comment/UpdateComment",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.data.success) {
        message.success("Comment updated successfully");
        setEditingComment(null);
        setEditText("");
        fetchComments(); // Refresh comments
      } else {
        message.error(response.data.message || "Failed to update comment");
      }
    } catch (error) {
      message.error("Error updating comment");
      console.error(error);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      const response = await apiAuth.delete(
        `/api/Comment/DeleteComment?commentId=${commentId}`
      );
      if (response.data.success) {
        message.success("Comment deleted successfully");
        fetchComments(); // Refresh comments
      } else {
        message.error(response.data.message || "Failed to delete comment");
      }
    } catch (error) {
      message.error("Error deleting comment");
      console.error(error);
    }
  };

  // Start replying to a comment
  const handleReplyComment = (comment) => {
    setReplyingComment(comment);
    setReplyText("");
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingComment(null);
    setReplyText("");
  };

  // Fetch comments on component mount or projectId change
  useEffect(() => {
    fetchComments();
  }, [projectId]);

  // Pagination logic
  const indexOfLastComment = currentPage * pageSize;
  const indexOfFirstComment = indexOfLastComment - pageSize;
  const currentComments = comments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );

  // Recursive render function for comments
  const renderComment = (comment, level = 0) => (
    <Card
      style={{
        borderRadius: 12,
        marginBottom: 12,
        background: "#f9f9f9",
        marginLeft: level * 20, // Indent nested comments
      }}
      key={comment["comment-id"]}
    >
      <List.Item
        actions={
          auth?.id === comment["user-id"]
            ? [
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditComment(comment)}
                  style={{ color: "#1890ff" }}
                >
                  Edit
                </Button>,
                <Popconfirm
                  title="Are you sure you want to delete this comment?"
                  onConfirm={() => handleDeleteComment(comment["comment-id"])}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    style={{ color: "#ff4d4f" }}
                  >
                    Delete
                  </Button>
                </Popconfirm>,
                <Button
                  type="text"
                  icon={<CommentOutlined />}
                  onClick={() => handleReplyComment(comment)}
                  style={{ color: "#52c41a" }}
                >
                  Reply
                </Button>,
              ]
            : [
                <Button
                  type="text"
                  icon={<CommentOutlined />}
                  onClick={() => handleReplyComment(comment)}
                  style={{ color: "#52c41a" }}
                >
                  Reply
                </Button>,
              ]
        }
        style={{ padding: 2 }}
      >
        <List.Item.Meta
          avatar={<Avatar src={comment.user.avatar} size={40} />}
          title={
            <Text style={{ fontSize: "16px", fontWeight: "500" }}>
              {comment.user.fullname}
            </Text>
          }
          description={
            <>
              {editingComment?.["comment-id"] === comment["comment-id"] ? (
                <TextArea
                  rows={2}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
              ) : (
                <Text style={{ fontSize: "14px" }}>{comment.content}</Text>
              )}
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {new Date(comment["created-datetime"]).toLocaleString()}
                {comment["updated-datetime"] !==
                  comment["created-datetime"] && (
                  <Text type="secondary"> (Edited)</Text>
                )}
              </div>
              {editingComment?.["comment-id"] === comment["comment-id"] && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleSaveEdit(comment["comment-id"])}
                  style={{ marginTop: 4, marginRight: 8 }}
                >
                  Save
                </Button>
              )}
              {editingComment?.["comment-id"] === comment["comment-id"] && (
                <Button
                  size="small"
                  onClick={() => setEditingComment(null)}
                  style={{ marginTop: 4 }}
                >
                  Cancel
                </Button>
              )}
              {replyingComment?.["comment-id"] === comment["comment-id"] && (
                <div style={{ marginTop: 8 }}>
                  <Form
                    onFinish={() => handleAddComment(comment["comment-id"])}
                  >
                    <TextArea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      style={{ borderRadius: 8 }}
                    />
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="small"
                      style={{ marginTop: 4, marginRight: 8 }}
                    >
                      Submit Reply
                    </Button>
                    <Button
                      size="small"
                      onClick={handleCancelReply}
                      style={{ marginTop: 4 }}
                    >
                      Cancel
                    </Button>
                  </Form>
                </div>
              )}
            </>
          }
        />
      </List.Item>
      {comment.comments && comment.comments.length > 0 && (
        <List
          dataSource={comment.comments}
          renderItem={(nestedComment) =>
            renderComment(nestedComment, level + 1)
          }
        />
      )}
    </Card>
  );

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 4 }}>
      <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: 16 }}>
        Comments
      </h3>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin />
        </div>
      ) : (
        <List
          dataSource={currentComments}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: comments.length,
            onChange: (page) => setCurrentPage(page),
          }}
          renderItem={(comment) => renderComment(comment)}
        />
      )}

      <Card style={{ borderRadius: 12, padding: 16, background: "#fff" }}>
        <Form onFinish={() => handleAddComment()}>
          <TextArea
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            style={{ borderRadius: 8 }}
            disabled={!auth?.id} // Disable if not logged in
          />
          <Button
            type="primary"
            htmlType="submit"
            disabled={!auth?.id} // Disable if not logged in
            style={{
              marginTop: 8,
              width: "150px",
              height: 40,
              fontSize: "16px",
              borderRadius: 8,
              background: "#1890ff",
              border: "none",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Add Comment
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectComments;

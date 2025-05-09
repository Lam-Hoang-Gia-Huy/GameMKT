import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Input as AntInput,
  Tag,
  Typography,
  Skeleton,
  Popconfirm,
  Row,
  Col,
  Empty,
  Spin,
  List,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import TipTapEditor from "../components/TipTapEditor";
import TipTapViewer from "../components/TipTapViewer";
import debounce from "lodash/debounce";
import {
  fetchUserProjects,
  createPost,
  fetchPostsByProject,
  updatePost,
  deletePost,
  fetchCommentsByPostId,
} from "../api/apiClient";

const { Option } = Select;
const { Title, Text } = Typography;

const PostManagement = () => {
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingPost, setEditingPost] = useState(null);
  const [description, setDescription] = useState("");
  const [viewPost, setViewPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilteredPosts(
        posts.filter((post) =>
          post.title.toLowerCase().includes(value.toLowerCase())
        )
      );
    }, 300),
    [posts]
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await fetchUserProjects();
        if (response.data.success) {
          setProjects(
            response.data.data.filter((project) => project.status !== "DELETED")
          );
        } else {
          message.error("Failed to load projects");
        }
      } catch (error) {
        message.error("Error loading projects");
        console.error(error);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch posts when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchPosts(selectedProjectId, pagination.current, pagination.pageSize);
    } else {
      setPosts([]);
      setFilteredPosts([]);
    }
  }, [selectedProjectId]);

  // Filter posts based on search text
  useEffect(() => {
    debouncedSearch(searchText);
    return () => debouncedSearch.cancel();
  }, [searchText, debouncedSearch]);

  // Fetch posts for a selected project
  const fetchPosts = async (projectId, page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await fetchPostsByProject(projectId, page, pageSize);
      if (response.data.success) {
        const postsData = response.data.data["list-data"] || [];
        setPosts(postsData);
        setFilteredPosts(postsData);
        setPagination({
          current: response.data.data.page || 1,
          pageSize: response.data.data.pageSize || 10,
          total: response.data.data["total-records"] || 0,
        });
      } else {
        message.error("Failed to load posts");
      }
    } catch (error) {
      message.error("Error loading posts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setSearchText("");
    setPagination({ ...pagination, current: 1 });
  };

  const showModal = (post = null) => {
    setEditingPost(post);
    if (post) {
      form.setFieldsValue({
        ProjectId: post["project-id"],
        Title: post.title,
        Status: post.status,
      });
      setDescription(post.description || "");
    } else {
      form.resetFields();
      form.setFieldsValue({
        ProjectId: selectedProjectId,
        Status: "PUBLIC",
      });
      setDescription("");
    }
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const postData = {
        ProjectId: values.ProjectId,
        Title: values.Title,
        Description: description,
        Status: values.Status,
      };

      setModalLoading(true);
      if (editingPost) {
        await updatePost(editingPost["post-id"], postData);
        message.success("Post updated successfully");
      } else {
        await createPost(postData);
        message.success("Post created successfully");
      }
      fetchPosts(selectedProjectId, pagination.current, pagination.pageSize);
      setIsModalVisible(false);
      form.resetFields();
      setDescription("");
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error("Failed to save post");
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      setLoading(true);
      await deletePost(postId);
      message.success("Post deleted successfully");
      fetchPosts(selectedProjectId, pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("Failed to delete post");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Show post details and fetch comments
  const showViewModal = async (postId) => {
    const post = posts.find((p) => p["post-id"] === postId);
    if (post) {
      setViewPost(post);
      try {
        setCommentsLoading(true);
        const response = await fetchCommentsByPostId(postId);
        if (response.data.success) {
          setComments(response.data.data || []);
        } else {
          message.error(response.data.message || "Failed to load comments");
        }
      } catch (error) {
        message.error("Error loading comments");
        console.error(error);
      } finally {
        setCommentsLoading(false);
      }
      setIsViewModalVisible(true);
    } else {
      message.error("Post not found");
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Get status tag color
  const getStatusColor = (status) => {
    switch (status) {
      case "PUBLIC":
        return "green";
      case "PRIVATE":
        return "blue";
      case "EXCLUSIVE":
        return "purple";
      default:
        return "default";
    }
  };
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} key={status}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Created Date",
      dataIndex: "created-datetime",
      key: "created-datetime",
      width: 180,
      render: (date) =>
        new Date(date).toLocaleString("vi-VN", {
          timeZone: "UTC",
        }),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record["post-id"])}
            type="link"
            title="View Details"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            type="link"
            title="Edit"
          />
          <Popconfirm
            title="Delete Post"
            description="Are you sure you want to delete this post?"
            onConfirm={() => handleDelete(record["post-id"])}
            okText="Delete"
            cancelText="Cancel"
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
          >
            <Button
              icon={<DeleteOutlined />}
              type="link"
              danger
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const ProjectSelectionSkeleton = () => (
    <Skeleton.Input style={{ width: 300, marginBottom: 16 }} active />
  );

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        selectedProjectId
          ? "No posts available"
          : "Please select a project to view posts"
      }
    >
      {selectedProjectId && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Create New Post
        </Button>
      )}
    </Empty>
  );

  return (
    <Card
      title={<Title level={4}>Post Management</Title>}
      style={{
        margin: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}
      bodyStyle={{ padding: "16px" }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={8}>
            {projectsLoading ? (
              <ProjectSelectionSkeleton />
            ) : (
              <Select
                style={{ width: "100%" }}
                placeholder="Select Project"
                onChange={handleProjectSelect}
                allowClear
                loading={projectsLoading}
                showSearch
                optionFilterProp="children"
              >
                {projects.map((project) => (
                  <Option
                    key={project["project-id"]}
                    value={project["project-id"]}
                  >
                    {project.title}
                  </Option>
                ))}
              </Select>
            )}
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <AntInput
              placeholder="Search posts by title"
              value={searchText}
              onChange={handleSearch}
              style={{ width: "100%" }}
              allowClear
              prefix={<SearchOutlined />}
              disabled={!selectedProjectId}
            />
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              disabled={!selectedProjectId}
            >
              Create Post
            </Button>
          </Col>
        </Row>

        {loading && !posts.length ? (
          <div style={{ padding: "20px 0" }}>
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredPosts}
            rowKey="post-id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total) => `Total ${total} posts`,
            }}
            loading={loading}
            onChange={(newPagination) =>
              fetchPosts(
                selectedProjectId,
                newPagination.current,
                newPagination.pageSize
              )
            }
            style={{
              background: "#fff",
              borderRadius: "8px",
              marginTop: 16,
            }}
            locale={{
              emptyText: renderEmptyState(),
            }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Space>

      <Modal
        title={editingPost ? "Edit Post" : "Create New Post"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText={editingPost ? "Update" : "Create"}
        cancelText="Cancel"
        confirmLoading={modalLoading}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "24px" }}
        destroyOnClose
      >
        <Spin spinning={modalLoading}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="ProjectId"
              label="Project"
              rules={[{ required: true, message: "Please select a project" }]}
            >
              <Select disabled={editingPost || !!selectedProjectId}>
                {projects.map((project) => (
                  <Option
                    key={project["project-id"]}
                    value={project["project-id"]}
                  >
                    {project.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="Title"
              label="Title"
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <Input placeholder="Enter post title" />
            </Form.Item>
            <Form.Item
              name="Status"
              label="Status"
              rules={[{ required: true, message: "Please select a status" }]}
            >
              <Select>
                <Option value="PUBLIC">PUBLIC</Option>
                <Option value="PRIVATE">PRIVATE</Option>
                <Option value="EXCLUSIVE">EXCLUSIVE</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Content">
              <TipTapEditor content={description} setContent={setDescription} />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* View Post Modal */}
      <Modal
        title="Post Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", padding: "24px" }}
        destroyOnClose
      >
        {viewPost ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Title level={3}>{viewPost.title}</Title>
            <Space wrap>
              <Tag color={getStatusColor(viewPost.status)}>
                {viewPost.status}
              </Tag>
              <Text type="secondary">
                Created by: {viewPost.user?.fullname || "No information"}
              </Text>
              <Text type="secondary">
                Created Date:{" "}
                {new Date(viewPost["created-datetime"]).toLocaleString("en-US")}
              </Text>
            </Space>
            <Card title="Content" bordered={false}>
              <TipTapViewer content={viewPost.description} />
            </Card>
            <Card title="Comments" bordered={false}>
              {commentsLoading ? (
                <Spin tip="Loading comments..." />
              ) : comments.length > 0 ? (
                <List
                  dataSource={comments}
                  renderItem={(comment) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<div />}
                        title={
                          <Text strong>
                            {comment.user?.fullname || "Anonymous"}
                          </Text>
                        }
                        description={
                          <div>
                            <Text>{comment.content}</Text>
                            <br />
                            <Text type="secondary">
                              {new Date(
                                comment["created-datetime"]
                              ).toLocaleString("en-US")}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No comments yet.</Text>
              )}
            </Card>
          </Space>
        ) : (
          <Empty description="No data available" />
        )}
      </Modal>
    </Card>
  );
};

export default PostManagement;

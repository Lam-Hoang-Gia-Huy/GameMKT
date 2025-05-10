import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Pagination,
  Spin,
  Typography,
  List,
  Divider,
  Tooltip,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import { Link } from "react-router-dom";
import {
  getProjectCollaborators,
  fetchPostsByProject,
  createPost,
  updatePost,
  deletePost,
  fetchCommentsByPostId,
  getCollaboratorProjects,
} from "../api/apiClient";
import useAuth from "../components/Hooks/useAuth";
import {
  UserOutlined,
  ProjectOutlined,
  UsergroupAddOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import TipTapEditor from "../components/TipTapEditor";
import TipTapViewer from "../components/TipTapViewer";

const { Title, Text } = Typography;
const { Option } = Select;

const EditorProjects = () => {
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalProjects, setTotalProjects] = useState(0);

  // Post management states
  const [posts, setPosts] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [isViewPostModalVisible, setIsViewPostModalVisible] = useState(false);
  const [postForm] = Form.useForm();
  const [editingPost, setEditingPost] = useState(null);
  const [postDescription, setPostDescription] = useState("");
  const [viewPost, setViewPost] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    const fetchEditorProjects = async () => {
      try {
        setLoading(true);
        const response = await getCollaboratorProjects(auth.id);
        const projectsData = response.data.data || [];
        setProjects(projectsData);
        setTotalProjects(projectsData.length);

        // Fetch collaborators for each project
        const collaboratorsData = {};
        await Promise.all(
          projectsData.map(async (item) => {
            const collabResponse = await getProjectCollaborators(
              item["project-id"]
            );
            collaboratorsData[item["project-id"]] =
              collabResponse.data.data || [];
          })
        );
        setCollaborators(collaboratorsData);
      } catch (error) {
        console.error(
          "Error fetching editor projects or collaborators:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (auth?.id) {
      fetchEditorProjects();
    }
  }, [auth?.id]);

  // Fetch posts for a project
  const fetchPosts = async (projectId, page = 1, pageSize = 10) => {
    try {
      setPostLoading(true);
      const response = await fetchPostsByProject(projectId, page, pageSize);
      if (response.data.success) {
        setPosts(response.data.data["list-data"] || []);
      } else {
        message.error("Failed to load posts");
      }
    } catch (error) {
      message.error("Error loading posts");
      console.error(error);
    } finally {
      setPostLoading(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      fetchPosts(projectId);
    } else {
      setPosts([]);
    }
  };

  const showPostModal = (post = null) => {
    setEditingPost(post);
    if (post) {
      postForm.setFieldsValue({
        Title: post.title,
        Status: post.status,
      });
      setPostDescription(post.description || "");
    } else {
      postForm.resetFields();
      postForm.setFieldsValue({
        Status: "PUBLIC",
      });
      setPostDescription("");
    }
    setIsPostModalVisible(true);
  };

  const handlePostSubmit = async () => {
    try {
      const values = await postForm.validateFields();
      const postData = {
        ProjectId: selectedProjectId,
        Title: values.Title,
        Description: postDescription,
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
      fetchPosts(selectedProjectId);
      setIsPostModalVisible(false);
    } catch (error) {
      message.error("Failed to save post");
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setPostLoading(true);
      await deletePost(postId);
      message.success("Post deleted successfully");
      fetchPosts(selectedProjectId);
    } catch (error) {
      message.error("Failed to delete post");
      console.error(error);
    } finally {
      setPostLoading(false);
    }
  };

  const showViewPostModal = async (post) => {
    setViewPost(post);
    try {
      setCommentsLoading(true);
      const response = await fetchCommentsByPostId(post["post-id"]);
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
    setIsViewPostModalVisible(true);
  };

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

  const postColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Created Date",
      dataIndex: "created-datetime",
      key: "created-datetime",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showViewPostModal(record)}
            type="link"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showPostModal(record)}
            type="link"
          />
          <Popconfirm
            title="Delete Post"
            description="Are you sure you want to delete this post?"
            onConfirm={() => handleDeletePost(record["post-id"])}
            okText="Delete"
            cancelText="Cancel"
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const paginatedProjects = projects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-5">
      <Title level={2} style={{ marginBottom: 0 }}>
        <UsergroupAddOutlined /> Collaborative projects
      </Title>
      <Text type="secondary">List of your Collaborative projects</Text>
      <Divider />

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Text className="text-gray-500 text-lg">
            You don't have editor access to any projects.
          </Text>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {paginatedProjects.map((item) => (
              <Col key={item["project-id"]} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={item.project.title}
                      src={
                        item.project.thumbnail ||
                        "https://via.placeholder.com/300"
                      }
                      className="h-40 object-cover"
                    />
                  }
                  actions={[
                    <Button type="primary" className="bg-blue-500">
                      <Link
                        style={{ color: "white" }}
                        to={`/edit-project/${item["project-id"]}`}
                      >
                        Edit Project
                      </Link>
                    </Button>,
                    <Button
                      type="primary"
                      className="bg-blue-500"
                      onClick={() => handleProjectSelect(item["project-id"])}
                    >
                      Manage Posts
                    </Button>,
                  ]}
                  className="shadow-md"
                >
                  <Card.Meta
                    title={
                      <span className="text-lg font-semibold">
                        {item.project.title}
                      </span>
                    }
                    description={
                      <Text
                        ellipsis={{ tooltip: item.project.description }}
                        className="text-gray-600"
                      >
                        {item.project.description}
                      </Text>
                    }
                  />
                  <div className="mt-4">
                    <Text strong className="text-gray-700">
                      Your Role:{" "}
                    </Text>
                    <Text className="text-gray-600">{item.role}</Text>
                  </div>
                  <div className="mt-4">
                    <Text strong className="text-gray-700">
                      Collaborators:
                    </Text>
                    <List
                      dataSource={collaborators[item["project-id"]] || []}
                      renderItem={(collab) => (
                        <Tooltip
                          title={`User Role: ${collab.user.role}`}
                          placement="top"
                        >
                          <List.Item className="py-2 hover:bg-gray-100 rounded transition">
                            <div className="flex items-center space-x-3">
                              {collab.user.avatar ? (
                                <img
                                  src={collab.user.avatar}
                                  alt={collab.user.fullname}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <UserOutlined className="text-xl text-gray-400" />
                              )}
                              <div>
                                <Text className="text-gray-800 font-medium">
                                  {collab.user.fullname}
                                </Text>
                                <Text className="text-gray-500 text-sm block">
                                  {collab.role}
                                </Text>
                              </div>
                            </div>
                          </List.Item>
                        </Tooltip>
                      )}
                      locale={{
                        emptyText: (
                          <div className="text-center py-4 text-gray-500">
                            <UserOutlined className="text-2xl mb-2" />
                            <div>No collaborators</div>
                          </div>
                        ),
                      }}
                      className="mt-2"
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row justify="center" className="mt-6">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalProjects}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={["6", "12", "18", "24"]}
              className="text-center"
            />
          </Row>
        </>
      )}

      {/* Post Management Modal */}
      <Modal
        title={`Posts for ${
          projects.find((p) => p["project-id"] === selectedProjectId)?.title ||
          "Project"
        }`}
        open={!!selectedProjectId}
        onCancel={() => handleProjectSelect(null)}
        width="80%"
        footer={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showPostModal()}
          >
            Add Post
          </Button>,
          <Button key="close" onClick={() => handleProjectSelect(null)}>
            Close
          </Button>,
        ]}
      >
        <Table
          columns={postColumns}
          dataSource={posts}
          rowKey="post-id"
          loading={postLoading}
          locale={{
            emptyText: "No posts available for this project",
          }}
        />
      </Modal>

      {/* Post Edit/Create Modal */}
      <Modal
        title={editingPost ? "Edit Post" : "Create Post"}
        open={isPostModalVisible}
        onOk={handlePostSubmit}
        onCancel={() => setIsPostModalVisible(false)}
        confirmLoading={modalLoading}
        width="70%"
      >
        <Form form={postForm} layout="vertical">
          <Form.Item
            name="Title"
            label="Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select>
              <Option value="PUBLIC">Public</Option>
              <Option value="PRIVATE">Private</Option>
              <Option value="EXCLUSIVE">Exclusive</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Content">
            <TipTapEditor
              content={postDescription}
              setContent={setPostDescription}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Post View Modal */}
      <Modal
        title={viewPost?.title || "Post Details"}
        open={isViewPostModalVisible}
        onCancel={() => setIsViewPostModalVisible(false)}
        width="70%"
        footer={null}
      >
        {viewPost && (
          <div>
            <Space>
              <Tag color={getStatusColor(viewPost.status)}>
                {viewPost.status}
              </Tag>
              <Text type="secondary">
                Created:{" "}
                {new Date(viewPost["created-datetime"]).toLocaleString()}
              </Text>
            </Space>
            <Divider />
            <TipTapViewer content={viewPost.description} />

            <Divider>Comments</Divider>
            {commentsLoading ? (
              <Spin tip="Loading comments..." />
            ) : comments.length > 0 ? (
              <List
                dataSource={comments}
                renderItem={(comment) => (
                  <List.Item>
                    <List.Item.Meta
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
                            ).toLocaleString()}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No comments yet</Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EditorProjects;

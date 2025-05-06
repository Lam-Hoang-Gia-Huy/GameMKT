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
} from "antd";
import { Link } from "react-router-dom";
import { apiAuth, getProjectCollaborators } from "../api/apiClient";
import useAuth from "../components/Hooks/useAuth";
import {
  UserOutlined,
  ProjectOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const EditorProjects = () => {
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [collaborators, setCollaborators] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    const fetchEditorProjects = async () => {
      try {
        setLoading(true);
        const response = await apiAuth.get(
          `/api/Collaborator/user?userId=${auth.id}`
        );
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
                        className="text-white"
                        to={`/edit-project/${item["project-id"]}`}
                      >
                        Edit Project
                      </Link>
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
    </div>
  );
};

export default EditorProjects;

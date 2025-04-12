import React, { useState, useEffect } from "react";
import { Card, Button, Row, Col, Pagination, Spin, Typography } from "antd";
import { Link } from "react-router-dom";
import { apiAuth } from "../api/apiClient";
import useAuth from "../components/Hooks/useAuth";

const { Title, Text } = Typography;

const EditorProjects = () => {
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
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
      } catch (error) {
        console.error("Error fetching editor projects:", error);
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
      <div
        style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Projects You Can Edit</Title>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Text>You don't have editor access to any projects.</Text>
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
                      style={{ height: "150px", objectFit: "cover" }}
                    />
                  }
                  actions={[
                    <Button type="primary">
                      <Link to={`/edit-project/${item["project-id"]}`}>
                        Edit Project
                      </Link>
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={item.project.title}
                    description={
                      <Text ellipsis={{ tooltip: item.project.description }}>
                        {item.project.description}
                      </Text>
                    }
                  />
                  <div style={{ marginTop: "16px" }}>
                    <Text strong>Your Role: </Text>
                    <Text>{item.role}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row justify="center" style={{ marginTop: "20px" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalProjects}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={["6", "12", "18", "24"]}
            />
          </Row>
        </>
      )}
    </div>
  );
};

export default EditorProjects;

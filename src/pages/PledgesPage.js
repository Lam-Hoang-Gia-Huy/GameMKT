import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Spin,
  Typography,
  Divider,
  Image,
  Tag,
  Row,
  Col,
  Progress,
  Space,
  Button,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  ProjectOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import placeholder from "../assets/placeholder-1-1-1.png";
import { fetchPledgesByUserId, fetchProject } from "../api/apiClient";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PledgesPage = () => {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchPledgesByUserId();
        if (res.data.success) {
          const pledgeData = res.data.data || [];

          const pledgesWithProjects = await Promise.all(
            pledgeData.map(async (pledge) => {
              try {
                const projectRes = await fetchProject(pledge["project-id"]);
                if (projectRes.data.success) {
                  const projectData = projectRes.data.data || {
                    id: pledge["project-id"],
                    title: "Hidden Project",
                    description:
                      "This project is currently private or deleted.",
                    thumbnail: placeholder,
                    status: "Hidden",
                    "total-amount": 0,
                    "minimum-amount": 0,
                    "end-datetime": null,
                  };
                  // Kiểm tra và xử lý thumbnail là "unknown"
                  if (projectData.thumbnail === "unknown") {
                    projectData.thumbnail = placeholder;
                  }
                  return {
                    ...pledge,
                    project: projectData,
                  };
                } else {
                  if (
                    projectRes.data["status-code"] !== 403 ||
                    projectRes.data.message !== "This project is private."
                  ) {
                    message.error(
                      projectRes.data.message ||
                        "Failed to fetch project details"
                    );
                  }
                  return {
                    ...pledge,
                    project: {
                      id: pledge["project-id"],
                      title: "Hidden Project",
                      description:
                        "This project is currently private or deleted.",
                      thumbnail: placeholder,
                      status: "Hidden",
                      "total-amount": 0,
                      "minimum-amount": 0,
                      "end-datetime": null,
                    },
                  };
                }
              } catch (error) {
                if (
                  error.response?.data?.message ===
                    "This project is private." ||
                  error.response?.data?.message === "This project is deleted."
                ) {
                  return {
                    ...pledge,
                    project: {
                      id: pledge["project-id"],
                      title: "Hidden Project",
                      description:
                        "This project is currently private or deleted.",
                      thumbnail: placeholder,
                      status: "Hidden",
                      "total-amount": 0,
                      "minimum-amount": 0,
                      "end-datetime": null,
                    },
                  };
                }
                message.error(
                  error.response?.data?.message ||
                    "Failed to fetch project details"
                );
                return {
                  ...pledge,
                  project: {
                    id: pledge["project-id"],
                    title: "Hidden Project",
                    description:
                      "This project is currently private or deleted.",
                    thumbnail: placeholder,
                    status: "Hidden",
                    "total-amount": 0,
                    "minimum-amount": 0,
                    "end-datetime": null,
                  },
                };
              }
            })
          );

          setPledges(pledgesWithProjects);
        } else {
          message.error(res.data.message || "Failed to load pledges");
        }
      } catch (error) {
        message.error(
          error.response?.data?.message || "Failed to load pledges"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusTag = (status) => {
    switch (status) {
      case "APPROVED":
      case "ONGOING":
        return (
          <Tag icon={<ClockCircleOutlined />} color="blue">
            {status}
          </Tag>
        );
      case "SUCCESSFUL":
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            SUCCESSFUL
          </Tag>
        );
      case "TRANSFERRED":
        return (
          <Tag icon={<DollarOutlined />} color="cyan">
            TRANSFERRED
          </Tag>
        );
      case "INSUFFICIENT":
      case "REFUNDED":
        return (
          <Tag icon={<InfoCircleOutlined />} color="orange">
            {status}
          </Tag>
        );
      case "CREATED":
      case "REJECTED":
      case "SUBMITTED":
        return (
          <Tag icon={<EyeInvisibleOutlined />} color="default">
            {status}
          </Tag>
        );
      case "DELETED":
        return (
          <Tag icon={<DeleteOutlined />} color="red">
            DELETED
          </Tag>
        );
      case "Hidden":
        return (
          <Tag icon={<EyeInvisibleOutlined />} color="default">
            HIDDEN
          </Tag>
        );
      default:
        return <Tag color="gray">{status}</Tag>;
    }
  };

  const getPaymentStatusTag = (status) => {
    switch (status) {
      case "TRANSFERRED":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Transferred
          </Tag>
        );
      case "PLEDGED":
        return (
          <Tag icon={<ClockCircleOutlined />} color="processing">
            Pledged
          </Tag>
        );
      case "FAILED":
        return (
          <Tag icon={<InfoCircleOutlined />} color="error">
            Failed
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="Loading your pledges..." />
      </div>
    );
  }

  if (pledges.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Title level={2}>Your Pledges</Title>
        <Divider />
        <Card>
          <Space direction="vertical" size="large">
            <ProjectOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            <Title level={4}>You haven't pledged to any projects yet</Title>
            <Text type="secondary">
              When you make pledges, they will appear here
            </Text>
            <br />
            <Button type="primary" href="/">
              Explore Projects
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ marginBottom: 0 }}>
        <DollarOutlined /> Your Pledges
      </Title>
      <Text type="secondary">Summary of all your pledges</Text>
      <Divider />

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
        dataSource={pledges}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          onChange: (page) => setCurrentPage(page),
          onShowSizeChange: (current, size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          showSizeChanger: true,
          pageSizeOptions: ["3", "5", "10"],
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} pledges`,
        }}
        renderItem={(pledge) => {
          const project = pledge.project;
          const pledgeData = pledge;
          const progressPercent =
            project && project["total-amount"] && project["minimum-amount"]
              ? Math.min(
                  100,
                  (project["total-amount"] / project["minimum-amount"]) * 100
                ).toFixed(2)
              : 0;

          return (
            <List.Item>
              <Card
                bordered={false}
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 12px 0 rgba(0, 0, 0, 0.1)",
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={8} lg={6}>
                    <Image
                      alt={project.title}
                      src={
                        project.thumbnail !== "unknown"
                          ? project.thumbnail
                          : placeholder
                      }
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                      preview={false}
                      fallback="https://via.placeholder.com/300x180?text=Hidden+Project"
                    />
                  </Col>
                  <Col xs={24} sm={24} md={16} lg={18}>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {project.title}
                      </Title>

                      <Text type="secondary" ellipsis={{ rows: 2 }}>
                        {project.description}
                      </Text>

                      <div style={{ margin: "8px 0" }}>
                        <Progress
                          percent={progressPercent}
                          status="active"
                          strokeColor={{
                            "0%": "#108ee9",
                            "100%": "#87d068",
                          }}
                        />
                        <Row justify="space-between">
                          <Col>
                            <Text strong>
                              {project["total-amount"]?.toLocaleString() || 0}{" "}
                              Dollar
                            </Text>
                          </Col>
                          <Col>
                            <Text strong>
                              {project["minimum-amount"]?.toLocaleString() || 0}{" "}
                              Dollar
                            </Text>
                          </Col>
                        </Row>
                      </div>

                      <Row gutter={16} align="middle">
                        <Col>
                          <Text strong>Project Status:</Text>{" "}
                          {getStatusTag(project.status)}
                        </Col>
                        <Col>
                          <Text strong>End Date:</Text>{" "}
                          {project["end-datetime"]
                            ? dayjs(project["end-datetime"]).format(
                                "MMM D, YYYY"
                              )
                            : "N/A"}
                        </Col>
                      </Row>

                      <Divider style={{ margin: "12px 0" }} />

                      <Row gutter={16}>
                        <Col xs={24} sm={24} md={12}>
                          <Card
                            size="small"
                            title={<Text strong>Pledge Information</Text>}
                          >
                            <Space direction="vertical">
                              <div>
                                <Text strong>Total Amount:</Text>{" "}
                                <Text
                                  style={{ color: "#1890ff", fontWeight: 500 }}
                                >
                                  {pledgeData["total-amount"]?.toLocaleString()}{" "}
                                  Dollar
                                </Text>
                              </div>
                            </Space>
                          </Card>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                          <Card
                            size="small"
                            title={<Text strong>Payment Details</Text>}
                          >
                            <List
                              size="small"
                              dataSource={pledgeData["pledge-details"]}
                              renderItem={(detail) => (
                                <List.Item>
                                  <Row gutter={8} style={{ width: "100%" }}>
                                    <Col flex="auto">
                                      <Text code>#{detail["payment-id"]}</Text>
                                    </Col>
                                    <Col>
                                      <Text strong>Amount:</Text>{" "}
                                      <Text>
                                        {detail.amount?.toLocaleString()} Dollar
                                      </Text>
                                    </Col>
                                    <Col>
                                      <Text strong>Paypal ID:</Text>{" "}
                                      <Text>
                                        {detail["invoice-id"] || "N/A"}
                                      </Text>
                                    </Col>
                                    <Col>
                                      <Text strong>Paypal URL:</Text>{" "}
                                      {detail["invoice-url"] ? (
                                        <a
                                          href={detail["invoice-url"]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          View link
                                        </a>
                                      ) : (
                                        <Text>Not Available</Text>
                                      )}
                                    </Col>
                                    <Col>
                                      <Text strong>Created:</Text>{" "}
                                      <Text>
                                        {dayjs(
                                          detail["created-datetime"]
                                        ).format("MMM D, YYYY HH:mm")}
                                      </Text>
                                    </Col>
                                    <Col>
                                      {getPaymentStatusTag(detail.status)}
                                    </Col>
                                  </Row>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default PledgesPage;

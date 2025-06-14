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
  Button,
  message,
  Modal,
  Statistic,
  Table,
  Space,
  Input,
} from "antd";
import {
  DollarOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { fetchUserProjects, exportPledgesToExcel } from "../api/apiClient";
import axios from "axios";
import dayjs from "dayjs";
import placeholder from "../assets/placeholder-1-1-1.png";

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;

const ProjectBackersPage = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [backers, setBackers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBackers, setLoadingBackers] = useState(false);
  const [projectPageSize, setProjectPageSize] = useState(3);
  const [projectCurrentPage, setProjectCurrentPage] = useState(1);
  const [backerPageSize, setBackerPageSize] = useState(5);
  const [backerCurrentPage, setBackerCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetchUserProjects();
        if (res.data.success) {
          const allProjects = res.data.data || [];
          const sortedProjects = allProjects.sort((a, b) => {
            if (a["total-amount"] > 0 && b["total-amount"] === 0) return -1;
            if (a["total-amount"] === 0 && b["total-amount"] > 0) return 1;
            return 0;
          });
          setProjects(sortedProjects);
          setFilteredProjects(sortedProjects);
        } else {
          message.error(res.data.message || "Failed to load projects");
        }
      } catch (error) {
        message.error(
          error.response?.data?.message || "Failed to load projects"
        );
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
    setProjectCurrentPage(1);
  }, [searchTerm, projects]);

  const fetchBackers = async (projectId) => {
    setLoadingBackers(true);
    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        `https://marvelous-gentleness-production.up.railway.app/api/Pledge/GetBacker/${projectId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );
      if (response.data.success) {
        setBackers(response.data.data || []);
        setSelectedProject(projectId);
      } else {
        message.error(
          response.data.message ||
            "No pledges found for the specified user and project"
        );
        setBackers([]);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "No pledges found for the specified user and project"
      );
      setBackers([]);
    } finally {
      setLoadingBackers(false);
    }
  };

  const handleExportToExcel = async (projectId, projectTitle) => {
    try {
      const response = await exportPledgesToExcel(projectId);
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Backers_${projectTitle}_${dayjs().format(
        "YYYY-MM-DD"
      )}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Excel file downloaded successfully!");
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to export backers to Excel"
      );
    }
  };

  const showDownloadConfirm = (projectId, projectTitle) => {
    confirm({
      title: "Do you want to download the backer list?",
      icon: <ExclamationCircleOutlined />,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        handleExportToExcel(projectId, projectTitle);
      },
    });
  };

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
      default:
        return <Tag color="gray">{status}</Tag>;
    }
  };

  const totalBackers = backers.length;
  const totalPledged = backers.reduce(
    (sum, backer) => sum + backer["total-amount"],
    0
  );

  const columns = [
    {
      title: "Backer ID",
      dataIndex: "backer-id",
      key: "backer-id",
    },
    {
      title: "Name",
      dataIndex: "backer-name",
      key: "backer-name",
    },
    {
      title: "Avatar",
      dataIndex: "backer-avatar",
      key: "backer-avatar",
      render: (avatar) =>
        avatar ? (
          <Image
            src={avatar}
            width={40}
            height={40}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <UserOutlined style={{ fontSize: 40 }} />
        ),
    },
    {
      title: "Total Amount",
      dataIndex: "total-amount",
      key: "total-amount",
      render: (amount) => `${amount.toLocaleString()} Dollar`,
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <Table
          size="small"
          pagination={false}
          dataSource={record["project-backer-details"]}
          columns={[
            {
              title: "Amount",
              dataIndex: "amount",
              key: "amount",
              render: (amount) => `${amount.toLocaleString()} Dollar`,
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status) => (
                <Tag color={status === "PLEDGED" ? "blue" : "green"}>
                  {status}
                </Tag>
              ),
            },
            {
              title: "Created",
              dataIndex: "created-datetime",
              key: "created-datetime",
              render: (date) => dayjs(date).format("MMM D, YYYY HH:mm"),
            },
          ]}
        />
      ),
    },
  ];

  if (loadingProjects) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" tip="Loading projects..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ marginBottom: 0 }}>
        <DollarOutlined /> Project Backers
      </Title>
      <Text type="secondary">
        View backers and export pledge data for your projects
      </Text>
      <Divider />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="Search by project title"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>

      {filteredProjects.length === 0 ? (
        <Card>
          <Space
            direction="vertical"
            size="large"
            style={{ textAlign: "center" }}
          >
            <UserOutlined style={{ fontSize: 48, color: "#1890ff" }} />
            <Title level={4}>No projects with pledges found</Title>
            <Text type="secondary">
              Projects with pledges greater than 0 will appear here
            </Text>
          </Space>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
          dataSource={filteredProjects}
          pagination={{
            current: projectCurrentPage,
            pageSize: projectPageSize,
            onChange: (page) => setProjectCurrentPage(page),
            onShowSizeChange: (current, size) => {
              setProjectPageSize(size);
              setProjectCurrentPage(1);
            },
            showSizeChanger: true,
            pageSizeOptions: ["3", "6", "9"],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} projects`,
          }}
          renderItem={(project) => (
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
                    <div style={{ height: 180, overflow: "hidden" }}>
                      <Image
                        alt={project.title}
                        src={project.thumbnail}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                        preview={false}
                        fallback={placeholder}
                      />
                    </div>
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
                      <Text type="secondary">
                        Total Pledged:{" "}
                        {project["total-amount"]?.toLocaleString() || 0} Dollar
                      </Text>
                      <Text type="secondary">
                        End Date:{" "}
                        {project["end-datetime"]
                          ? dayjs(project["end-datetime"]).format("MMM D, YYYY")
                          : "N/A"}
                      </Text>
                      <Text type="secondary">
                        Status: {getStatusTag(project.status)}
                      </Text>
                      <Button
                        type="primary"
                        onClick={() => fetchBackers(project["project-id"])}
                        style={{ marginTop: 8 }}
                      >
                        View Backers
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      )}

      {selectedProject && (
        <>
          <Divider>
            Backers for{" "}
            {projects.find((p) => p["project-id"] === selectedProject)?.title}
          </Divider>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Total Backers"
                value={totalBackers}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Total Pledged"
                value={totalPledged}
                suffix="Dollar"
                prefix={<DollarOutlined />}
              />
            </Col>
          </Row>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={() =>
              showDownloadConfirm(
                selectedProject,
                projects.find((p) => p["project-id"] === selectedProject)?.title
              )
            }
            style={{ marginBottom: 16 }}
          >
            Export Backers to Excel
          </Button>
          <Table
            loading={loadingBackers}
            columns={columns}
            dataSource={backers}
            rowKey="backer-id"
            pagination={{
              current: backerCurrentPage,
              pageSize: backerPageSize,
              onChange: (page) => setBackerCurrentPage(page),
              onShowSizeChange: (current, size) => {
                setBackerPageSize(size);
                setBackerCurrentPage(1);
              },
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} backers`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default ProjectBackersPage;

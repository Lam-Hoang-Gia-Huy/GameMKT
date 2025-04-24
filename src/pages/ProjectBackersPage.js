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
        const allProjects = res.data.data || [];
        // Sắp xếp projects: total-amount > 0 lên đầu, total-amount = 0 xuống cuối
        const sortedProjects = allProjects.sort((a, b) => {
          if (a["total-amount"] > 0 && b["total-amount"] === 0) return -1;
          if (a["total-amount"] === 0 && b["total-amount"] > 0) return 1;
          return 0; // Giữ nguyên thứ tự nếu cả hai đều > 0 hoặc đều = 0
        });
        setProjects(sortedProjects);
        setFilteredProjects(sortedProjects);
      } catch (error) {
        console.error("Error loading projects:", error);
        message.error("Failed to load projects.");
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // Handle search by project title
  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
    setProjectCurrentPage(1); // Reset to first page on search
  }, [searchTerm, projects]);

  // Fetch backers for a selected project
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
      setBackers(response.data.data || []);
      setSelectedProject(projectId);
    } catch (error) {
      console.error("Error fetching backers:", error);
      message.error("No pledges found for the specified user and project.");
      setBackers([]);
    } finally {
      setLoadingBackers(false);
    }
  };

  // Handle Excel export
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
      console.error("Error exporting backers to Excel:", error);
      message.error("Failed to export backers to Excel.");
    }
  };

  // Show confirmation modal for Excel export
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

  // Get project status tag
  const getStatusTag = (status) => {
    switch (status) {
      case "VISIBLE":
        return <Tag color="blue">Visible</Tag>;
      case "INVISIBLE":
        return <Tag color="gray">Invisible</Tag>;
      case "HALTED":
        return <Tag color="red">Halted</Tag>;
      case "DELETED":
        return <Tag color="red">Deleted</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // Calculate backer statistics
  const totalBackers = backers.length;
  const totalPledged = backers.reduce(
    (sum, backer) => sum + backer["total-amount"],
    0
  );

  // Table columns for backers
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
    <div style={{ padding: "24px 16px", maxWidth: 1200, margin: "0 auto" }}>
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
                    <Image
                      alt={project.title}
                      src={project.thumbnail}
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                      preview={false}
                      fallback={placeholder}
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
                      <Text type="secondary">
                        Total Pledged:{" "}
                        {project["total-amount"]?.toLocaleString() || 0} Dollar
                      </Text>
                      <Text type="secondary">
                        End Date:{" "}
                        {dayjs(project["end-datetime"]).format("MMM D, YYYY")}
                      </Text>
                      <Text type="secondary">
                        Status: {getStatusTag(project.status)}
                      </Text>
                      <Text type="secondary">
                        Transaction Status:{" "}
                        <Tag
                          color={
                            project["transaction-status"] === "PENDING"
                              ? "gold"
                              : project["transaction-status"] === "RECEIVING"
                              ? "green"
                              : project["transaction-status"] === "TRANSFERRED"
                              ? "blue"
                              : project["transaction-status"] === "REFUNDED"
                              ? "red"
                              : "default"
                          }
                        >
                          {project["transaction-status"] || "N/A"}
                        </Tag>
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

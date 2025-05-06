import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserProjects, deleteProject } from "../api/apiClient";
import {
  Button,
  Table,
  Modal,
  message,
  Space,
  Typography,
  Divider,
  Input,
  Select,
  DatePicker,
} from "antd";
import placeholder from "../assets/placeholder-1-1-1.png";
import RewardList from "../components/MyProjectListPage/RewardList";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ProjectOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { confirm } = Modal;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MyProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState(null);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const navigate = useNavigate();

  const fetchAllProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchUserProjects();
      const projectsData = response.data.data || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      message.error("Failed to fetch projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  // Apply filters whenever search or filter criteria change
  useEffect(() => {
    let filtered = [...projects];

    // Filter by project name
    if (searchName) {
      filtered = filtered.filter((project) =>
        project.title.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by project status
    if (projectStatusFilter) {
      filtered = filtered.filter(
        (project) => project.status === projectStatusFilter
      );
    }

    // Filter by transaction status
    if (transactionStatusFilter) {
      filtered = filtered.filter(
        (project) => project["transaction-status"] === transactionStatusFilter
      );
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((project) => {
        const endDate = moment(project["end-datetime"]);
        const startOfRange = moment(dateRange[0]).startOf("day");
        const endOfRange = moment(dateRange[1]).endOf("day");
        return (
          endDate.isValid() &&
          endDate.isSameOrAfter(startOfRange, "day") &&
          endDate.isSameOrBefore(endOfRange, "day")
        );
      });
    }

    setFilteredProjects(filtered);
  }, [
    searchName,
    projectStatusFilter,
    transactionStatusFilter,
    dateRange,
    projects,
  ]);

  const handleEdit = useCallback(
    (projectId) => {
      navigate(`/edit-project/${projectId}`);
    },
    [navigate]
  );

  const handleDelete = useCallback((projectId) => {
    confirm({
      title: "Are you sure you want to delete this project?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteProject(projectId);
          message.success("Project deleted successfully");
          setProjects((prevProjects) =>
            prevProjects.filter(
              (project) => project["project-id"] !== projectId
            )
          );
        } catch (error) {
          message.error("Failed to delete project");
          console.error(error);
        }
      },
    });
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Thumbnail",
        dataIndex: "thumbnail",
        key: "thumbnail",
        render: (thumbnail) => (
          <img
            src={
              !thumbnail || thumbnail === "Unknown" || thumbnail.trim() === ""
                ? placeholder
                : thumbnail
            }
            alt="Thumbnail"
            style={{
              width: 200,
              height: 100,
              objectFit: "cover",
              borderRadius: 5,
            }}
          />
        ),
      },
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <span
            style={{
              color: status === "VISIBLE" ? "green" : "orange",
              fontWeight: "bold",
            }}
          >
            {status}
          </span>
        ),
      },
      {
        title: "End Date",
        dataIndex: "end-datetime",
        key: "end-datetime",
        render: (date) => new Date(date).toLocaleDateString(),
      },
      {
        title: "Total Amount",
        dataIndex: "total-amount",
        key: "total-amount",
        render: (amount) => `${amount.toLocaleString()}$`,
      },
      {
        title: "Transaction Status",
        dataIndex: "transaction-status",
        key: "transaction-status",
        render: (status) => (
          <span
            style={{
              color:
                status === "PENDING"
                  ? "orange"
                  : status === "RECEIVING"
                  ? "blue"
                  : status === "REFUNDED"
                  ? "red"
                  : "black",
              fontWeight: "bold",
            }}
          >
            {status}
          </span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record["project-id"])}
            >
              Edit
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record["project-id"])}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete]
  );

  const handleExpand = (expanded, record) => {
    setExpandedRowKeys(expanded ? [record["project-id"]] : []);
  };

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ marginBottom: 0 }}>
        <ProjectOutlined /> My projects
      </Title>
      <Text type="secondary">List of my own projects</Text>
      <Divider />
      <Space
        direction="vertical"
        size="middle"
        style={{ width: "100%", marginBottom: 16 }}
      >
        <Space wrap>
          <Input
            placeholder="Search by project name"
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by project status"
            allowClear
            onChange={(value) => setProjectStatusFilter(value)}
            style={{ width: 200 }}
          >
            <Option value="VISIBLE">Visible</Option>
            <Option value="INVISIBLE">Invisible</Option>
          </Select>
          <Select
            placeholder="Filter by transaction status"
            allowClear
            onChange={(value) => setTransactionStatusFilter(value)}
            style={{ width: 300 }}
          >
            <Option value="PENDING">Pending</Option>
            <Option value="RECEIVING">Receiving</Option>
            <Option value="REFUNDED">Refunded</Option>
          </Select>
        </Space>
      </Space>
      <Table
        columns={columns}
        dataSource={filteredProjects}
        rowKey="project-id"
        loading={loading}
        expandable={{
          expandedRowRender: (record) => (
            <RewardList
              projectId={record["project-id"]}
              projectStatus={record.status}
            />
          ),
          expandedRowKeys: expandedRowKeys,
          onExpand: handleExpand,
        }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default React.memo(MyProjectList);

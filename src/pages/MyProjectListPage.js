import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchUserProjects,
  deleteProject,
  submitProject,
} from "../api/apiClient";
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
  Form,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ProjectOutlined,
  SearchOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import placeholder from "../assets/placeholder-1-1-1.png";
import RewardList from "../components/MyProjectListPage/RewardList";
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
  const [dateRange, setDateRange] = useState([null, null]);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [submittingProjectId, setSubmittingProjectId] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchAllProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchUserProjects();
      const projectsData = response.data.data || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to fetch projects"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  useEffect(() => {
    let filtered = [...projects];

    if (searchName) {
      filtered = filtered.filter((project) =>
        project.title.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (projectStatusFilter) {
      filtered = filtered.filter(
        (project) => project.status === projectStatusFilter
      );
    }

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
  }, [searchName, projectStatusFilter, dateRange, projects]);

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
          message.error(
            error.response?.data?.message || "Failed to delete project"
          );
        }
      },
    });
  }, []);

  const handleSubmit = useCallback((projectId) => {
    setSubmittingProjectId(projectId);
    setIsSubmitModalVisible(true);
  }, []);

  const handleSubmitConfirm = async (values) => {
    try {
      await submitProject(submittingProjectId, values.note);
      message.success("Project submitted successfully");
      setIsSubmitModalVisible(false);
      form.resetFields();
      fetchAllProjects(); // Refresh project list
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to submit project"
      );
    }
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
      case "HALTED":
        return (
          <Tag icon={<InfoCircleOutlined />} color="orange">
            HALTED
          </Tag>
        );
      default:
        return <Tag color="gray">{status}</Tag>;
    }
  };

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
        render: (status) => getStatusTag(status),
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
            {record.status === "CREATED" && (
              <Button
                type="default"
                icon={<SendOutlined />}
                onClick={() => handleSubmit(record["project-id"])}
              >
                Submit
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete, handleSubmit]
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
            <Option value="CREATED">Created</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="REJECTED">Rejected</Option>
            <Option value="ONGOING">Ongoing</Option>
            <Option value="SUCCESSFUL">Successful</Option>
            <Option value="TRANSFERRED">Transferred</Option>
            <Option value="INSUFFICIENT">Insufficient</Option>
            <Option value="REFUNDED">Refunded</Option>
            <Option value="DELETED">Deleted</Option>
            <Option value="SUBMITTED">Submitted</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
          />
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
      <Modal
        title="Submit Project"
        visible={isSubmitModalVisible}
        onCancel={() => {
          setIsSubmitModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmitConfirm} layout="vertical">
          <Form.Item
            name="note"
            label="Note"
            rules={[{ required: true, message: "Please input a note!" }]}
          >
            <Input placeholder="Enter a note for submission" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Confirm Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(MyProjectList);

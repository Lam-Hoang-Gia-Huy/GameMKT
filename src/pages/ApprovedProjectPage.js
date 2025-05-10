import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProjectsAdmin,
  refundAllPledges,
  staffApproveProject,
  deleteProject,
  transferPledgesToCreator,
} from "../api/apiClient";
import {
  Table,
  Input,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Input as AntInput,
  Spin,
  Select,
  Space,
} from "antd";
import {
  EyeOutlined,
  DollarOutlined,
  SwapOutlined,
  MoneyCollectOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import placeholder from "../assets/placeholder-1-1-1.png";

const { Search } = Input;
const { Title } = Typography;
const { Option } = Select;

const ApprovedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetchProjectsAdmin();
      const filteredProjects = response.data.data.filter((p) =>
        ["VISIBLE", "INVISIBLE"].includes(p.status)
      );
      setProjects(filteredProjects || []);
    } catch (error) {
      console.error("Error fetching projects", error);
      message.error("Error fetching projects");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (projectId) => {
    try {
      setLoading(true);
      const response = await refundAllPledges(projectId);
      if (response.data.success) {
        message.success("All pledges refunded successfully");
        fetchProjects();
      } else {
        message.error("Failed to refund pledges");
      }
    } catch (error) {
      console.error("Error refunding pledges", error);
      message.error("Error refunding pledges");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (projectId, currentStatus) => {
    if (!reason.trim()) {
      message.error("Please provide a reason for status change");
      return;
    }
    const newStatus = currentStatus === "VISIBLE" ? "INVISIBLE" : "VISIBLE";
    try {
      setLoading(true);
      await staffApproveProject({
        projectId,
        status: newStatus,
        reason: reason.trim(),
      });
      message.success(`Project status changed to ${newStatus}`);
      setReason("");
      fetchProjects();
    } catch (error) {
      console.error("Error toggling project status", error);
      message.error("Error toggling project status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      setLoading(true);
      await deleteProject(projectId);
      message.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project", error);
      message.error("Error deleting project");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (projectId) => {
    try {
      setLoading(true);
      const response = await transferPledgesToCreator(projectId);
      if (response.success) {
        message.success("Pledges transferred successfully");
        fetchProjects();
      } else {
        message.error("Failed to transfer pledges");
      }
    } catch (error) {
      console.error("Error transferring pledges", error);
      message.error("Error transferring pledges");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusColors = {
      VISIBLE: "blue",
      INVISIBLE: "orange",
    };
    return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
  };

  const getTransactionStatusTag = (status) => {
    const transactionStatusColors = {
      RECEIVING: "green",
      PENDING: "yellow",
      REFUNDED: "red",
    };
    return (
      <Tag color={transactionStatusColors[status] || "default"}>{status}</Tag>
    );
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.creator.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesTransactionStatus =
      transactionStatusFilter === "All" ||
      p["transaction-status"] === transactionStatusFilter;
    return matchesSearch && matchesStatus && matchesTransactionStatus;
  });

  const columns = [
    {
      title: "Image",
      dataIndex: "thumbnail",
      render: (thumbnail) => (
        <img
          src={
            !thumbnail || thumbnail === "Unknown" || thumbnail.trim() === ""
              ? placeholder
              : thumbnail
          }
          alt="Thumbnail"
          className="w-32 h-20 rounded-lg shadow-md object-cover"
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Creator",
      dataIndex: "creator",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Transaction Status",
      dataIndex: "transaction-status",
      render: (status) => getTransactionStatusTag(status),
    },
    {
      title: "Start Date",
      dataIndex: "start-datetime",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "End Date",
      dataIndex: "end-datetime",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Current Amount",
      dataIndex: "total-amount",
      render: (amount) => `${amount.toLocaleString()}$`,
    },
    {
      title: "Required Amount",
      dataIndex: "minimum-amount",
      render: (amount) => `${amount.toLocaleString()}$`,
    },
    {
      title: "Action",
      render: (record) => (
        <div className="flex items-center space-x-4">
          <Tooltip title="View Details">
            <EyeOutlined
              className="text-blue-500 cursor-pointer text-lg hover:text-blue-700 transition-colors"
              onClick={() => navigate(`/staff/project/${record["project-id"]}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to refund all pledges for this project?"
            onConfirm={() => handleRefund(record["project-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Refund Pledges">
              <DollarOutlined className="text-red-500 cursor-pointer text-lg hover:text-red-700 transition-colors" />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title={
              <div>
                <p>{`Change status to ${
                  record.status === "VISIBLE" ? "INVISIBLE" : "VISIBLE"
                }?`}</p>
                <AntInput
                  placeholder="Enter reason for status change"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            }
            onConfirm={() =>
              handleToggleStatus(record["project-id"], record.status)
            }
            okText="Yes"
            cancelText="No"
            onCancel={() => setReason("")}
          >
            <Tooltip title="Toggle Status">
              <SwapOutlined className="text-gray-500 cursor-pointer text-lg hover:text-gray-700 transition-colors" />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Are you sure to transfer pledges to creator?"
            onConfirm={() => handleTransfer(record["project-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Transfer Pledges">
              <MoneyCollectOutlined className="text-green-500 cursor-pointer text-lg hover:text-green-700 transition-colors" />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Are you sure to delete this project?"
            onConfirm={() => handleDelete(record["project-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Project">
              <DeleteOutlined className="text-red-500 cursor-pointer text-lg hover:text-red-700 transition-colors" />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <Title level={3} className="mb-4 text-gray-700">
        Approved Projects
      </Title>
      <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
        <div className="flex items-center space-x-4">
          <Search
            placeholder="Search by project title or creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterButton
            className="w-1/3"
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 150 }}
          >
            <Option value="All">All Statuses</Option>
            <Option value="VISIBLE">Visible</Option>
            <Option value="INVISIBLE">Invisible</Option>
          </Select>
          <Select
            value={transactionStatusFilter}
            onChange={(value) => setTransactionStatusFilter(value)}
            style={{ width: 200 }}
          >
            <Option value="All">All Transaction Statuses</Option>
            <Option value="RECEIVING">Receiving</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="REFUNDED">Refunded</Option>
          </Select>
        </div>
      </Space>
      <Table
        columns={columns}
        dataSource={filteredProjects}
        rowKey={(record) => record["project-id"]}
        className="border rounded-lg shadow-sm"
        loading={loading}
      />
    </div>
  );
};

export default ApprovedProjects;

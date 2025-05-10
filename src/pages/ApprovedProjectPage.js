import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProjectsAdmin,
  refundAllPledges,
  staffApproveProject,
  deleteProject,
} from "../api/apiClient";
import {
  Table,
  Input,
  Typography,
  Tag,
  Button,
  Popconfirm,
  message,
  Input as AntInput,
} from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import placeholder from "../assets/placeholder-1-1-1.png";

const { Search } = Input;
const { Title } = Typography;

const ApprovedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetchProjectsAdmin();
      const filteredProjects = response.data.data.filter((p) =>
        ["VISIBLE", "INVISIBLE"].includes(p.status)
      );
      setProjects(filteredProjects || []);
    } catch (error) {
      console.error("Error fetching projects", error);
      message.error("Error fetching projects");
    }
  };

  const handleRefund = async (projectId) => {
    try {
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
    }
  };

  const handleToggleStatus = async (projectId, currentStatus) => {
    if (!reason.trim()) {
      message.error("Please provide a reason for status change");
      return;
    }
    const newStatus = currentStatus === "VISIBLE" ? "INVISIBLE" : "VISIBLE";
    try {
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
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await deleteProject(projectId);
      message.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project", error);
      message.error("Error deleting project");
    }
  };

  const handleTransfer = async (projectId) => {
    try {
      const response = await fetch(
        `/api/PaypalPayment/TransferPledgeToCreator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              JSON.parse(localStorage.getItem("auth"))?.token
            }`,
          },
          body: JSON.stringify({ projectId }),
        }
      );
      if (response.ok) {
        message.success("Pledges transferred successfully");
        fetchProjects();
      } else {
        message.error("Failed to transfer pledges");
      }
    } catch (error) {
      console.error("Error transferring pledges", error);
      message.error("Error transferring pledges");
    }
  };

  const getStatusTag = (status) => {
    const statusColors = {
      VISIBLE: "blue",
      INVISIBLE: "orange",
    };
    return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

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
      title: "Status",
      dataIndex: "status",
      render: (status) => getStatusTag(status),
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
      title: "Current amount",
      dataIndex: "total-amount",
      render: (amount) => `${amount.toLocaleString()}$`,
    },
    {
      title: "Min Amount",
      dataIndex: "minimum-amount",
      render: (amount) => `${amount.toLocaleString()}$`,
    },
    {
      title: "Action",
      render: (record) => (
        <div className="flex items-center space-x-4">
          <EyeOutlined
            className="text-blue-500 cursor-pointer text-lg"
            onClick={() => navigate(`/staff/project/${record["project-id"]}`)}
          />
          <Popconfirm
            title="Are you sure to refund all pledges for this project?"
            onConfirm={() => handleRefund(record["project-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger size="small">
              Refund
            </Button>
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
            <Button type="default" size="small">
              Toggle Status
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Are you sure to transfer pledges to creator?"
            onConfirm={() => handleTransfer(record["project-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Button type="default" size="small">
              Transfer
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Are you sure to delete this project?"
            onConfirm={() => handleDelete(record["project-id"])}
            okText="Yes"
            cancelText="No"
          >
            <Button type="default" danger size="small">
              <DeleteOutlined />
            </Button>
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
      <div className="mb-4">
        <Search
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          enterButton
          className="w-1/2"
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredProjects}
        rowKey={(record) => record["project-id"]}
        className="border rounded-lg shadow-sm"
      />
    </div>
  );
};

export default ApprovedProjects;

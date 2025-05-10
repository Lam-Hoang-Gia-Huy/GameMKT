import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllReports, fetchReportById } from "../api/apiClient";
import { Table, Input, Typography, Button, message, Modal } from "antd";
import { EyeOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Title, Text } = Typography;

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetchAllReports();
      const sortedReports = (response.data.data || []).sort(
        (a, b) =>
          new Date(b["create-datetime"]) - new Date(a["create-datetime"])
      );
      setReports(sortedReports);
    } catch (error) {
      console.error("Error fetching reports", error);
      message.error("Error fetching reports");
    }
  };

  const handleViewDetails = async (reportId) => {
    try {
      const response = await fetchReportById(reportId);
      setSelectedReport(response.data.data);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching report details", error);
      message.error("Error fetching report details");
    }
  };

  const filteredReports = reports.filter((report) =>
    report.detail.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Report ID",
      dataIndex: "report-id",
    },
    {
      title: "User ID",
      dataIndex: "user-id",
    },
    {
      title: "Detail",
      dataIndex: "detail",
    },
    {
      title: "Created Date",
      dataIndex: "create-datetime",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Action",
      render: (record) => (
        <div className="flex items-center space-x-4">
          <EyeOutlined
            className="text-blue-500 cursor-pointer text-lg"
            onClick={() => handleViewDetails(record["report-id"])}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <Title level={3} className="mb-4 text-gray-700">
        Reports
      </Title>
      <div className="mb-4">
        <Search
          placeholder="Search report details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          enterButton
          className="w-1/2"
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredReports}
        rowKey={(record) => record["report-id"]}
        className="border rounded-lg shadow-sm"
      />
      <Modal
        title="Report Details"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedReport(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsModalVisible(false);
              setSelectedReport(null);
            }}
          >
            Close
          </Button>,
        ]}
      >
        {selectedReport && (
          <div>
            <p>
              <Text strong>Report ID:</Text> {selectedReport["report-id"]}
            </p>
            <p>
              <Text strong>User Name:</Text>{" "}
              {selectedReport["user-name"] || "N/A"}
            </p>
            <p>
              <Text strong>Detail:</Text> {selectedReport.detail}
            </p>
            <p>
              <Text strong>Created Date:</Text>{" "}
              {new Date(selectedReport["create-datetime"]).toLocaleString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;

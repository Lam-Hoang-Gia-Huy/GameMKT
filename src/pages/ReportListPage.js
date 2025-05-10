import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Spin, Alert, Card, Row, Col } from "antd";
import { fetchReportsByUserId } from "../api/apiClient";
import useAuth from "../components/Hooks/useAuth";
import moment from "moment";

const ReportList = () => {
  const { auth } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchReportsByUserId();

      if (response.data.success) {
        setReports(response.data.data || []);
      } else {
        if (response.data.message === "No reports found for this user.") {
          setReports([]);
        } else {
          setError(response.data.message || "Failed to fetch reports.");
        }
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      if (
        err.response?.status === 400 &&
        err.response?.data?.message === "No reports found for this user."
      ) {
        setReports([]);
      } else {
        setError("An error occurred while fetching reports. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const showReportDetail = (report) => {
    setSelectedReport(report);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedReport(null);
  };

  const columns = [
    {
      title: "Report ID",
      dataIndex: "report-id",
      key: "report-id",
    },
    {
      title: "User Name",
      dataIndex: "user-name",
      key: "user-name",
    },
    {
      title: "Created Date",
      dataIndex: "create-datetime",
      key: "create-datetime",
      render: (date) => moment(date).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => showReportDetail(record)}>
          View Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "50px 0",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row justify="center" style={{ padding: "50px 0" }}>
      <Col xs={24} sm={20} md={18} lg={16}>
        <Card title="My Reports" bordered>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="report-id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No reports found" }}
          />
        </Card>

        <Modal
          title="Report Details"
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              Close
            </Button>,
          ]}
        >
          {selectedReport && (
            <div>
              <p>
                <strong>Report ID:</strong> {selectedReport["report-id"]}
              </p>
              <p>
                <strong>User Name:</strong> {selectedReport["user-name"]}
              </p>
              <p>
                <strong>Created Date:</strong>{" "}
                {moment(selectedReport["create-datetime"]).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </p>
              <p>
                <strong>Detail:</strong> {selectedReport.detail}
              </p>
            </div>
          )}
        </Modal>
      </Col>
    </Row>
  );
};

export default ReportList;

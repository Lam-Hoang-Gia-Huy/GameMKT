import React, { useEffect, useState } from "react";
import { fetchAllUsers, fetchCreatorInfo } from "../api/apiClient";
import {
  Table,
  Input,
  Typography,
  Button,
  message,
  Modal,
  Card,
  Avatar,
  Space,
  Divider,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CalendarOutlined,
  IdcardOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Search } = Input;
const { Title, Text } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetchAllUsers();
      const sortedUsers = (response.data.data || []).sort(
        (a, b) =>
          new Date(b["created-datetime"]) - new Date(a["created-datetime"])
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users", error);
      message.error("Error fetching users");
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await fetchCreatorInfo(userId);
      setSelectedUser(response.data.data);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching user details", error);
      message.error("Error fetching user details");
    }
  };

  const filteredUsers = users.filter((user) =>
    user["full-name"].toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "User ID",
      dataIndex: "user-id",
    },
    {
      title: "Full Name",
      dataIndex: "full-name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone) => phone || "N/A",
    },
    {
      title: "Role",
      dataIndex: "role",
    },
    {
      title: "Created Date",
      dataIndex: "created-datetime",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Action",
      render: (record) => (
        <div className="flex items-center space-x-4">
          <EyeOutlined
            className="text-blue-500 cursor-pointer text-lg"
            onClick={() => handleViewDetails(record["user-id"])}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <Title level={3} className="mb-4 text-gray-700">
        User Management
      </Title>
      <div className="mb-4">
        <Search
          placeholder="Search users by full name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          enterButton
          className="w-1/3"
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey={(record) => record["user-id"]}
        className="border rounded-lg shadow-sm"
      />
      <Modal
        title={
          <div className="flex items-center space-x-3">
            <Avatar
              size={40}
              src={selectedUser?.avatar}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#1890ff" }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {selectedUser ? selectedUser["full-name"] : "User Details"}
            </Title>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedUser(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsModalVisible(false);
              setSelectedUser(null);
            }}
            style={{ borderRadius: 6 }}
          >
            Close
          </Button>,
        ]}
        width={600}
        bodyStyle={{ padding: "24px", background: "#f9f9f9" }}
      >
        {selectedUser ? (
          <Card
            style={{
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              background: "#fff",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div className="flex items-center space-x-3">
                <IdcardOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">User ID</Text>
                  <br />
                  <Text strong>{selectedUser["user-id"]}</Text>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <div className="flex items-center space-x-3">
                <UserOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">Full Name</Text>
                  <br />
                  <Text strong>{selectedUser["full-name"]}</Text>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <div className="flex items-center space-x-3">
                <MailOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">Email</Text>
                  <br />
                  <Text strong>{selectedUser.email}</Text>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <div className="flex items-center space-x-3">
                <PhoneOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">Phone</Text>
                  <br />
                  <Text strong>{selectedUser.phone || "N/A"}</Text>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <div className="flex items-center space-x-3">
                <TeamOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">Role</Text>
                  <br />
                  <Text strong>{selectedUser.role}</Text>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <div className="flex items-center space-x-3">
                <FileTextOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">Bio</Text>
                  <br />
                  <Text strong>{selectedUser.bio || "N/A"}</Text>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <div className="flex items-center space-x-3">
                <CalendarOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                <div>
                  <Text type="secondary">Created Date</Text>
                  <br />
                  <Text strong>
                    {new Date(
                      selectedUser["created-datetime"]
                    ).toLocaleString()}
                  </Text>
                </div>
              </div>

              {selectedUser.avatar && (
                <>
                  <Divider style={{ margin: "10px 0" }} />
                  <div className="flex items-center space-x-3">
                    <div>
                      <Text type="secondary">Avatar</Text>
                      <br />
                      <Avatar
                        src={selectedUser.avatar}
                        size={100}
                        icon={<UserOutlined />}
                        style={{
                          marginTop: 8,
                          border: "2px solid #1890ff",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </Space>
          </Card>
        ) : (
          <Text type="secondary">No user data available.</Text>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;

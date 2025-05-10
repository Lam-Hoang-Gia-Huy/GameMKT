import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Row,
  Col,
  Tabs,
  Card,
  Button,
  Space,
  Divider,
  Avatar,
  Tag,
  Spin,
  Modal,
  message,
  Progress,
  List,
  Input,
  Result,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  BulbOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import TipTapViewer from "../components/TipTapViewer";
import ProjectComments from "../components/ProjectDetailPage/ProjectComments";
import ProjectUpdates from "../components/ProjectDetailPage/ProjectUpdates";
import ProjectFaqs from "../components/ProjectDetailPage/ProjectFaqs";
import placeholder from "../assets/placeholder-1-1-1.png";
import {
  fetchProject,
  fetchRewardsByProjectId,
  fetchCreatorInfo,
  staffApproveProject,
  deleteReward,
} from "../api/apiClient";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const StaffProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [creator, setCreator] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetchProject(id);
        if (response.data.success) {
          setProject(response.data.data);
          if (response.data.data["creator-id"]) {
            const creatorResponse = await fetchCreatorInfo(
              response.data.data["creator-id"]
            );
            if (creatorResponse.data.success) {
              setCreator(creatorResponse.data.data);
            }
          }
          const rewardsResponse = await fetchRewardsByProjectId(
            response.data.data["project-id"] || id
          );
          if (rewardsResponse.data.success) {
            setRewards(rewardsResponse.data.data || []);
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const canApproveOrReject = () => {
    if (!project) return false;
    return ["VISIBLE", "INVISIBLE"].includes(project.status);
  };

  const handleToggleStatus = async (currentStatus) => {
    if (!reason.trim() && currentStatus !== "VISIBLE") {
      message.error("Please provide a reason for status change");
      return;
    }
    const newStatus = currentStatus === "VISIBLE" ? "INVISIBLE" : "VISIBLE";
    try {
      await staffApproveProject({
        projectId: project["project-id"],
        status: newStatus,
        reason: reason.trim() || "",
      });
      message.success(`Project status changed to ${newStatus}`);
      setReason("");
      setProject((prev) => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Error toggling project status", error);
      message.error("Error toggling project status");
    }
  };

  const getStatusTag = () => {
    if (!project) return null;

    const status = project.status || "PENDING";
    const color = {
      VISIBLE: "green",
      HALTED: "red",
      DELETED: "orange",
      INVISIBLE: "gray",
    }[status];

    return (
      <Tag color={color} style={{ marginLeft: 8 }}>
        {status}
      </Tag>
    );
  };

  const getTimeStatus = () => {
    if (!project) return { text: "", days: 0 };

    const now = new Date();
    const startDate = new Date(project["start-datetime"]);
    const endDate = new Date(project["end-datetime"]);

    if (now < startDate) {
      const days = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      return { text: `Starts in ${days} days`, days, status: "upcoming" };
    } else if (now >= startDate && now <= endDate) {
      const days = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return { text: `${days} days to go`, days, status: "VISIBLE" };
    } else {
      return { text: "Funding ended", days: 0, status: "ended" };
    }
  };

  const timeStatus = getTimeStatus();

  const items = [
    {
      key: "1",
      label: (
        <span>
          <BulbOutlined /> About
        </span>
      ),
      children: (
        <>
          {project?.story ? (
            <TipTapViewer content={project.story} />
          ) : (
            <Paragraph type="secondary">No story available.</Paragraph>
          )}
          <Divider />
          <Title level={4}>Project Description</Title>
          <Paragraph>
            {project?.description || "No description available."}
          </Paragraph>

          {creator && (
            <>
              <Divider />
              <Title level={4}>About the Creator</Title>
              <Card>
                <Row gutter={16} align="middle">
                  <Col>
                    <Avatar
                      size={64}
                      src={creator.avatar}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Title level={5} style={{ marginBottom: 4 }}>
                      {creator["full-name"]}
                    </Title>
                    <Text
                      type="secondary"
                      style={{ display: "block", marginBottom: 8 }}
                    >
                      Joined:{" "}
                      {new Date(
                        creator["created-datetime"]
                      ).toLocaleDateString()}
                    </Text>
                    {creator.bio && (
                      <Paragraph style={{ marginBottom: 0 }}>
                        {creator.bio}
                      </Paragraph>
                    )}
                  </Col>
                </Row>
              </Card>
            </>
          )}
        </>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <MessageOutlined /> Updates
        </span>
      ),
      children: <ProjectUpdates projectId={project?.["project-id"] || id} />,
    },
    {
      key: "3",
      label: (
        <span>
          <QuestionCircleOutlined /> FAQs
        </span>
      ),
      children: <ProjectFaqs projectId={project?.["project-id"] || id} />,
    },
    {
      key: "4",
      label: (
        <span>
          <MessageOutlined /> Comments
        </span>
      ),
      children: <ProjectComments projectId={project?.["project-id"] || id} />,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <Result
          status="404"
          title="Project Not Found"
          subTitle="The project you're looking for doesn't exist."
          extra={
            <Button type="primary" onClick={() => navigate("/staff/projects")}>
              Back to Projects
            </Button>
          }
        />
      </Card>
    );
  }

  const handleDeleteReward = async (rewardId) => {
    try {
      const response = await deleteReward(rewardId);
      if (response.data.success) {
        message.success("Reward deleted successfully");
        const rewardsResponse = await fetchRewardsByProjectId(
          project["project-id"]
        );
        setRewards(rewardsResponse.data.data || []);
      } else {
        message.error("Failed to delete reward");
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
      message.error("Error deleting reward");
    }
  };

  return (
    <Content style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <Title level={3} style={{ marginBottom: 0 }}>
                  {project.title}
                </Title>
                {getStatusTag()}
              </Space>
            }
            cover={
              <img
                src={
                  !project.thumbnail || project.thumbnail === "unknown"
                    ? placeholder
                    : project.thumbnail
                }
                alt="Project Thumbnail"
                style={{
                  width: "100%",
                  padding: "10px",
                  height: 400,
                  objectFit: "cover",
                  borderRadius: "15px",
                }}
              />
            }
            style={{ marginBottom: 24 }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>{project.description}</Paragraph>

              <Space split={<Divider type="vertical" />}>
                <Text>
                  <ClockCircleOutlined /> {timeStatus.text}
                </Text>
                <Text>
                  <UserOutlined /> {project.backers || 0} backers
                </Text>
                <Text>
                  Start at:{" "}
                  {new Date(project["start-datetime"]).toLocaleDateString()}
                </Text>
                <Text>
                  End at:{" "}
                  {new Date(project["end-datetime"]).toLocaleDateString()}
                </Text>
              </Space>
              {project?.categories?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {project.categories.map((category) => (
                    <Tag
                      key={category["category-id"]}
                      color="blue"
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      {category.name}
                    </Tag>
                  ))}
                </div>
              )}
              {project?.platforms?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {project.platforms.map((platform) => (
                    <Tag
                      key={platform["platform-id"]}
                      color="purple"
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      {platform.name}
                    </Tag>
                  ))}
                </div>
              )}
            </Space>
          </Card>

          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {canApproveOrReject() && (
              <Card title="Project Approval">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Popconfirm
                    title={
                      <div>
                        <p>{`Change status to ${
                          project.status === "VISIBLE" ? "INVISIBLE" : "VISIBLE"
                        }?`}</p>
                        <Input
                          placeholder="Enter reason for status change (required for INVISIBLE)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    }
                    onConfirm={() => handleToggleStatus(project.status)}
                    okText="Yes"
                    cancelText="No"
                    onCancel={() => setReason("")}
                  >
                    <Button
                      type={project.status === "VISIBLE" ? "danger" : "primary"}
                      icon={
                        project.status === "VISIBLE" ? (
                          <CloseCircleOutlined />
                        ) : (
                          <CheckCircleOutlined />
                        )
                      }
                      block
                    >
                      {project.status === "VISIBLE"
                        ? "Make Invisible"
                        : "Make Visible"}
                    </Button>
                  </Popconfirm>
                </Space>
              </Card>
            )}

            <Card title="Funding Progress">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong>
                      <DollarOutlined />{" "}
                      {project["total-amount"]?.toLocaleString() || 0}$
                    </Text>
                  </Col>
                  <Col>
                    <Text type="secondary">
                      of {project["minimum-amount"]?.toLocaleString() || 0}$
                      goal
                    </Text>
                  </Col>
                </Row>

                <Progress
                  percent={Math.min(
                    (project["total-amount"] / project["minimum-amount"]) *
                      100 || 0,
                    100
                  )}
                  status="active"
                  strokeColor="#52c41a"
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: "center" }}>
                      <Text strong>
                        <TeamOutlined /> Backers
                      </Text>
                      <Title level={3} style={{ margin: "8px 0" }}>
                        {project.backers || 0}
                      </Title>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: "center" }}>
                      <Text strong>
                        <CalendarOutlined /> Days Left
                      </Text>
                      <Title
                        level={3}
                        style={{
                          margin: "8px 0",
                          color: timeStatus.days <= 3 ? "#f5222d" : "inherit",
                        }}
                      >
                        {timeStatus.days}
                      </Title>
                    </div>
                  </Col>
                </Row>
              </Space>
            </Card>

            <Card
              title={`Rewards (${rewards.length})`}
              bodyStyle={{ padding: rewards.length ? "16px" : 0 }}
              extra={
                <Button
                  type="link"
                  onClick={() => {
                    setRewards([]);
                    fetchRewardsByProjectId(project["project-id"]).then(
                      (response) => {
                        if (response.data.success) {
                          setRewards(response.data.data || []);
                        }
                      }
                    );
                  }}
                >
                  Refresh
                </Button>
              }
            >
              {rewards.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={rewards}
                  renderItem={(reward) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          title="Are you sure to delete this reward?"
                          onConfirm={() =>
                            handleDeleteReward(reward["reward-id"])
                          }
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button type="link" danger icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <Card
                        size="small"
                        style={{
                          borderLeft: "3px solid #1890ff",
                          width: "100%",
                        }}
                      >
                        <Title level={5} style={{ marginBottom: 8 }}>
                          ${reward.amount.toLocaleString()} or more
                        </Title>
                        <Paragraph style={{ marginBottom: 0 }}>
                          {reward.details || "No description provided"}
                        </Paragraph>
                        <Text
                          type="secondary"
                          style={{ display: "block", marginTop: 8 }}
                        >
                          Created:{" "}
                          {new Date(
                            reward["created-datetime"]
                          ).toLocaleDateString()}
                        </Text>
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 16px",
                    background: "#fafafa",
                  }}
                >
                  <Paragraph type="secondary">
                    No rewards available for this project
                  </Paragraph>
                </div>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </Content>
  );
};

export default StaffProjectDetailPage;

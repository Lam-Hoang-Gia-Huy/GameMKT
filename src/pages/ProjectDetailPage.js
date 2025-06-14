import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Row,
  Col,
  Tabs,
  Button,
  Card,
  Space,
  Divider,
  Avatar,
  Result,
  Spin,
  Tag,
} from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  BulbOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import TipTapViewer from "../components/TipTapViewer";
import placeholder from "../assets/placeholder-1-1-1.png";
import ProjectSidebar from "../components/ProjectDetailPage/ProjectSidebar";
import ProjectComments from "../components/ProjectDetailPage/ProjectComments";
import ProjectUpdates from "../components/ProjectDetailPage/ProjectUpdates";
import ProjectFaqs from "../components/ProjectDetailPage/ProjectFaqs";
import {
  fetchProject,
  fetchRewardsByProjectId,
  fetchCreatorInfo,
} from "../api/apiClient";
import useAuth from "../components/Hooks/useAuth";
import moment from "moment";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1");
  const [project, setProject] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [creator, setCreator] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetchProject(id);
        if (response.data.success) {
          setProject(response.data.data);
          if (response.data.data["creator-id"]) {
            try {
              const creatorResponse = await fetchCreatorInfo(
                response.data.data["creator-id"]
              );
              if (creatorResponse.data.success) {
                setCreator(creatorResponse.data.data);
                if (auth?.id && auth.id === response.data.data["creator-id"]) {
                  setIsCreator(true);
                }
              }
            } catch (error) {
              console.error("Error fetching creator info:", error);
            }
          }

          const rewardsResponse = await fetchRewardsByProjectId(
            response.data.data["project-id"] || id
          );
          if (rewardsResponse.data.success) {
            setRewards(rewardsResponse.data.data || []);
          }
        } else {
          console.error("Error fetching project:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id, auth?.id]);

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

  const getTimeStatus = () => {
    if (!project) return { text: "", days: 0 };

    const now = new Date();
    const startDate = new Date(project["start-datetime"]);
    const endDate = new Date(project["end-datetime"]);

    if (now < startDate) {
      const days = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      return { text: `Starts in ${days} days`, status: "upcoming" };
    } else if (now >= startDate && now <= endDate) {
      const days = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return { text: `${days} days to go`, status: "ongoing" };
    } else {
      return { text: "Funding ended", status: "ended" };
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
        <div className="project-about">
          <Title level={4}>Project Story</Title>
          <TipTapViewer content={project?.story} />

          {(creator || project?.creator) && (
            <>
              <Divider />
              <Title level={4}>About the Creator</Title>
              <Card
                bordered={false}
                style={{ background: "#f9f9f9", cursor: "pointer" }}
                onClick={() =>
                  navigate(
                    `/creator/${
                      creator?.["user-id"] || project?.["creator-id"]
                    }`,
                    {
                      state: { from: `/project/${id}` },
                    }
                  )
                }
              >
                <Row gutter={16} align="middle">
                  <Col>
                    <Avatar
                      size={64}
                      src={creator?.avatar}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Title level={5} style={{ marginBottom: 0 }}>
                      {creator?.["full-name"] || project?.creator}
                    </Title>
                    {creator?.bio && (
                      <Paragraph
                        style={{ marginTop: 8, marginBottom: 0 }}
                        ellipsis={{ rows: 2 }}
                      >
                        {creator.bio}
                      </Paragraph>
                    )}
                    <Text
                      type="secondary"
                      style={{ display: "block", marginTop: 8 }}
                    >
                      View full profile →
                    </Text>
                  </Col>
                </Row>
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <MessageOutlined /> Updates
        </span>
      ),
      children: (
        <ProjectUpdates
          projectId={project?.["project-id"]}
          isCreator={isCreator}
        />
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <QuestionCircleOutlined /> FAQs
        </span>
      ),
      children: <ProjectFaqs isCreator={isCreator} />,
    },
    {
      key: "4",
      label: (
        <span>
          <MessageOutlined /> Comments
        </span>
      ),
      children: (
        <ProjectComments
          projectId={project?.["project-id"] || id}
          isCreator={isCreator}
        />
      ),
    },
  ];

  return (
    <Content style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "50px 0",
          }}
        >
          <Spin size="large" />
        </div>
      ) : !project ? (
        <Card>
          <Result
            status="404"
            title="Project Not Found"
            subTitle="Sorry, the project you're looking for doesn't exist."
            extra={
              <Button type="primary" href="/">
                Browse Projects
              </Button>
            }
          />
        </Card>
      ) : project.status === "DELETED" ? (
        <Card>
          <Result
            status="warning"
            title="Project Not Visible"
            subTitle="This project is currently not visible to the public."
            extra={
              <Button type="primary" href="/">
                Browse Projects
              </Button>
            }
          />
        </Card>
      ) : (
        <Row gutter={[24, 24]} align="top">
          <Col xs={24} lg={16}>
            <Card
              cover={
                <img
                  src={
                    !project.thumbnail || project.thumbnail === "unknown"
                      ? placeholder
                      : project.thumbnail
                  }
                  alt={project.title}
                  style={{
                    width: "100%",
                    height: 400,
                    objectFit: "cover",
                    border: "black solid 0.5px",
                  }}
                />
              }
              style={{ marginBottom: 24, border: "black solid 0.5px" }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div>
                  <Title level={2} style={{ marginTop: 8, marginBottom: 4 }}>
                    {project.title}
                  </Title>
                  <Text>{getStatusTag(project.status)} </Text>
                  <Title level={5}>Description</Title>

                  <Paragraph style={{ fontSize: 16 }}>
                    {project.description}
                  </Paragraph>
                  {project.categories?.length > 0 && (
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
                  {project.platforms?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {project.platforms.map((platform) => (
                        <Tag
                          key={platform["platform-id"]}
                          color="cyan"
                          style={{ marginRight: 8, marginBottom: 8 }}
                        >
                          {platform.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
                <Space split={<Divider type="vertical" />}>
                  {(creator || project?.creator) && (
                    <Space>
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        src={creator?.avatar}
                      />
                      <Text strong>
                        {creator?.["full-name"] || project?.creator}
                      </Text>
                    </Space>
                  )}
                  <Text>
                    <ClockCircleOutlined /> {timeStatus.text}
                  </Text>
                  <Text>
                    <UserOutlined /> {project?.backers} backers
                  </Text>
                  {project["start-datetime"] && (
                    <Text>
                      <CalendarOutlined /> Start:{" "}
                      {moment(project["start-datetime"]).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </Text>
                  )}
                  {project["end-datetime"] && (
                    <Text>
                      <CalendarOutlined /> End:{" "}
                      {moment(project["end-datetime"]).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </Text>
                  )}
                </Space>
              </Space>
            </Card>
            <Card style={{ border: "black solid 0.5px" }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={items}
                size="large"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <ProjectSidebar
              project={{
                ...project,
                currentAmount: project?.["total-amount"] ?? 0,
                goalAmount: project?.["minimum-amount"] ?? 0,
                endDate: project?.["end-datetime"],
                timeStatus: timeStatus.status,
              }}
              rewards={rewards}
            />
          </Col>
        </Row>
      )}
    </Content>
  );
};

export default ProjectDetailPage;

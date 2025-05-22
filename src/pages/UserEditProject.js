import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchProject,
  updateProject,
  updateThumbnail,
  updateStory,
  checkProjectPermissions,
} from "../api/apiClient";
import {
  Button,
  Form,
  Input,
  DatePicker,
  Upload,
  message,
  Spin,
  Select,
  Image,
  Tag,
  Card,
  Divider,
  Row,
  Col,
  Space,
  Result,
} from "antd";
import { UploadOutlined, SaveOutlined } from "@ant-design/icons";
import TipTapEditor from "../components/TipTapEditor";
import CategorySelector from "../components/MyProjectListPage/CategorySelector";
import PlatformSelector from "../components/MyProjectListPage/PlatformSelector";
import moment from "moment";
import placeholder from "../assets/placeholder-1-1-1.png";

const { TextArea } = Input;
const { Option } = Select;

const UserEditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const [story, setStory] = useState("");
  const [projectPlatforms, setProjectPlatforms] = useState([]);
  const [projectCategories, setProjectCategories] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [currentThumbnail, setCurrentThumbnail] = useState(null);
  const [storyLoaded, setStoryLoaded] = useState(false);
  const [updatingBasic, setUpdatingBasic] = useState(false);
  const [updatingThumbnail, setUpdatingThumbnail] = useState(false);
  const [updatingStory, setUpdatingStory] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");
  // Trạng thái để theo dõi field nào được bật
  const [enabledFields, setEnabledFields] = useState({
    title: false,
    description: false,
    minimumAmount: false,
    startDatetime: false,
    endDatetime: false,
  });

  // Function to check user permissions
  const checkPermissions = async () => {
    try {
      await checkProjectPermissions(projectId);
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "You do not have permission to edit this project.";
      setPermissionError(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetchProject(projectId);
        const project = response.data.data;
        form.setFieldsValue({
          title: project.title,
          description: project.description,
          startDatetime: project["start-datetime"]
            ? moment(project["start-datetime"])
            : null,
          endDatetime: project["end-datetime"]
            ? moment(project["end-datetime"])
            : null,
          minimumAmount: project["minimum-amount"],
        });
        setProjectPlatforms(project.platforms || []);
        setProjectCategories(project.categories || []);
        setStory(project.story || "");
        setStoryLoaded(true);
        setCurrentThumbnail(
          project.thumbnail && project.thumbnail !== "unknown"
            ? project.thumbnail
            : null
        );
        setProjectStatus(project.status || "");
        // Khởi tạo trạng thái disable dựa trên projectStatus
        setEnabledFields({
          title: false,
          description: false,
          minimumAmount: false,
          startDatetime: false,
          endDatetime: false,
        });
      } catch (error) {
        message.error(
          error.response?.data?.message || "Failed to fetch project details"
        );
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [projectId, form]);

  const handleUpdateThumbnail = async () => {
    if (!thumbnail) {
      message.warning("Please select a new thumbnail first");
      return;
    }

    try {
      setUpdatingThumbnail(true);
      await updateThumbnail(projectId, thumbnail);
      setCurrentThumbnail(URL.createObjectURL(thumbnail));
      message.success("Thumbnail updated successfully");
      setThumbnail(null);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to update thumbnail"
      );
      console.error(error);
    } finally {
      setUpdatingThumbnail(false);
    }
  };

  const handleUpdateStory = async (showMessage = true) => {
    if (!story || story === "No story found.") {
      if (showMessage) {
        message.warning("Story content cannot be empty");
      }
      return;
    }

    try {
      setUpdatingStory(true);
      await updateStory(projectId, story);
      if (showMessage) {
        message.success("Story updated successfully");
      }
    } catch (error) {
      if (showMessage) {
        message.error(
          error.response?.data?.message || "Failed to update story"
        );
      }
      console.error(error);
    } finally {
      setUpdatingStory(false);
    }
  };

  const handleUpdateBasicInfo = async (values) => {
    try {
      // Kiểm tra validation cho các field đã bật
      const fieldsToValidate = Object.keys(enabledFields).filter(
        (field) => enabledFields[field]
      );
      await form.validateFields(fieldsToValidate);

      setUpdatingBasic(true);
      const payload = {};

      // Chỉ thêm các field đã được bật vào payload
      if (enabledFields.title && values.title) {
        payload.Title = values.title;
      }
      if (enabledFields.description && values.description) {
        payload.Description = values.description;
      }

      if (projectStatus !== "VISIBLE") {
        if (enabledFields.minimumAmount && values.minimumAmount) {
          payload.MinimumAmount = parseFloat(values.minimumAmount);
        }
        if (enabledFields.startDatetime && values.startDatetime) {
          payload.StartDatetime = values.startDatetime;
        }
        if (enabledFields.endDatetime && values.endDatetime) {
          payload.EndDatetime = values.endDatetime;
        }

        // Kiểm tra nếu không có field nào được bật
        if (Object.keys(payload).length === 0) {
          message.warning("Please enable and edit at least one field.");
          setUpdatingBasic(false);
          return;
        }

        // Kiểm tra các field bắt buộc cho INVISIBLE project
        if (
          (enabledFields.minimumAmount ||
            enabledFields.startDatetime ||
            enabledFields.endDatetime) &&
          (!payload.MinimumAmount ||
            !payload.StartDatetime ||
            !payload.EndDatetime)
        ) {
          message.error(
            "Please fill in all required fields: Minimum Amount, Start Date, and End Date."
          );
          setUpdatingBasic(false);
          return;
        }
      } else {
        // Đối với project VISIBLE, chỉ cần kiểm tra title và description nếu được bật
        if (
          (enabledFields.title && !payload.Title) ||
          (enabledFields.description && !payload.Description)
        ) {
          message.error("Please fill in all enabled fields.");
          setUpdatingBasic(false);
          return;
        }
      }

      // Gửi API chỉ với các field trong payload
      if (Object.keys(payload).length > 0) {
        await updateProject(projectId, payload);
        message.success("Project information updated successfully");
      } else {
        message.warning("No fields were updated.");
      }
    } catch (error) {
      if (error.errorFields) {
        message.error("Please correct the errors in the form.");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to update project information";
        const detailedErrors = error.response?.data?.errors
          ? Object.entries(error.response.data.errors)
              .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
              .join("; ")
          : "";
        message.error(detailedErrors || errorMessage);
      }
      console.error(error);
    } finally {
      setUpdatingBasic(false);
    }
  };

  // Hàm để bật/tắt trạng thái disable của field
  const toggleField = (field) => {
    setEnabledFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (permissionError) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle={permissionError}
        extra={
          <Button type="primary" onClick={() => navigate("/my-projects")}>
            Back to Projects
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Edit Project</h1>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Basic Information" bordered={false}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateBasicInfo}
                initialValues={{}}
              >
                <Form.Item
                  label={
                    <Space>
                      Title
                      <Button
                        size="small"
                        onClick={() => toggleField("title")}
                        disabled={projectStatus === "INVISIBLE"}
                      >
                        {enabledFields.title ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="title"
                  rules={[
                    {
                      required: enabledFields.title,
                      message: "Please input project title!",
                    },
                  ]}
                >
                  <Input
                    disabled={
                      projectStatus === "INVISIBLE" || !enabledFields.title
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      Description
                      <Button
                        size="small"
                        onClick={() => toggleField("description")}
                        disabled={projectStatus === "INVISIBLE"}
                      >
                        {enabledFields.description ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="description"
                  rules={[
                    {
                      required: enabledFields.description,
                      message: "Please input project description!",
                    },
                  ]}
                >
                  <TextArea
                    rows={4}
                    disabled={
                      projectStatus === "INVISIBLE" ||
                      !enabledFields.description
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      Minimum Amount
                      <Button
                        size="small"
                        onClick={() => toggleField("minimumAmount")}
                        disabled={projectStatus === "VISIBLE"}
                      >
                        {enabledFields.minimumAmount ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="minimumAmount"
                  rules={[
                    {
                      required:
                        projectStatus !== "VISIBLE" &&
                        enabledFields.minimumAmount,
                      message: "Please input minimum amount!",
                    },
                    {
                      pattern: /^[0-9]+$/,
                      message: "Please input a valid number!",
                    },
                  ]}
                >
                  <Input
                    type="number"
                    prefix="$"
                    disabled={
                      projectStatus === "VISIBLE" ||
                      !enabledFields.minimumAmount
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      Start Date
                      <Button
                        size="small"
                        onClick={() => toggleField("startDatetime")}
                        disabled={projectStatus === "VISIBLE"}
                      >
                        {enabledFields.startDatetime ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="startDatetime"
                  rules={[
                    {
                      required:
                        projectStatus !== "VISIBLE" &&
                        enabledFields.startDatetime,
                      message: "Please select start date!",
                    },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: "100%" }}
                    disabled={
                      projectStatus === "VISIBLE" ||
                      !enabledFields.startDatetime
                    }
                    disabledDate={(current) =>
                      current && current < moment().startOf("day")
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      End Date
                      <Button
                        size="small"
                        onClick={() => toggleField("endDatetime")}
                        disabled={projectStatus === "VISIBLE"}
                      >
                        {enabledFields.endDatetime ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="endDatetime"
                  rules={[
                    {
                      required:
                        projectStatus !== "VISIBLE" &&
                        enabledFields.endDatetime,
                      message: "Please select end date!",
                    },
                  ]}
                  dependencies={["startDatetime"]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: "100%" }}
                    disabled={
                      projectStatus === "VISIBLE" || !enabledFields.endDatetime
                    }
                    disabledDate={(current) => {
                      const startDate = form.getFieldValue("startDatetime");
                      return startDate
                        ? current && current < startDate.startOf("day")
                        : current && current < moment().startOf("day");
                    }}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updatingBasic}
                    icon={<SaveOutlined />}
                  >
                    Save Basic Information
                  </Button>
                </Form.Item>
                <Form.Item label="Categories">
                  <div style={{ marginTop: 8 }}>
                    {projectCategories.map((category) => (
                      <Tag
                        key={category["category-id"]}
                        color="blue"
                        style={{ marginBottom: 4 }}
                      >
                        {category.name}
                      </Tag>
                    ))}
                    <CategorySelector
                      projectId={projectId}
                      initialCategories={projectCategories}
                      onUpdate={(newCategories) =>
                        setProjectCategories(newCategories)
                      }
                    />
                  </div>
                </Form.Item>
                <Form.Item label="Platforms">
                  <div style={{ marginTop: 8 }}>
                    {projectPlatforms.map((platform) => (
                      <Tag
                        key={platform["platform-id"]}
                        color="green"
                        style={{ marginBottom: 4 }}
                      >
                        {platform.name}
                      </Tag>
                    ))}
                    <PlatformSelector
                      projectId={projectId}
                      initialPlatforms={projectPlatforms}
                      onUpdate={(newPlatforms) =>
                        setProjectPlatforms(newPlatforms)
                      }
                    />
                  </div>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title="Project Thumbnail"
              bordered={false}
              style={{ marginBottom: 24 }}
            >
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                <Image
                  src={currentThumbnail || placeholder}
                  alt="Project Thumbnail"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                  }}
                />
              </div>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Upload
                  accept="image/*"
                  beforeUpload={(file) => {
                    setThumbnail(file);
                    return false;
                  }}
                  showUploadList={false}
                >
                  <Button block icon={<UploadOutlined />}>
                    Select New Thumbnail
                  </Button>
                </Upload>
                {thumbnail && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      backgroundColor: "#fafafa",
                      borderRadius: 8,
                      border: "1px dashed #d9d9d9",
                    }}
                  >
                    <span>{thumbnail.name}</span>
                    <Button
                      type="primary"
                      onClick={handleUpdateThumbnail}
                      loading={updatingThumbnail}
                      size="small"
                    >
                      Update
                    </Button>
                  </div>
                )}
              </Space>
            </Card>
            <Card title="Project Story" bordered={false}>
              {storyLoaded && (
                <TipTapEditor
                  content={story}
                  setContent={setStory}
                  key={`editor-${projectId}`}
                />
              )}
              <Button
                type="primary"
                onClick={() => handleUpdateStory(true)}
                loading={updatingStory}
                icon={<SaveOutlined />}
                style={{ marginTop: 16 }}
                block
              >
                Update Story
              </Button>
            </Card>
          </Col>
        </Row>
        <Divider />
        <div style={{ textAlign: "right" }}>
          <Button
            type="default"
            onClick={() => navigate("/my-projects")}
            style={{ marginRight: 8 }}
          >
            Back to Projects
          </Button>
          <Button
            type="primary"
            onClick={() => {
              handleUpdateBasicInfo(form.getFieldsValue());
              if (thumbnail) handleUpdateThumbnail();
              handleUpdateStory(false);
            }}
            loading={updatingBasic || updatingThumbnail || updatingStory}
          >
            Save All Changes
          </Button>
        </div>
      </Spin>
    </div>
  );
};

export default UserEditProject;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchProject,
  updateProject,
  updateThumbnail,
  updateStory,
  checkProjectPermissions,
  submitProject,
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
  Typography,
  Result,
  Modal,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  ProjectOutlined,
  SendOutlined,
} from "@ant-design/icons";
import TipTapEditor from "../components/TipTapEditor";
import CategorySelector from "../components/MyProjectListPage/CategorySelector";
import PlatformSelector from "../components/MyProjectListPage/PlatformSelector";
import moment from "moment";
import placeholder from "../assets/placeholder-1-1-1.png";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const UserEditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitForm] = Form.useForm();
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
  const [enabledFields, setEnabledFields] = useState({
    title: false,
    description: false,
    minimumAmount: false,
    startDatetime: false,
    endDatetime: false,
  });
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);

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
      setUpdatingBasic(true);
      const payload = {};

      const isVisible = !["CREATED", "REJECTED"].includes(projectStatus);

      if (isVisible) {
        const fieldsToValidate = [];
        if (enabledFields.title) {
          fieldsToValidate.push("title");
          payload.Title = values.title;
        }
        if (enabledFields.description) {
          fieldsToValidate.push("description");
          payload.Description = values.description;
        }
        await form.validateFields(fieldsToValidate);
      } else {
        const fieldsToValidate = Object.keys(enabledFields).filter(
          (field) => enabledFields[field]
        );
        await form.validateFields(fieldsToValidate);

        if (enabledFields.title) payload.Title = values.title;
        if (enabledFields.description) payload.Description = values.description;
        if (enabledFields.minimumAmount)
          payload.MinimumAmount = parseFloat(values.minimumAmount);
        if (enabledFields.startDatetime)
          payload.StartDatetime = values.startDatetime?.format(
            "YYYY-MM-DDTHH:mm:ss"
          );
        if (enabledFields.endDatetime)
          payload.EndDatetime = values.endDatetime?.format(
            "YYYY-MM-DDTHH:mm:ss"
          );
      }

      const response = await updateProject(projectId, payload);
      message.success(
        response.data.message || "Project information updated successfully"
      );
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

  const handleSubmit = () => {
    setIsSubmitModalVisible(true);
  };

  const handleSubmitConfirm = async (values) => {
    try {
      await submitProject(projectId, values.note);
      message.success("Project submitted successfully");
      setIsSubmitModalVisible(false);
      submitForm.resetFields();
      const response = await fetchProject(projectId);
      setProjectStatus(response.data.data.status || "");
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to submit project"
      );
    }
  };

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

  const isVisible = !["CREATED", "REJECTED"].includes(projectStatus);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ marginBottom: 0 }}>
        <ProjectOutlined /> Edit project
      </Title>
      <Text type="secondary">Edit my own projects</Text>
      <Divider />
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
                      <Button size="small" onClick={() => toggleField("title")}>
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
                  <Input disabled={!enabledFields.title} />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      Description
                      <Button
                        size="small"
                        onClick={() => toggleField("description")}
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
                  <TextArea rows={4} disabled={!enabledFields.description} />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      Minimum Amount
                      <Button
                        size="small"
                        onClick={() => toggleField("minimumAmount")}
                        disabled={isVisible}
                      >
                        {enabledFields.minimumAmount ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="minimumAmount"
                  rules={[
                    {
                      required: enabledFields.minimumAmount,
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
                    disabled={isVisible || !enabledFields.minimumAmount}
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <Space>
                      Start Date
                      <Button
                        size="small"
                        onClick={() => toggleField("startDatetime")}
                        disabled={isVisible}
                      >
                        {enabledFields.startDatetime ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="startDatetime"
                  rules={[
                    {
                      required: enabledFields.startDatetime,
                      message: "Please select start date!",
                    },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: "100%" }}
                    disabled={isVisible || !enabledFields.startDatetime}
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
                        disabled={isVisible}
                      >
                        {enabledFields.endDatetime ? "Lock" : "Edit"}
                      </Button>
                    </Space>
                  }
                  name="endDatetime"
                  rules={[
                    {
                      required: enabledFields.endDatetime,
                      message: "Please select end date!",
                    },
                  ]}
                  dependencies={["startDatetime"]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: "100%" }}
                    disabled={isVisible || !enabledFields.endDatetime}
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
          {projectStatus === "CREATED" && (
            <Button
              type="default"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              style={{ marginRight: 8 }}
            >
              Submit Project
            </Button>
          )}
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
      <Modal
        title="Submit Project"
        visible={isSubmitModalVisible}
        onCancel={() => {
          setIsSubmitModalVisible(false);
          submitForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={submitForm}
          onFinish={handleSubmitConfirm}
          layout="vertical"
        >
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

export default UserEditProject;

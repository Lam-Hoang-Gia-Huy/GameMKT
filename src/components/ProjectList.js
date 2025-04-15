import React, { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Spin,
  Pagination,
  Empty,
  Alert,
  Select,
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Collapse,
} from "antd";
import ProjectCard from "./ProjectCard";
import {
  fetchAllCategories,
  fetchAllPlatforms,
  fetchProjects,
} from "../api/apiClient";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [form] = Form.useForm();

  const sortProjectsByStatus = (projects) => {
    const now = new Date();

    return [...projects].sort((a, b) => {
      const aStart = new Date(a["start-datetime"]);
      const aEnd = new Date(a["end-datetime"]);
      const bStart = new Date(b["start-datetime"]);
      const bEnd = new Date(b["end-datetime"]);

      const aStatus = now < aStart ? 2 : now > aEnd ? 1 : 0;
      const bStatus = now < bStart ? 2 : now > bEnd ? 1 : 0;

      return aStatus - bStatus;
    });
  };

  const loadProjects = useCallback(
    async (filters = {}, page = currentPage, size = pageSize) => {
      try {
        setLoading(true);

        const defaultFilters = {
          Status: "ONGOING",
          ...filters,
        };

        const [projectsResponse, categoriesResponse, platformsResponse] =
          await Promise.all([
            fetchProjects(defaultFilters, page, size),
            fetchAllCategories(),
            fetchAllPlatforms(),
          ]);

        // Extract paginated data using the new response structure
        const projectsData = projectsResponse?.data?.data?.["list-data"] || [];
        const sortedData = sortProjectsByStatus(projectsData);
        setProjects(sortedData);

        // Set total items for pagination
        const total = projectsResponse?.data?.data?.["total-records"] || 0;
        setTotalItems(total);

        const categoriesData = categoriesResponse?.data?.data || [];
        setCategories(categoriesData);

        const platformsData = platformsResponse?.data?.data || [];
        setPlatforms(platformsData);

        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "An error occurred while connecting to the data server. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleFilterSubmit = (values) => {
    const filters = {
      ...values,
      Status: "ONGOING",
    };

    setCurrentPage(1); // Reset to first page on filter change
    loadProjects(filters, 1, pageSize);
  };

  const handleResetFilters = () => {
    form.resetFields();
    setCurrentPage(1);
    loadProjects({ Status: "ONGOING" }, 1, pageSize);
  };

  const handlePageChange = (page, pageSizeValue) => {
    setCurrentPage(page);
    setPageSize(pageSizeValue);
    loadProjects(form.getFieldsValue(), page, pageSizeValue);
    window.scrollTo(0, 0);
  };

  if (loading)
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

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );

  return (
    <div>
      <Collapse
        defaultActiveKey={["1"]}
        style={{ marginBottom: 20 }}
        expandIconPosition="end"
      >
        <Panel header="Filter Projects" key="1">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            style={{
              padding: "16px",
              backgroundColor: "#f0f2f5",
              borderRadius: 8,
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="Title" label="Title">
                  <Input placeholder="Search by title" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="CategoryIds" label="Categories">
                  <Select
                    mode="multiple"
                    placeholder="Select categories"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    style={{ width: "100%" }}
                  >
                    {categories.map((category) => (
                      <Option
                        key={category["category-id"]}
                        value={category["category-id"]}
                      >
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="PlatformIds" label="Platforms">
                  <Select
                    mode="multiple"
                    placeholder="Select platforms"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    style={{ width: "100%" }}
                  >
                    {platforms.map((platform) => (
                      <Option
                        key={platform["platform-id"]}
                        value={platform["platform-id"]}
                      >
                        {platform.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="StartDatetimeRange" label="Start Date Range">
                  <RangePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="MinMinimumAmount" label="Min Funding Goal">
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Input min goal"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="MaxMinimumAmount" label="Max Funding Goal">
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Input max goal"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="MinTotalAmount" label="Min Pledged Amount">
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Input min amount"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="MaxTotalAmount" label="Max Pledged Amount">
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Input max amount"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]} justify="end">
              <Col>
                <Button type="primary" htmlType="submit">
                  Apply Filters
                </Button>
              </Col>
              <Col>
                <Button onClick={handleResetFilters} style={{ marginLeft: 8 }}>
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>
        </Panel>
      </Collapse>

      {projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Empty description="No projects found" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {projects.map((project) => (
              <Col key={project["project-id"]} xs={24} sm={12} md={8}>
                <ProjectCard project={project} />
              </Col>
            ))}
          </Row>

          <Row justify="center" style={{ marginTop: "20px" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalItems}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={["6", "12", "18", "24"]}
            />
          </Row>
        </>
      )}
    </div>
  );
};

export default React.memo(ProjectList);

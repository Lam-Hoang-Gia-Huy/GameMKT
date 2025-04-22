import React from "react";
import { Layout } from "antd";
import ProjectList from "../components/ProjectList";
import { Typography, Divider } from "antd";
import { HomeOutlined } from "@ant-design/icons";
const { Content } = Layout;
const { Title, Text } = Typography;

const HomePage = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Content style={{ padding: "24px" }}>
          <Title level={2} style={{ marginBottom: 0 }}>
            <HomeOutlined /> Home
          </Title>
          <Text type="secondary">
            Discover and support exciting projects by donating to bring creative
            ideas to life.
          </Text>
          <Divider />
          <ProjectList />
        </Content>
      </Layout>
    </Layout>
  );
};

export default React.memo(HomePage);

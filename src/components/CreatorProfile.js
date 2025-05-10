import React from "react";
import { Descriptions, Avatar, Typography, Card, Divider } from "antd";
import {
  PhoneOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Paragraph } = Typography;

const CreatorProfile = ({ creator }) => {
  if (!creator) return null;

  return (
    <Card>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Avatar
          size={128}
          src={creator.avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#1890ff", marginBottom: 16 }}
        />
        <Title level={3}>{creator["full-name"]}</Title>
        {creator.bio && (
          <Paragraph style={{ maxWidth: 600, margin: "0 auto" }}>
            {creator.bio}
          </Paragraph>
        )}
      </div>

      <Divider orientation="left">Creator Information</Divider>

      <Descriptions bordered column={1}>
        <Descriptions.Item
          label={
            <>
              <UserOutlined /> User ID
            </>
          }
        >
          {creator["user-id"] || "Not provided"}
        </Descriptions.Item>
        {creator.phone && (
          <Descriptions.Item
            label={
              <>
                <PhoneOutlined /> Phone
              </>
            }
          >
            {creator.phone}
          </Descriptions.Item>
        )}
        <Descriptions.Item
          label={
            <>
              <CalendarOutlined /> Member since
            </>
          }
        >
          {moment(creator["created-datetime"]).format("DD/MM/YYYY") ||
            "Not provided"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default CreatorProfile;

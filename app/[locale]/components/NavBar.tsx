"use client";

import {
  Avatar,
  Button,
  Col,
  Dropdown,
  Input,
  MenuProps,
  Row,
  Select,
  Space,
  Switch,
  theme,
} from "antd";
import { Header } from "antd/es/layout/layout";
import React, { useState } from "react";
import { PoweroffOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import { UserOutlined } from "@ant-design/icons";
import LanguageChanger from "./LanguageChanger";

export default function App() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [_, setCookies] = useCookies(["token"]);
  const [isDarkMode, setIsDarkMode] = useState();
  const logout = () => {
    setCookies("token", "");
    window.localStorage.removeItem("userId");
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <>
          Dark Mode <Switch style={{ marginLeft: 10 }} checked={isDarkMode} />
        </>
      ),
    },
    {
      key: "4",
      label: <hr />
    },
    {
      key: "2",
      label: (
        <>
          <LanguageChanger />
        </>
      ),
    },
    {
      key: "5",
      label: <hr />
    },
    {
      key: "3",
      label: "Logout",
      onClick: logout,
    },

  ];

  return (
    <>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          textAlign: "right",
          background: colorBgContainer,
          boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.05)",
        }}>
        <Row>
          {/* <Col span={8} style={{ padding: 15 }}>
            <Input.Search placeholder='Search...'  allowClear />
          </Col> */}

          <Col span={8} offset={16}>
            {/* <Button onClick={logout} icon={<PoweroffOutlined />} /> */}

            <Dropdown trigger={["click"]} menu={{ items }} placement='bottomLeft'>
              <Space wrap size={16}>
                <Avatar size='large' icon={<UserOutlined />} />
              </Space>
            </Dropdown>
          </Col>
        </Row>
      </Header>
    </>
  );
}

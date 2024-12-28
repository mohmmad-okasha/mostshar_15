"use client";

import {
  Avatar,
  Button,
  Col,
  Divider,
  Dropdown,
  Menu,
  MenuProps,
  Row,
  Space,
  Switch,
  Typography,
} from "antd";
import { Header } from "antd/es/layout/layout";
import React, { useState, useEffect } from "react";
import {
  PoweroffOutlined,
  SettingOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useCookies } from "react-cookie";
import LanguageChanger from "./LanguageChanger";
import initTranslations from "../../i18n"; // Your i18n utility
import { CiDark } from "react-icons/ci";

const { Text } = Typography;

export default function App({ locale }: { locale: string }) {
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    setLoading(true);
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
      setLoading(false);
    }
    loadTranslations();
  }, [locale]);

  const [cookies, setCookies] = useCookies(["token", "username", "loginTime"]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(true);

  //const [username, setUsername] = useState("Guest");
  const [loginTime, setLoginTime] = useState("");
  const userName = window.localStorage.getItem("userName");

  useEffect(() => {
    setLoginTime(cookies.loginTime || new Date().toLocaleString());
  }, [cookies]);

  const changeTheme = () => {
    setIsDarkMode((prev) => !prev);
    // Apply theme changes globally if needed
    document.body.className = isDarkMode ? "light-theme" : "dark-theme";
  };

  const logout = () => {
    setCookies("token", "");
    window.localStorage.removeItem("userId");
  };

  const items: any = [
    {
      key: "1",
      label: (
        <Space>
          <UserOutlined />
          <Text>{t("User") + " :" + userName}</Text>
        </Space>
      ),
    },
    {
      key: "2",
      label: (
        <Space>
          <ClockCircleOutlined />
          {t("Login Time")}: <Text>{loginTime}</Text>
          <Divider />
        </Space>
      ),
    },
    {
      key: "3",
      label: (
        <Space>
          <GlobalOutlined />
          <LanguageChanger />
          <Divider />
        </Space>
      ),
    },
    {
      key: "4",
      label: (
        <Space>
          <CiDark />
          {t("Dark Mode")}
          <Switch
            style={{ marginLeft: 10 }}
            checked={isDarkMode}
            onChange={changeTheme}
          />
                    <Divider />

        </Space>
      ),
    },
    {
      key: "5",
      label: (
        <Space>
          <SettingOutlined />
          {t("Settings")}
          <Divider />

        </Space>
      ),
      onClick: () => (window.location.href = "/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "6",
      label: (
        <Space>
          <PoweroffOutlined />
          {t("Logout")}
          
        </Space>
      ),
      onClick: logout,
    },
  ];

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
      {/* Left Section */}
      <Text strong style={{ fontSize: 20 }}></Text>

      {/* Right Section */}
      <Space size='large' align='center'>
        {/* Dropdown Menu */}
        <Dropdown menu={{ items }} trigger={["click"]} placement='bottomRight'>
          <Avatar
            size='large'
            icon={<UserOutlined />}
            style={{
              cursor: "pointer",
              backgroundColor: "#098290",
            }}
          />
        </Dropdown>
      </Space>
    </Header>
  );
}

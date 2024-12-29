"use client";

import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  MenuProps,
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
import axios from "axios";
import { getApiUrl, getSettings } from "@/app/shared";

const api = getApiUrl();
const { Text } = Typography;

type SettingsType = {
  lang: string;
  theme: string;
};

export default function App({
  settings,
  setSettings,
}: {
  setSettings: (settings: SettingsType) => void;
  settings: SettingsType;
}) {
  const locale = settings.lang;

  const [t, setT] = useState(() => (key: string) => key);
  const [cookies, setCookies] = useCookies(["token", "username", "loginTime"]);
  const [isDarkMode, setIsDarkMode] = useState(settings.theme === "dark");
  const [loading, setLoading] = useState(true);

  const userName = cookies.username || window.localStorage.getItem("userName");
  const loginTime = cookies.loginTime || new Date().toLocaleString();

  // Load translations dynamically based on locale
  useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
      setLoading(false);
    }
    loadTranslations();
  }, [locale]);

  // Persisted theme load (on initial load only)
  useEffect(() => {
    getSettings(userName).then((userSettings) => {
      setIsDarkMode(userSettings.theme === "dark");
    });
  }, [userName]);

  // Change theme and persist only when user switches it
  const handleThemeChange = async () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);

    const updatedSettings = {
      ...settings,
      theme: newTheme,
    };

    // Update settings locally
    setSettings(updatedSettings);

    try {
      // Persist updated theme settings
      await axios.post(`${api}/users/changeTheme`, {
        userName,
        settings: updatedSettings,
      });
    } catch (error) {
      console.error(t("Error updating theme preference:"), error);
    }
  };

  const logout = () => {
    setCookies("token", "");
    window.localStorage.removeItem("userId");
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <Space>
          <UserOutlined />
          <Text>{t("User")}: {userName}</Text>
        </Space>
      ),
    },
    {
      key: "2",
      label: (
        <Space>
          <ClockCircleOutlined />
          {t("Login Time")}: <Text>{loginTime}</Text>
        </Space>
      ),
    },
    {
      key: "3",
      label: (
        <Space>
          <GlobalOutlined />
          <LanguageChanger />
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
            onChange={handleThemeChange}
          />
        </Space>
      ),
    },
    {
      key: "5",
      label: (
        <Space>
          <SettingOutlined />
          {t("Settings")}
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
        background: isDarkMode ? "#1d1d1d" : "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text strong style={{ fontSize: 20 }}></Text>

      <Space size="large" align="center">
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
          <Avatar
            size="large"
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

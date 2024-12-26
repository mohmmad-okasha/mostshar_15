// "use client";

// import {
//   Avatar,
//   Button,
//   Col,
//   Dropdown,
//   Input,
//   MenuProps,
//   Row,
//   Select,
//   Space,
//   Switch,
//   theme,
// } from "antd";
// import { Header } from "antd/es/layout/layout";
// import React, { useState } from "react";
// import { PoweroffOutlined } from "@ant-design/icons";
// import { useCookies } from "react-cookie";
// import { UserOutlined } from "@ant-design/icons";
// import LanguageChanger from "./LanguageChanger";

// export default function App() {
//   const {
//     token: { colorBgContainer },
//   } = theme.useToken();

//   const [_, setCookies] = useCookies(["token"]);
//   const [isDarkMode, setIsDarkMode] = useState();
//   const logout = () => {
//     setCookies("token", "");
//     window.localStorage.removeItem("userId");
//   };

//   const items: MenuProps["items"] = [
//     {
//       key: "1",
//       label: (
//         <>
//           Dark Mode <Switch style={{ marginLeft: 10 }} checked={isDarkMode} />
//         </>
//       ),
//     },
//     {
//       key: "4",
//       label: <hr />
//     },
//     {
//       key: "2",
//       label: (
//         <>
//           <LanguageChanger />
//         </>
//       ),
//     },
//     {
//       key: "5",
//       label: <hr />
//     },
//     {
//       key: "3",
//       label: "Logout",
//       onClick: logout,
//     },

//   ];

//   return (
//     <>
//       <Header
//         style={{
//           position: "sticky",
//           top: 0,
//           zIndex: 1,
//           textAlign: "right",
//           background: colorBgContainer,
//           boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.05)",
//         }}>
//         <Row>
//           {/* <Col span={8} style={{ padding: 15 }}>
//             <Input.Search placeholder='Search...'  allowClear />
//           </Col> */}

//           <Col span={8} offset={16}>
//             {/* <Button onClick={logout} icon={<PoweroffOutlined />} /> */}

//             <Dropdown trigger={["click"]} menu={{ items }} placement='bottomLeft'>
//               <Space wrap size={16}>
//                 <Avatar size='large' icon={<UserOutlined />} />
//               </Space>
//             </Dropdown>
//           </Col>
//         </Row>
//       </Header>
//     </>
//   );
// }


"use client";

import {
  Avatar,
  Button,
  Col,
  Dropdown,
  Menu,
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

const { Text } = Typography;

export default function App() {
  const [cookies, setCookies] = useCookies(["token", "username", "loginTime"]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('');
  //const [username, setUsername] = useState("Guest");
  const [loginTime, setLoginTime] = useState("");
  const userName = window.localStorage.getItem("userName");

  useEffect(() => {
    
   //setUsername(cookies.username || "Guest");
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


  const dropdownMenu = (
    <Menu
      items={[
        {
          key: "1",
          label: (
            <Space>
              <UserOutlined />
              <Text>{userName}</Text>
            </Space>
          ),
          disabled: true, // Non-interactive
        },
        {
          key: "2",
          label: (
            <Space>
              <ClockCircleOutlined />
              Login Time: <Text>{loginTime}</Text>
            </Space>
          ),
          disabled: true,
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
              Dark Mode
              <Switch
                style={{ marginLeft: 10 }}
                checked={isDarkMode}
                onChange={changeTheme}
              />
            </Space>
          ),
        },
        {
          key: "5",
          label: (
            <Space>
              <SettingOutlined />
              Settings
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
              Logout
            </Space>
          ),
          onClick: logout,
        },
      ]}
    />
  );

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left Section */}
      <Text strong style={{ fontSize: 20 }}>
        
      </Text>

      {/* Right Section */}
      <Space size="large" align="center">
        {/* Dropdown Menu */}
        <Dropdown overlay={dropdownMenu} trigger={["click"]} placement="bottomRight">
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

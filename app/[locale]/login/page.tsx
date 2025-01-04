"use client";
import "../globals.css";

import React, { useEffect, useState } from "react";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, Button, Card, ConfigProvider, Flex, Form, Input, Layout } from "antd";
import axios from "axios";
import { useCookies } from "react-cookie";
import { LuFingerprint } from "react-icons/lu";
import { getApiUrl, saveLog } from "@/app/shared";
import { usePathname } from "next/navigation";
import initTranslations from "../../i18n";
import Cookies from "js-cookie";

const api = getApiUrl();



export default function App() {
  const pathname = usePathname();
  const locale = pathname.slice(-2);
  Cookies.remove("loading");

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

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const [_, setCookies, removeCookie] = useCookies(["token", "loading"]); //to check login

  useEffect(() => {
    Cookies.remove("loading");
    Cookies.remove("token");

    setCookies("loading", false);
  }, []);

  const onFinish = async () => {
    setLoading(true);
    const response = await axios.post(api + "/login", {
      name,
      password,
    });

    if (response.data.token) {
      //saveLog("login : " + response.data.userName);
      setCookies("loading", false);
      setCookies("token", response.data.token);
      window.localStorage.setItem("userName", response.data.userName);
    }
    setLoading(false);
    setErrors(response.data.message);
  };

  return (
    <ConfigProvider>
      <Layout
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        <Card
          style={{ width: "30vh", backgroundColor: "#0000", border: 0 }}
          //style={{ width: "30vh", backgroundColor: settings?.theme == 'dark' ? "black" : '#0000', border: 0 }}
          loading={loading}>
          <Flex justify='center' align='middle'>
            <LuFingerprint size='5em' color='#098290' />
          </Flex>
          <br />
          <br />
          <Form style={{direction: locale === 'ar' ? 'rtl' : 'ltr'}} name='normal_login' className='login-form' onFinish={onFinish}>
            <Form.Item
              name='username'
              rules={[{ required: true, message: "Please input your Username!" }]}>
              <Input
                onChange={(e) => {
                  setName(e.target.value);
                }}
                prefix={<UserOutlined className='site-form-item-icon' />}
                placeholder={t("Username")}
              />
            </Form.Item>
            <Form.Item
              name='password'
              rules={[{ required: true, message: "Please input your Password!" }]}>
              <Input
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                prefix={<LockOutlined className='site-form-item-icon' />}
                type='password'
                placeholder={t("Password")}
              />
            </Form.Item>

            <Button block type='primary' htmlType='submit' className='login-form-button'>
              {t("Login")}
            </Button>
          </Form>
          <br />
          {errors && <Alert description={errors} type='error' showIcon />}
        </Card>
      </Layout>
    </ConfigProvider>
  );
}

"use client";
//import
import "./globals.css";
import SideBar from "./components/SideBar";
import NavBar from "./components/NavBar";
import Login from "./login/page";
import { Card, ConfigProvider, Flex, Layout, Spin, theme } from "antd";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

const { Content, Footer } = Layout;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [Authed, setAuthed] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookies, setCookies] = useCookies(["token", "loading"]);

  useEffect(() => {
    if (cookies.token) setAuthed("true");
    else setAuthed("false");
  }, [cookies.token]);

  useEffect(() => {
    if (cookies.loading === true) setLoading(true);
    else setLoading(false);
  }, [cookies.loading]);

  
  return (
    <html lang='en'>
      <body style={{ margin: 0 }}>
        <ConfigProvider
          theme={{
            components: {
              Layout: {
                siderBg: "#098290",
                triggerBg: "#098290",
              },
            },
            //algorithm: theme.darkAlgorithm,
            token: {
              //colorBgBase:'#f5f5f5',
              colorText: "#858796",
              colorPrimary: "#098290",
              borderRadius: 5,
            },
          }}>
          {Authed === "false" && <Login />}
          {Authed === "true" && (
            <Layout hasSider style={{ minHeight: "100vh" }}>
              <SideBar />

              <Layout>
                <NavBar />

                <Content
                  style={{
                    padding: 24,
                    margin: 0,
                    minHeight: 280,
                    //background: colorBgContainer,
                    //borderRadius: borderRadiusLG,
                  }}>
                  {loading && (
                    <>
                      <Flex
                        style={{ maxHeight: "100vh" }}
                        gap='center'
                        align='center'
                        justify='center'
                        vertical>
                        <Card
                          loading={true}
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#0000",
                            border: 0,
                          }}
                        />
                        {/*<Spin fullscreen tip='Loading' size='large' style={{maxHeight: "100vh", fontSize: "20vh" }}></Spin>*/}
                      </Flex>

                      <div style={{ display: "none" }}>{children}</div>
                    </>
                  )}
                  {!loading && children} {/* content will show here */}
                </Content>
                {/* <Footer style={{ textAlign: "center" }}>
                ©{new Date().getFullYear()} Created by Mohammad Okasha
              </Footer> */}
              </Layout>
            </Layout>
          )}
        </ConfigProvider>
      </body>
    </html>
  );
}

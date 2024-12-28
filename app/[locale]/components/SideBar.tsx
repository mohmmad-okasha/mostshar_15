import { Menu, MenuProps, Drawer, Button, Spin, Card } from "antd";
import Sider from "antd/es/layout/Sider";
import React, { useEffect, useState } from "react";
import { PieChartOutlined, UserOutlined, MenuOutlined } from "@ant-design/icons";
import { FaRegEye } from "react-icons/fa6";
import { CiWallet } from "react-icons/ci";
import { FaFileArrowUp, FaFileArrowDown } from "react-icons/fa6";
import { TbInvoice } from "react-icons/tb";
import { LuFolderTree } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import Image from "next/image";
import logo from "@/public/nextjs-13.svg"; // Adjust the path if needed
import { getRules } from "@/app/shared";
import initTranslations from "../../i18n"; // Your i18n utility

type MenuItem = Required<MenuProps>["items"][number];

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

  const [loading, setLoading] = useState(true);
  const [cookies, setCookies] = useCookies(["token", "loading"]);
  const router = useRouter();
  const [rules, setRules] = useState<any>([]);
  const [userPermissions, setUserPermissions] = useState<any>({
    View: 0,
    Add: 0,
    Remove: 0,
    Edit: 0,
    Print: 0,
    Export: 0,
  });
  const userName = window.localStorage.getItem("userName");

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (cookies.loading === true) setLoading(true);
    else setLoading(false);
  }, [cookies.loading]);

  useEffect(() => {
    getRules(userName).then((value) => {
      setUserPermissions(value);
    });
  }, []);

  // Detect screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Mobile threshold
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Run on mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const items: MenuItem[] = [
    {
      key: "1",
      icon: <PieChartOutlined />,
      label: t("Dashboard"),
      onClick: () => {
        router.push("/dashboard");
        if (isMobile) setDrawerVisible(false);
      },
    },
    {
      key: "2",
      icon: <UserOutlined />,
      label: t("Users"),
      onClick: () => {
        setCookies("loading", true);
        router.push("/users");
        if (isMobile) setDrawerVisible(false);
      },
      disabled: userPermissions?.users?.View !== 1,
    },
    {
      key: "4",
      icon: <FaRegEye />,
      label: t("Logs"),
      onClick: () => {
        router.push("/logs");
        setCookies("loading", true);
        if (isMobile) setDrawerVisible(false);
      },
      disabled: userPermissions?.logs?.View !== 1,
    },
    {
      key: "sub1",
      label: t("Finance"),
      icon: <CiWallet />,
      children: [
        {
          key: "14",
          label: t("Accounts"),
          icon: <LuFolderTree />,
          onClick: () => {
            router.push("/accounts");
            setCookies("loading", true);
            if (isMobile) setDrawerVisible(false);
          },
          disabled: userPermissions?.accounts?.View !== 1,
        },
        {
          key: "sub3",
          label: t("Vouchers"),
          icon: <TbInvoice />,
          children: [
            {
              key: "15",
              label: t("Receipts"),
              icon: <FaFileArrowDown />,
              onClick: () => {
                router.push("/receipt");
                setCookies("loading", true);
                if (isMobile) setDrawerVisible(false);
              },
              disabled: userPermissions?.receipts?.View !== 1,
            },
            {
              key: "16",
              label: t("Payments"),
              icon: <FaFileArrowUp />,
              onClick: () => {
                router.push("/payment");
                setCookies("loading", true);
                if (isMobile) setDrawerVisible(false);
              },
              disabled: userPermissions?.payments?.View !== 1,
            },
          ],
        },
      ],
    },
  ];

  return (
    <>
      {isMobile ? (
        <>
          <Button
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{
              position: "fixed",
              top: 15,
              left: 15,
              zIndex: 1000,
              //background: "#098290",
              border: "none",
            }}
          />
          <Drawer
            title={
              <div style={{ textAlign: "center" }}>
                <Image src={logo} alt='Logo' width={80} height={40} />
              </div>
            }
            placement='left'
            closable
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={"100vw"}
            style={{ background: "linear-gradient(180deg, #0a97a1, #056b7b)" }}>
            <Menu
              theme='dark'
              mode='inline'
              items={items}
              defaultSelectedKeys={["1"]}
              style={{
                background: "transparent",
                color: "#fff",
              }}
            />
          </Drawer>
        </>
      ) : (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme='dark'
          width={200}
          style={{
            background: "linear-gradient(180deg, #0a97a1, #056b7b)",
            height: "100vh",
            overflow: "auto",
            position: "sticky",
            top: 0,
            zIndex: 101,
          }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Image src={logo} alt='Logo' width={collapsed ? 50 : 100} height={50} />
          </div>
          {!loading ? (
            <Menu
              theme='dark'
              mode='inline'
              items={items}
              defaultSelectedKeys={["1"]}
              style={{
                background: "transparent",
                color: "#fff",
              }}
            />
          ) : (
            <div>
              <Card
                style={{ padding: "0", backgroundColor: "#0000", border: 0 }}
                loading={true}></Card>
            </div>
          )}
        </Sider>
      )}
    </>
  );
}

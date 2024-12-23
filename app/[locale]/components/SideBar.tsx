import { Menu, MenuProps } from "antd";
import Sider from "antd/es/layout/Sider";
import React, { useEffect, useState } from "react";
import { PieChartOutlined, UserOutlined } from "@ant-design/icons";
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

type MenuItem = Required<MenuProps>["items"][number];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [cookies, setCookies] = useCookies(["token", "loading"]);

  useEffect(() => {
    if (cookies.loading === true) setLoading(true);
    else setLoading(false);
  }, [cookies.loading]);

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

  useEffect(() => {
    getRules(userName).then((value) => {
      setUserPermissions(value);
    });
  }, []);

  useEffect(() => {
    console.log("userPermissions *****************");
    console.log(userPermissions);
    console.log(userPermissions?.users?.View);
  }, [userPermissions]);

  const items: MenuItem[] = [
    {
      key: "1",
      icon: <PieChartOutlined />,
      label: "Dashboard",
      onClick: () => {
        router.push("/dashboard");
      },
    },
    {
      key: "2",
      icon: <UserOutlined />,
      label: "Users",
      onClick: () => {
        setCookies("loading", true);
        router.push("/users");
      },
      disabled: userPermissions?.users?.View != 1,
    },
    {
      key: "4",
      icon: <FaRegEye />,
      label: "Logs",
      onClick: () => {
        router.push("/logs");
        setCookies("loading", true);
      },
      disabled: userPermissions?.logs?.View != 1,
    },
    {
      key: "sub1",
      label: "Finance",
      icon: <CiWallet />,
      children: [
        {
          key: "14",
          label: "Accounts",
          icon: <LuFolderTree />,
          onClick: () => {
            router.push("/accounts");
            setCookies("loading", true);
          },
          disabled: userPermissions?.accounts?.View != 1,
        },
        {
          key: "sub3",
          label: "Vouchers",
          icon: <TbInvoice />,
          children: [
            {
              key: "15",
              label: "Receipt",
              icon: <FaFileArrowDown />,
              onClick: () => {
                router.push("/receipt");
                setCookies("loading", true);
              },
              disabled: userPermissions?.receipts?.View != 1,
            },
            {
              key: "16",
              label: "Payment",
              icon: <FaFileArrowUp />,
              onClick: () => {
                router.push("/payment");
                setCookies("loading", true);
              },
              disabled: userPermissions?.payments?.View != 1,
            },
          ],
        },
      ],
    },
  ];

  //collaps or not on button click
  const [collaps, setCollaps] = useState(false);
  const changeCollaps = () => {
    setCollaps(!collaps);
  };

  return (
    <>
      <Sider
      collapsible
        breakpoint='lg'
        collapsedWidth='0'
        collapsed={collaps}
        onCollapse={changeCollaps}
        style={{ position: "sticky", top: 0, zIndex: 1, width: "80vh" }}>
        {/* <Sider
        collapsible
        collapsed={collaps}
        onCollapse={changeCollaps}
        theme="dark"
        style={{ position: "sticky", top: 0 }}
      > */}
        
        <div style={{ padding: 20, textAlign: "center" }}>
          <Image src={logo} alt='' width={100} height={20} />
        </div>

        <Menu
          disabled={loading}
          theme='dark'
          style={{ backgroundColor: "#098290" }}
          defaultSelectedKeys={["1"]}
          mode='inline'
          items={items}
        />
      </Sider>
    </>
  );
}

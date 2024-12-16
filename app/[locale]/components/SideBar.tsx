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
  //const [_, setCookies] = useCookies(["loading"]); //for loading page
  const userName = window.localStorage.getItem("userName");

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
      disabled: rules["Users"] != 1,
    },
    {
      key: "4",
      icon: <FaRegEye />,
      label: "Logs",
      onClick: () => {
        router.push("/logs");
        setCookies("loading", true);
      },
      disabled: rules["Logs"] != 1,
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
          disabled: rules["Accounts"] != 1,
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
              disabled: rules["Receipt"] != 1,
            },
            {
              key: "16",
              label: "Payment",
              icon: <FaFileArrowUp />,
              onClick: () => {
                router.push("/payment");
                setCookies("loading", true);
              },
              disabled: rules["Payment"] != 1,
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

  useEffect(() => {
    //to get user rules
    getRules(userName).then((value) => {
      setRules(value);
    });
  }, []);

  return (
    <>
      <Sider
        breakpoint='lg'
        collapsedWidth='0'
        collapsed={collaps}
        onCollapse={changeCollaps}
        style={{ position: "sticky", top: 0, zIndex: 1, width: "80vh" }}>
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

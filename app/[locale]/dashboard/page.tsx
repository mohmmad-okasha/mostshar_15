"use client";
import { Row, Col, Card } from "antd";
import Link from "next/link";
import { UserOutlined } from "@ant-design/icons";
import { LiaHotelSolid } from "react-icons/lia";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import { TbHotelService, TbReportAnalytics } from "react-icons/tb";
import { FaCalendarAlt } from "react-icons/fa";
import "../globals.css";
import { useRouter } from "next/navigation";
import { getRules } from "@/app/shared";
//import { usePathname } from "next/navigation";

export default function App() {
  const [rules, setRules] = useState<any>([]);
  const router = useRouter();
  const [_, setCookies] = useCookies(["loading"]); //for loading page
  const userName = window.localStorage.getItem("userName");
  //const pathname = usePathname();

  useEffect(() => {
    //to get user rules
    getRules(userName).then((value) => {
     
      // const lastPath = pathname.split("/").pop();
      // if(lastPath == 'dashboard'){
      //   setCookies('loading',false)
      // }
      
      setRules(value);
    });
  }, []);

  const btns = [
    { title: "Users", icon: <UserOutlined />, url: "/users", color: "green" },
    { title: "Hotels", icon: <LiaHotelSolid />, url: "/hotels", color: "" },
    { title: "Logs", icon: <FaRegEye />, url: "/logs", color: "" },
    { title: "Bookings", icon: <FaCalendarAlt />, url: "/bookings", color: "" },
    {
      title: "Available Hotels",
      icon: <TbHotelService />,
      url: "/availableHotels",
      color: "",
    },
    {
      title: "Hotels Report",
      icon: <TbReportAnalytics />,
      url: "/hotelsReport",
      color: "",
    },
  ];
  //const [allBtn, setAllBtn] = useState([]);

  return (
    <>
      <Row gutter={12}>
        {Object.keys(btns).map(
          (key: any) =>
            rules[btns[key].title] > 0 && (
              <Col
                style={{ padding: 5 }}
                key={key}
                xs={{ flex: "100%" }}
                sm={{ flex: "30%" }}
                lg={{ flex: "30%" }}
                xl={{ flex: "20%" }}>
                <Link
                  className='animated-button'
                  onClick={() => setCookies("loading", true)}
                  href={btns[key].url}>
                  <Card
                    bordered={true}
                    style={{
                      fontSize: "1.9vh",
                      color: "white",
                    }}>
                    {btns[key].icon} {btns[key].title}
                  </Card>
                </Link>
              </Col>
            )
        )}
      </Row>
    </>
  );
}

"use client";
import { Row, Col, Card } from "antd";
import Link from "next/link";
import { UserOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import { useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa6";
import "../globals.css";
import { useRouter } from "next/navigation";
import { getRules, getApiUrl } from "@/app/shared";
import Axios from "axios";
import * as ant from "@ant-design/icons";
import * as fa6 from "react-icons/fa6";

//import { usePathname } from "next/navigation";

export default function App() {
  const api = getApiUrl();
  const [userPermissions, setUserPermissions] = useState<any>({
    View: 0,
    Add: 0,
    Remove: 0,
    Edit: 0,
    Print: 0,
    Export: 0,
  });
  const [allBtns, setAllBtns] = useState<any>([]);
  const router = useRouter();
  const [_, setCookies] = useCookies(["loading"]); //for loading page
  const userName = window.localStorage.getItem("userName");
  const [Errors, setErrors] = useState<any>({});

  //دمج  الايقونات معا
  const Icons: any = {
    ...ant,
    ...fa6,
  };

  useEffect(() => {
    getData();
    getRules(userName).then((value) => {
      setUserPermissions(value);
    });
  }, []);

  async function getData() {
    //setLoading(true);
    try {
      const response = await Axios.get(`${api}/dashboard`);
      setAllBtns(response.data);
    } catch (error) {
      setErrors({ ...Errors, connectionError: error });
      console.error("Error fetching users:", error);
    } finally {
      // setLoading(false);
      //setCookies("loading", false);
    }
  }

  //const [allBtn, setAllBtn] = useState([]);
  const getDynamicIcon = (iconName: any) => {
    const IconComponent = Icons[iconName]; // محاولة العثور على الأيقونة
    return IconComponent ? <IconComponent /> : null; // عرض الأيقونة إذا وجدت
  };
  return (
    <>
      <Row gutter={12}>
        {Object.keys(allBtns).map(
          (key: any) =>
            userPermissions[allBtns[key].title.toLowerCase()].View == 1 && (
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
                  href={allBtns[key].url}>
                  <Card
                    bordered={true}
                    style={{
                      fontSize: "1.9vh",
                      color: "white",
                    }}>
                    {getDynamicIcon(allBtns[key].icon)} {allBtns[key].title}
                  </Card>
                </Link>
              </Col>
            )
        )}
      </Row>
    </>
  );
}

"use client";
import { Row, Col, Card } from "antd";
import Link from "next/link";
import { useCookies } from "react-cookie";
import { use, useEffect, useState } from "react";
import "../globals.css";
import { useRouter } from "next/navigation";
import { getRules, getApiUrl, getSettings } from "@/app/shared";
import Axios from "axios";
import * as ant from "@ant-design/icons";
import * as fa6 from "react-icons/fa6";
import initTranslations from "../../i18n.js";

//import { usePathname } from "next/navigation";

export default function App(/*props: any*/) {
  //const params: any = use(props.params);
  //const { locale } = params;
  
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
  const [LangLoading, setLangloading] = useState(true);
  let [settings, setSettings] = useState({
    lang: "",
    theme: "",
  });

  const locale = settings.lang;
  const [t, setT] = useState(() => (key: any) => key);
  useEffect(() => {
    setLangloading(true);
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
      setLangloading(false);
    }
    loadTranslations();
  }, [locale]);

  //دمج  الايقونات معا
  const Icons: any = {
    ...ant,
    ...fa6,
  };

  // to get user settings
  useEffect(() => {
    getSettings(userName).then((value) => {
      setSettings(value);
    });
  }, [userName]);

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
      {!LangLoading ? (
        <Row gutter={12}>
          {Object.keys(allBtns).map(
            (key: any) =>
              userPermissions[allBtns[key].title.toLowerCase()]?.View == 1 && (
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
                      {getDynamicIcon(allBtns[key].icon)} {t(allBtns[key].title)}
                    </Card>
                  </Link>
                </Col>
              )
          )}
        </Row>
      ) : (
        <div>
          <Card
            style={{ padding: "0", backgroundColor: "#0000", border: 0 }}
            loading={true}></Card>
        </div>
      )}
    </>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import initTranslations from "../i18n.js";
import { useEffect, useState, use } from "react";
import LanguageChanger from "./components/LanguageChanger";

export default function Home(props: any) {
  const params: any = use(props.params);
  let [settings, setSettings] = useState({
    lang: "",
    theme: "",
  });
  const router = useRouter();
  const { locale } = params;
  const [t, setT] = useState(() => (key: any) => key);
  useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
    }
    loadTranslations();
  }, [locale]);

  // Redirect to /dashboard on app load
  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <>
      {/* <p>Mostshar app</p>
      <p>{t("ok")}</p>

      <LanguageChanger /> */}
    </>
  );
}

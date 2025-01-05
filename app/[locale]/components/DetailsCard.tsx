import React, { useEffect, useRef } from "react";
import { Row, Col, Typography, Collapse, Button, Divider } from "antd";
import initTranslations from "../../i18n";
import { FaRegCopy } from "react-icons/fa6";
import { handlePrint } from "@/app/shared";
import { TbPrinter } from "react-icons/tb";

const { Paragraph, Text } = Typography;

interface DetailsCardProps {
  fieldsConfig: any[];
  recordData: any;
  locale: string;
  pageName: string;
}

export const DetailsCard = ({
  fieldsConfig,
  recordData,
  locale,
  pageName,
}: DetailsCardProps) => {
  const [t, setT] = React.useState(() => (key: string) => key);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && (event.key === "p" || event.key === "ح")) {
        event.preventDefault();
        handlePrint(ref, pageName, 14, locale);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [locale, pageName]);

  React.useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
    }
    loadTranslations();
  }, [locale]);

  const renderField = ({
    fieldName,
    label,
    type,
    fieldOptions,
    showDetails,
  }: any) => {
    if (!showDetails) return null;

    const displayedLabel =
      label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const value = recordData[fieldName];

    let displayedValue = value;

    if (type === "select" && fieldOptions) {
      const selectedOption = fieldOptions.find((option: any) => option.value === value);
      displayedValue = selectedOption ? selectedOption.label : value;
    }

    return (
      <Col key={fieldName} xs={24} sm={6} style={{ padding: 5, paddingTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong style={{ flexShrink: 0 }}>
            {t(displayedLabel)}:
          </Text>

          <Paragraph
            copyable={{
              icon: [
                <FaRegCopy
                  className='no_print'
                  key='copy-icon'
                  style={{ color: "gray", fontSize: "12px" }}
                />,
              ],
              tooltips: ["Copy", "Copied!"],
            }}
            style={{
              margin: 0,
              whiteSpace: "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}>
            {displayedValue}
          </Paragraph>
        </div>
      </Col>
    );
  };

  return (
    <Collapse
      ref={ref}
      defaultActiveKey={["1"]}
      className='responsive-card'
      size='small'
      items={[
        {
          key: "1",
          label: t("Details"),
          children: (
            <>
              <Row>
                {fieldsConfig.map((field) =>
                  renderField({
                    ...field,
                    value: recordData[field.fieldName],
                    fieldOptions: field.options,
                  })
                )}
              </Row>

              <Divider />
              <div style={{ textAlign: "right", direction: "rtl" }}>
                <Button
                  className='no_print'
                  type='default'
                  shape='circle'
                  size='small'
                  style={{ marginLeft: 5 }}
                  title={t("Print")}
                  icon={<TbPrinter />}
                  onClick={() => handlePrint(ref, pageName, 12, locale)}
                />
              </div>
            </>
          ),
        },
      ]}
    />
  );
};

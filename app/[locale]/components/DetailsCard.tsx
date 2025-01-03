import React from "react";
import { Row, Col, Typography, Collapse } from "antd";
import initTranslations from "../../i18n";
import { FaRegCopy } from "react-icons/fa6";

const { Paragraph, Text } = Typography;

interface DetailsCardProps {
  fieldsConfig: any[];
  recordData: any;
  locale: string;
}

export const DetailsCard = ({ fieldsConfig, recordData, locale }: DetailsCardProps) => {
  const [t, setT] = React.useState(() => (key: string) => key);

  React.useEffect(() => {
    async function loadTranslations() {
      const { t } = await initTranslations(locale, ["common"]);
      setT(() => t);
    }
    loadTranslations();
  }, [locale]);

  const renderField = ({ fieldName, label, type, fieldOptions }: any) => {
    const displayedLabel =
      label || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const value = recordData[fieldName];

    let displayedValue = value;

    if (type === "select" && fieldOptions) {
      const selectedOption = fieldOptions.find((option: any) => option.value === value);
      displayedValue = selectedOption ? selectedOption.label : value;
    }

    return (
        <Col key={fieldName} xs={24} sm={6} style={{ padding: 5 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Text strong style={{padding:5}}>{t(displayedLabel)}: </Text>
            <Paragraph
              copyable={{
                icon: [<FaRegCopy key='copy-icon' style={{ color: "gray" ,fontSize: "10px" }} />],
              }}
              style={{ margin: 0 }} // Remove margin to align properly
            >
              {displayedValue}
            </Paragraph>
          </div>
        </Col>
      );
  };

  return (
    <Collapse
      defaultActiveKey={["1"]}
      className='responsive-card'
      size='small'
      items={[
        {
          key: "1",
          label: t("Details"),
          children: (
            <>
              <Row >
                {fieldsConfig.map((field) => renderField(field))}
              </Row>
            </>
          ),
        },
      ]}
    />
  );
};

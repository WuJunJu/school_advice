import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Typography,
  Modal,
  Result,
  Card,
  Row,
  Col,
  Divider,
  Checkbox,
} from 'antd';
import { SendOutlined, SmileOutlined } from '@ant-design/icons';
import { getDepartments } from '../api/departments';
import type { Department } from '../api/departments';
import { submitSuggestion } from '../api/suggestions';
import type { SuggestionSubmission } from '../api/suggestions';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const SubmitSuggestionPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Failed to fetch departments', error);
      }
    };
    fetchDepartments();
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const submissionData: SuggestionSubmission = {
        ...values,
        department_id: Number(values.department_id),
        is_public: values.is_public || false,
      };
      const response = await submitSuggestion(submissionData);
      setTrackingCode(response.tracking_code);
      form.resetFields();
    } catch (error) {
      console.error('Submission failed', error);
      Modal.error({
        title: '提交失败',
        content: '抱歉，您的建议未能成功提交，请稍后再试。',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center">
      <Col xs={24} sm={24} md={20} lg={16} xl={12}>
        <Card>
          {trackingCode ? (
            <Result
              icon={<SmileOutlined />}
              title="提交成功！"
              subTitle={
                <>
                  <Paragraph>
                    感谢您的宝贵建议！我们已经收到您的提交。
                  </Paragraph>
                  <Paragraph>
                    您的建议查询码是: <Text strong copyable>{trackingCode}</Text>
                  </Paragraph>
                  <Paragraph>
                    请妥善保管此查询码，您可以随时使用它来查询建议的处理进度和回复。
                  </Paragraph>
                </>
              }
              extra={[
                <Button type="primary" key="continue" onClick={() => setTrackingCode(null)}>
                  提交另一条建议
                </Button>,
              ]}
            />
          ) : (
            <>
              <Typography>
                <Title level={4}>提交您的宝贵建议</Title>
                <Paragraph>
                  我们重视每一位同学的声音。请填写以下表单，您的建议将直达相关部门，帮助我们把学校建设得更好。
                </Paragraph>
              </Typography>
              <Divider />
              <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item
                  label="标题"
                  name="title"
                  rules={[{ required: true, message: '请输入一个明确的标题' }]}
                >
                  <Input placeholder="例如：关于增加图书馆自习座位的建议" />
                </Form.Item>
                <Form.Item
                  label="详细内容"
                  name="content"
                  rules={[{ required: true, message: '请详细描述您的建议' }]}
                >
                  <Input.TextArea rows={6} placeholder="请详细说明您的建议、问题或想法，以便相关部门更好地理解和处理。" />
                </Form.Item>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="目标部门"
                      name="department_id"
                      rules={[{ required: true, message: '请选择一个目标部门' }]}
                    >
                      <Select placeholder="请选择负责处理该建议的部门">
                        {departments.map((dep) => (
                          <Option key={dep.ID} value={dep.ID}>
                            {dep.Name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="建议分类" name="category">
                      <Input placeholder="例如：教学设施、课程安排、生活后勤等" />
                    </Form.Item>
                  </Col>
                </Row>
                <Divider>选填信息（有助于我们更好地与您联系）</Divider>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="您的姓名" name="submitter_name">
                      <Input placeholder="您的姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="您的班级" name="submitter_class">
                      <Input placeholder="例如：软件工程2101班" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="is_public"
                  valuePropName="checked"
                  help="为了让更多同学了解建议处理情况，我们鼓励您将建议和处理结果公开。公开内容将匿名处理。"
                >
                  <Checkbox>同意在建议处理完成后公示（匿名）</Checkbox>
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                    size="large"
                    block
                  >
                    提交建议
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default SubmitSuggestionPage; 
import React, { useState, useEffect } from 'react';
import {
  Layout,
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
  Tabs,
  Space,
  Checkbox,
  Menu, // Import Menu
} from 'antd';
import {
  SendOutlined,
  SearchOutlined,
  SmileOutlined,
  GlobalOutlined, // Import icon
} from '@ant-design/icons';
import axios from 'axios';
import { getDepartments } from '../api/departments';
import type { Department } from '../api/departments';
import { submitSuggestion, getSuggestionByCode } from '../api/suggestions';
import type { SuggestionSubmission } from '../api/suggestions';
import { Link } from 'react-router-dom'; // Import Link

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const HomePage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('submit');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);

  const menuItems = [
    {
      key: 'home',
      label: <Link to="/">提交建议</Link>,
    },
    {
      key: 'public',
      label: (
        <Link to="/public-suggestions">
          <Space>
            <GlobalOutlined />
            反馈公示
          </Space>
        </Link>
      ),
    },
  ];

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
        is_public: values.is_public || false, // Ensure is_public is always present
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

  const onSearch = async (values: { code: string }) => {
    const { code } = values;
    if (!code) return;
    setQueryLoading(true);
    try {
      const suggestion = await getSuggestionByCode(code);
      console.log('API 成功返回的数据:', suggestion); // 最终诊断日志
      setCurrentSuggestion(suggestion);
      setIsModalVisible(true);
      queryForm.resetFields();
    } catch (error) {
      console.error("查询建议时出错:", error); 

      let errorMessage = '查询时遇到未知错误，请稍后再试。';
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        errorMessage = '我们未能找到该查询码对应的建议。请您仔细核对是否输入正确，特别是区分大小写或包含空格。';
      } else if (axios.isAxiosError(error)) {
        errorMessage = `查询失败，服务器返回了错误: ${error.message}`;
      }
      
      Modal.error({
        title: '查询失败',
        content: errorMessage,
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setCurrentSuggestion(null);
  };

  const renderSubmitForm = () => (
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
          <Form.Item label="您的姓名" name="name">
            <Input placeholder="您的姓名" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="您的班级" name="class_name">
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
  );

  const renderQueryForm = () => (
    <Form form={queryForm} layout="vertical">
      <Form.Item
        name="code"
        label="您的建议查询码"
        rules={[{ required: true, message: '查询码不能为空' }]}
      >
        <Input placeholder="请输入提交建议后获得的查询码" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          onClick={() => {
            queryForm.validateFields()
              .then(values => {
                onSearch(values);
              })
              .catch(info => {
                console.log('表单验证失败:', info);
              });
          }}
          loading={queryLoading}
          icon={<SearchOutlined />}
          size="large"
          block
        >
          查询进度
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'submit',
      label: '我有建议要提交',
      children: (
        <>
          <Typography>
            <Title level={4}>提交您的宝贵建议</Title>
            <Paragraph>
              我们重视每一位同学的声音。请填写以下表单，您的建议将直达相关部门，帮助我们把学校建设得更好。
            </Paragraph>
          </Typography>
          <Divider />
          {renderSubmitForm()}
        </>
      ),
    },
    {
      key: 'query',
      label: '查询我的建议',
      children: (
        <>
          <Typography>
            <Title level={4}>查询建议处理进度</Title>
            <Paragraph>
              如果您已提交建议，可在此处输入查询码来跟踪处理状态和官方回复。
            </Paragraph>
          </Typography>
          <Divider />
          {renderQueryForm()}
        </>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ color: '#002140', fontSize: '20px', fontWeight: 'bold' }}>
          校园建议箱
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          items={menuItems}
          style={{ lineHeight: '64px', borderBottom: 'none', marginLeft: 'auto' }}
        />
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 64 }}>
        <Row justify="center" style={{ marginTop: '2rem' }}>
          <Col xs={24} sm={24} md={20} lg={16} xl={12}>
            {trackingCode ? (
              <Result
                icon={<SmileOutlined />}
                status="success"
                title="建议提交成功！"
                subTitle={
                  <Paragraph>
                    您的查询码是：<Text strong copyable>{trackingCode}</Text>
                    。请妥善保管，它是您查询建议处理进度的唯一凭证。
                  </Paragraph>
                }
                extra={[
                  <Button type="primary" key="back" onClick={() => setTrackingCode(null)}>
                    提交新建议
                  </Button>,
                  <Button key="query" onClick={() => {
                    setTrackingCode(null);
                    setActiveTab('query');
                    queryForm.setFieldsValue({ code: trackingCode });
                  }}>
                    立即查询进度
                  </Button>,
                ]}
              />
            ) : (
              <Card>
                <Tabs 
                  items={tabItems}
                  activeKey={activeTab} 
                  onChange={setActiveTab} 
                  centered 
                />
              </Card>
            )}
          </Col>
        </Row>
      </Content>
      {currentSuggestion && (
        <Modal
            title={
                <Space>
                    <SearchOutlined />
                    <Text>建议详情 (查询码: {currentSuggestion.TrackingCode})</Text>
                </Space>
            }
            open={isModalVisible}
            onCancel={handleModalClose}
            footer={[
                <Button key="back" onClick={handleModalClose}>
                    关闭
                </Button>,
            ]}
            width="60%"
        >
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 16px' }}>
                <Title level={4}>{currentSuggestion?.Title || '无标题'}</Title>
                <Paragraph>
                    <Text strong>状态:</Text> {currentSuggestion?.Status || '未知'}
                    <Divider type="vertical" />
                    <Text strong>部门:</Text> {currentSuggestion?.Department?.Name || '未分配'}
                </Paragraph>
                <Paragraph>
                    <Text strong>分类:</Text> {currentSuggestion?.Category || '未分类'}
                    <Divider type="vertical" />
                    <Text strong>提交时间:</Text> {currentSuggestion?.CreatedAt ? new Date(currentSuggestion.CreatedAt).toLocaleString() : '未知'}
                </Paragraph>
                {(currentSuggestion?.Name || currentSuggestion?.ClassName) && (
                    <Paragraph>
                        {currentSuggestion.Name && <><Text strong>提交人:</Text> {currentSuggestion.Name}</>}
                        {currentSuggestion.Name && currentSuggestion.ClassName && <Divider type="vertical" />}
                        {currentSuggestion.ClassName && <><Text strong>班级:</Text> {currentSuggestion.ClassName}</>}
                    </Paragraph>
                )}
                
                <Divider />

                <div>
                    <Title level={5}>建议内容</Title>
                    <Paragraph>{currentSuggestion?.Content || '无内容'}</Paragraph>
                </div>
                
                {currentSuggestion?.Replies && currentSuggestion.Replies.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <Title level={5}>官方回复</Title>
                    {currentSuggestion.Replies.map((reply: any) => (
                    <Card key={reply.ID} style={{ marginTop: 16 }} bordered={false} bodyStyle={{backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                        <Paragraph style={{ marginBottom: 8 }}>{reply?.Content || '无回复内容'}</Paragraph>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                        回复人: {reply?.Replier?.Username || '系统'} | 时间:{' '}
                        {reply?.CreatedAt ? new Date(reply.CreatedAt).toLocaleString() : '未知时间'}
                        </Text>
                    </Card>
                    ))}
                </div>
                )}
            </div>
        </Modal>
      )}
    </Layout>
  );
};

export default HomePage; 
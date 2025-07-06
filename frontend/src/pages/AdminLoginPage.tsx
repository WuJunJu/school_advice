import React from 'react';
import { Form, Input, Button, Card, Layout, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import type { LoginCredentials } from '../api/auth';

const { Content } = Layout;
const { Title, Text } = Typography;

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: LoginCredentials) => {
    try {
      const response = await login(values);
      localStorage.setItem('admin_token', response.token);
      message.success('登录成功!');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error('登录失败，请检查您的用户名和密码。');
    }
  };

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
        <Card style={{ 
          maxWidth: 400, 
          width: '100%',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Space direction="vertical" size="small">
              <MessageOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <Title level={3}>学生建议反馈平台</Title>
              <Text type="secondary">管理后台</Text>
            </Space>
          </div>
          <Form
            name="admin_login"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="管理员用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large">
                安全登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLoginPage; 
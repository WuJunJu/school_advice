import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Breadcrumb, theme } from 'antd';
import {
  PieChartOutlined,
  SolutionOutlined,
  TeamOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  UserOutlined,
  HomeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';

import SuggestionManagement from './admin/SuggestionManagement';
import UserManagement from './admin/UserManagement';
import DepartmentManagement from './admin/DepartmentManagement';
import DashboardHome from './admin/DashboardHome';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

interface DecodedToken {
  username: string;
  role: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<DecodedToken | null>(null);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      const decodedToken = jwtDecode<DecodedToken>(token);
      setUser(decodedToken);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: <Link to="/admin/dashboard">仪表盘</Link> },
    { key: 'suggestions', icon: <SolutionOutlined />, label: <Link to="/admin/dashboard/suggestions">建议管理</Link> },
    user?.role === 'super_admin' && { key: 'users', icon: <TeamOutlined />, label: <Link to="/admin/dashboard/users">用户管理</Link> },
    user?.role === 'super_admin' && { key: 'departments', icon: <AppstoreOutlined />, label: <Link to="/admin/dashboard/departments">部门管理</Link> },
  ].filter(Boolean);

  const selectedKeys = [location.pathname.split('/').pop() || 'dashboard'];
  
  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const pathSnippets = location.pathname.split('/').filter(i => i);
  const breadcrumbNameMap: { [key: string]: string } = {
    'admin': '管理后台',
    'dashboard': '仪表盘',
    'suggestions': '建议管理',
    'users': '用户管理',
    'departments': '部门管理',
  };
  const breadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const name = breadcrumbNameMap[pathSnippets[index]];
    return (
      <Breadcrumb.Item key={url}>
        <Link to={url}>{name}</Link>
      </Breadcrumb.Item>
    );
  });


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme="dark">
        <div style={{ 
          height: '64px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <MessageOutlined style={{color: '#fff', fontSize: '24px'}}/>
          <Title level={4} style={{ color: 'white', margin: 0 }}>建议平台</Title>
        </div>
        <Menu theme="dark" selectedKeys={selectedKeys} mode="inline" items={menuItems as any} />
      </Sider>
      <Layout style={{ background: '#f5f7fa' }}>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                {/* Can be used for page titles later */}
            </div>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <a onClick={e => e.preventDefault()} style={{cursor: 'pointer'}}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span>{user?.username}</span>
                </Space>
              </a>
            </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <Breadcrumb style={{ margin: '0 0 16px 0' }}>
            {breadcrumbItems}
          </Breadcrumb>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="suggestions" element={<SuggestionManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="departments" element={<DepartmentManagement />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboardPage; 
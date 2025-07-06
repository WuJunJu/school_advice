import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { GlobalOutlined, FormOutlined, SearchOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

const AppLayout: React.FC = () => {
  const location = useLocation();

  // Determine the selected key, defaulting to /public-suggestions for the root path
  const selectedKey = location.pathname === '/' ? '/public-suggestions' : location.pathname;

  const menuItems = [
    {
      key: '/public-suggestions',
      icon: <GlobalOutlined />,
      label: <Link to="/public-suggestions">反馈公示</Link>,
    },
    {
      key: '/submit-suggestion',
      icon: <FormOutlined />,
      label: <Link to="/submit-suggestion">我有建议要提交</Link>,
    },
    {
      key: '/query-suggestion',
      icon: <SearchOutlined />,
      label: <Link to="/query-suggestion">查询我的建议</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '24px',
            color: '#002140',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          校园建议箱
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{
            lineHeight: '64px',
            borderBottom: 'none',
            backgroundColor: 'transparent',
            minWidth: '500px', // Prevent menu from collapsing
          }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AppLayout; 
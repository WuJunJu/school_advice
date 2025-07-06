import React, { useState, useEffect } from 'react';
import { Layout, List, Card, Typography, Select, Pagination, Button, message, Row, Col } from 'antd';
import { LikeOutlined } from '@ant-design/icons';
import { getPublicSuggestions, upvoteSuggestion } from '../api/suggestions';
import { getDepartments } from '../api/departments';
import type { Department } from '../api/departments';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { Option } = Select;

interface Suggestion {
  ID: number;
  Title: string;
  Content: string;
  Status: string;
  Upvotes: number;
  CreatedAt: string;
  Department: Department;
}

const BoardPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | undefined>(undefined);

  const pageSize = 10;

  const fetchSuggestions = async (page: number, departmentId?: number) => {
    setLoading(true);
    try {
      const response = await getPublicSuggestions({ page, pageSize, department_id: departmentId });
      setSuggestions(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error('无法加载建议列表');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(currentPage, selectedDept);
  }, [currentPage, selectedDept]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        message.error('无法加载部门列表');
      }
    };
    fetchDepartments();
  }, []);

  const handleUpvote = async (id: number) => {
    try {
      await upvoteSuggestion(id);
      message.success('感谢您的支持！');
      // Refresh the list to show new upvote count
      fetchSuggestions(currentPage, selectedDept);
    } catch (error) {
      message.error('操作失败，请稍后再试');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ color: 'white', padding: '0 24px' }}>建议广场</Header>
      <Content style={{ padding: '24px' }}>
        <Row justify="center">
          <Col span={24} lg={22} xl={20}>
            <Card>
              <Title level={2}>公开建议列表</Title>
              <Paragraph>在这里查看已公开的建议和学校的官方回复。</Paragraph>
              
              <Select
                placeholder="按部门筛选"
                style={{ width: 200, marginBottom: 20 }}
                onChange={(value) => setSelectedDept(value)}
                allowClear
              >
                {departments.map(dep => <Option key={dep.ID} value={dep.ID}>{dep.Name}</Option>)}
              </Select>

              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
                dataSource={suggestions}
                loading={loading}
                renderItem={item => (
                  <List.Item>
                    <Card
                      title={item.Title}
                      actions={[
                        <Button icon={<LikeOutlined />} onClick={() => handleUpvote(item.ID)}>
                          {item.Upvotes}
                        </Button>
                      ]}
                    >
                      <Paragraph><strong>部门:</strong> {item.Department.Name}</Paragraph>
                      <Paragraph><strong>状态:</strong> {item.Status}</Paragraph>
                      <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}>
                        {item.Content}
                      </Paragraph>
                      <small>{new Date(item.CreatedAt).toLocaleString()}</small>
                    </Card>
                  </List.Item>
                )}
              />
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                style={{ marginTop: 20, textAlign: 'center' }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default BoardPage; 
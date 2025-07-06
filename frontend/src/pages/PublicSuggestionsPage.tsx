import React, { useState, useEffect } from 'react';
import { Layout, Typography, List, Card, Select, Spin, Empty, Tag, Space, Pagination, Divider } from 'antd';
import { getPublicSuggestions } from '../api/suggestions';
import { getDepartments } from '../api/departments';
import type { Department } from '../api/departments';
import { MessageOutlined, CalendarOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const PublicSuggestionsPage: React.FC = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchSuggestions = async (page: number, pageSize: number, departmentId?: number) => {
        setLoading(true);
        try {
            const data = await getPublicSuggestions({ page, pageSize, department_id: departmentId });
            setSuggestions(data.data);
            setPagination({
                current: data.page,
                pageSize: data.page_size,
                total: data.total,
            });
        } catch (error) {
            console.error('Failed to fetch public suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const depts = await getDepartments();
                setDepartments(depts);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            }
            fetchSuggestions(pagination.current, pagination.pageSize, selectedDepartment);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchSuggestions(pagination.current, pagination.pageSize, selectedDepartment);
    }, [selectedDepartment, pagination.current, pagination.pageSize]);

    const handleDepartmentChange = (value: number | undefined) => {
        setSelectedDepartment(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handlePageChange = (page: number, pageSize?: number) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: pageSize || prev.pageSize,
        }));
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '50px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
                    <Title level={2}>反馈公示墙</Title>
                    <Paragraph>
                        这里展示了同学们授权公开的建议及其处理结果。我们相信，透明的沟通能促进更好的校园共建。
                    </Paragraph>

                    <Select
                        allowClear
                        placeholder="按部门筛选"
                        style={{ width: 200, marginBottom: 24 }}
                        onChange={handleDepartmentChange}
                        value={selectedDepartment}
                    >
                        {departments.map(dep => (
                            <Option key={dep.ID} value={dep.ID}>{dep.Name}</Option>
                        ))}
                    </Select>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            {suggestions.length > 0 ? (
                                <List
                                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                                    dataSource={suggestions}
                                    renderItem={(item: any) => (
                                        <List.Item>
                                            <Card
                                                title={item.Title}
                                                bordered={false}
                                                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
                                                extra={<Tag color="blue">{item.Department.Name}</Tag>}
                                            >
                                                <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}>
                                                    {item.Content}
                                                </Paragraph>
                                                <Divider />
                                                {item.Replies && item.Replies.length > 0 ? (
                                                    <div>
                                                        <Title level={5}>部门回复</Title>
                                                        {item.Replies.map((reply: any) => (
                                                            <Card key={reply.ID} type="inner" size="small" style={{ marginTop: 10 }}>
                                                                <Paragraph>{reply.Content}</Paragraph>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    {reply.Replier.Username} 回复于 {new Date(reply.CreatedAt).toLocaleDateString()}
                                                                </Text>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <Text type="secondary">暂无回复</Text>
                                                )}
                                                <Divider />
                                                <Space>
                                                    <Tag color={item.Status === '已解决' ? 'success' : 'default'}>{item.Status}</Tag>
                                                    <Space align="center">
                                                        <CalendarOutlined />
                                                        <Text type="secondary">{new Date(item.CreatedAt).toLocaleDateString()}</Text>
                                                    </Space>
                                                </Space>
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty description="暂无公开的建议" />
                            )}
                            <Pagination
                                style={{ marginTop: 24, textAlign: 'right' }}
                                current={pagination.current}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                onChange={handlePageChange}
                                showSizeChanger
                            />
                        </>
                    )}
                </div>
            </Content>
        </Layout>
    );
};

export default PublicSuggestionsPage; 
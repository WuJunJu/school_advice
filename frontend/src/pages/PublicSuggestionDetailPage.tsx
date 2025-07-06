import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Card, Spin, Alert, Tag, Divider, Space, Empty, Breadcrumb } from 'antd';
import { getSuggestionByCode } from '../api/suggestions';
import { HomeOutlined, ProfileOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const PublicSuggestionDetailPage: React.FC = () => {
    const { trackingCode } = useParams<{ trackingCode: string }>();
    const [suggestion, setSuggestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (!trackingCode) return;
            setLoading(true);
            try {
                const data = await getSuggestionByCode(trackingCode);
                setSuggestion(data);
                setError(null);
            } catch (err) {
                setError('无法找到该建议，请检查查询码是否正确。');
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestion();
    }, [trackingCode]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <Alert message="错误" description={error} type="error" showIcon />;
    }

    if (!suggestion) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Empty description="没有找到建议详情" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '24px' }}>
            <Breadcrumb style={{ marginBottom: 24 }}>
                <Breadcrumb.Item>
                    <Link to="/"><HomeOutlined /></Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to="/public-suggestions"><BulbOutlined /><span>反馈公示墙</span></Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item><ProfileOutlined /><span>建议详情</span></Breadcrumb.Item>
            </Breadcrumb>
            
            <Card>
                <Title level={3}>{suggestion.Title}</Title>
                <Space wrap style={{ marginBottom: 16 }}>
                    <Tag color="blue">{suggestion.Department.Name}</Tag>
                    <Tag color={suggestion.Status === '已解决' ? 'success' : 'processing'}>{suggestion.Status}</Tag>
                    <Text type="secondary">查询码: {suggestion.TrackingCode}</Text>
                    <Text type="secondary">创建于: {new Date(suggestion.CreatedAt).toLocaleString()}</Text>
                </Space>
                <Divider />

                <Title level={5}>建议内容</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{suggestion.Content}</Paragraph>
                
                <Divider />
                
                <Title level={5}>部门回复</Title>
                {suggestion.Replies && suggestion.Replies.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {suggestion.Replies.map((reply: any) => (
                            <Card key={reply.ID} type="inner">
                                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{reply.Content}</Paragraph>
                                <Text type="secondary" style={{ fontSize: '12px', textAlign: 'right', display: 'block' }}>
                                    -- {reply.Replier.Username} 回复于 {new Date(reply.CreatedAt).toLocaleString()}
                                </Text>
                            </Card>
                        ))}
                    </Space>
                ) : (
                    <Text type="secondary">暂无回复。</Text>
                )}
            </Card>
        </div>
    );
};

export default PublicSuggestionDetailPage; 
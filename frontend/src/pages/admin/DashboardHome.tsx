import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, message } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpOutlined, CheckCircleOutlined, ClockCircleOutlined, ContainerOutlined } from '@ant-design/icons';
import { getDashboardStats } from '../../api/admin';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const DashboardHome: React.FC = () => {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        // The backend weekly_trend returns 'date', but recharts needs 'name'
        // We also need to format the date for better readability and sort it chronologically
        const sortedTrend = [...data.weekly_trend].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const formattedTrend = sortedTrend.map((d: any) => ({
          ...d,
          name: new Date(d.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
        }));
        // The backend suggestions_by_dept returns 'department_name', but recharts needs 'name'
        const formattedDepts = data.suggestions_by_dept.map((d: any) => ({
          name: d.department_name,
          value: d.count,
        }));
        setStatsData({ ...data, weekly_trend: formattedTrend, suggestions_by_dept: formattedDepts });
      } catch (error) {
        message.error('无法加载仪表盘数据');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !statsData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>数据仪表盘</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总建议数"
              value={statsData.total_suggestions}
              prefix={<ContainerOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核"
              value={statsData.pending_suggestions}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="处理中"
              value={statsData.processing_suggestions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ArrowUpOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已解决率"
              value={statsData.resolution_rate}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="本周建议趋势">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={statsData.weekly_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="new" name="新增建议" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="resolved" name="解决建议" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="各部门建议分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statsData.suggestions_by_dept}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statsData.suggestions_by_dept.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardHome; 
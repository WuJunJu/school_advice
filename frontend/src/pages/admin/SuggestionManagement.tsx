import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Modal, Form, Input, message, Space, Card, Row, Col, Typography, Tag, Descriptions, List, Avatar, Radio } from 'antd';
import {
  getAdminSuggestions,
  updateSuggestionStatus,
  addSuggestionReply,
  getSuggestionDetails,
  deleteSuggestions,
} from '../../api/admin';
import type { Department } from '../../api/departments';
import { getDepartments } from '../../api/departments';
import { ReloadOutlined, MessageOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const statusColors: { [key: string]: string } = {
  "待审核": "gold",
  "待处理": "orange",
  "处理中": "blue",
  "已解决": "green",
  "已关闭": "red",
  "审核不通过": "magenta",
};


const SuggestionManagement: React.FC = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<{ department_id?: number }>({});
  const [view, setView] = useState('待审核'); // '待审核' or '已审核'
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form] = Form.useForm();

  const statusOptions = ["待处理", "处理中", "已解决", "已关闭", "审核不通过"];
  
  const fetchSuggestions = async (page = 1, currentView = view, currentFilters = filters) => {
    setLoading(true);
    try {
      const response = await getAdminSuggestions({
        page: page,
        pageSize: pagination.pageSize,
        status: currentView,
        ...currentFilters,
      });
      setSuggestions(response.data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.total,
      }));
    } catch (error) {
      message.error('无法加载建议列表');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDepartments = async () => {
    try {
        const data = await getDepartments();
        setDepartments(data);
    } catch (error) {
        message.error('无法加载部门列表');
    }
  }

  useEffect(() => {
    fetchSuggestions(1, view, filters);
  }, [view, filters]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchSuggestions(newPagination.current, view, filters);
  };
  
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) {
      delete (newFilters as any)[key];
    }
    setFilters(newFilters);
  }

  const handleStatusChange = async (suggestionId: number, status: string) => {
    try {
      await updateSuggestionStatus(suggestionId, status);
      message.success('状态更新成功');
      // Refetch current view
      fetchSuggestions(pagination.current, view, filters);
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一项建议进行删除');
      return;
    }
    try {
      await deleteSuggestions(selectedRowKeys as number[]);
      message.success('成功删除所选建议');
      setSelectedRowKeys([]);
      fetchSuggestions(1, view, filters); // Refresh data from the first page
    } catch (error) {
      message.error('删除建议失败');
    }
  };
  
  const showReplyModal = async (suggestion: any) => {
    try {
      const details = await getSuggestionDetails(suggestion.ID);
      setSelectedSuggestion(details);
      setIsModalVisible(true);
    } catch (error) {
      message.error('无法获取建议详情');
    }
  };
  
  const handleReplySubmit = async (values: { content: string }) => {
    if (!selectedSuggestion) return;
    try {
      await addSuggestionReply(selectedSuggestion.ID, values.content);
      message.success('回复成功');
      // refetch details to show new reply
      const details = await getSuggestionDetails(selectedSuggestion.ID);
      setSelectedSuggestion(details);
      form.resetFields();
    } catch (error) {
      message.error('回复失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'Title', key: 'title', width: 250 },
    { title: '提交人', dataIndex: 'SubmitterName', key: 'submitter', render: (name: string) => name || '匿名' },
    {
      title: '部门',
      dataIndex: 'Department',
      key: 'department',
      render: (department: { Name: string }) => (department && department.Name ? department.Name : '全部部门'),
    },
    { 
      title: '状态', 
      dataIndex: 'Status', 
      key: 'status', 
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      )
    },
    { title: '创建时间', dataIndex: 'CreatedAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 250,
      render: (_: any, record: any) => {
        if (view === '待审核') {
          return (
            <Space size="middle">
              <Button type="primary" size="small" onClick={() => handleStatusChange(record.ID, '待处理')}>批准</Button>
              <Button danger size="small" onClick={() => handleStatusChange(record.ID, '审核不通过')}>驳回</Button>
              <Button type="link" size="small" onClick={() => showReplyModal(record)}>查看详情</Button>
            </Space>
          )
        }
        return (
          <Space size="middle">
              <Select defaultValue={record.Status} style={{ width: 120 }} onChange={(value) => handleStatusChange(record.ID, value)} size="small">
                  {statusOptions.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
              </Select>
              <Button type="link" onClick={() => showReplyModal(record)}>查看/回复</Button>
          </Space>
        )
      },
    },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  
  const renderModalContent = () => {
    if (!selectedSuggestion) return null;

    return (
        <div>
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="标题">{selectedSuggestion.Title}</Descriptions.Item>
                <Descriptions.Item label="分类">{selectedSuggestion.Category || '无'}</Descriptions.Item>
                <Descriptions.Item label="提交人">{selectedSuggestion.SubmitterName || '匿名'}</Descriptions.Item>
                <Descriptions.Item label="提交班级">{selectedSuggestion.SubmitterClass || '无'}</Descriptions.Item>
                <Descriptions.Item label="内容">{selectedSuggestion.Content}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>回复列表</Title>
            {selectedSuggestion.Replies?.length > 0 ? (
                <List
                    className="comment-list"
                    itemLayout="horizontal"
                    dataSource={selectedSuggestion.Replies}
                    renderItem={(item: any) => (
                        <List.Item>
                           <Space align="start" style={{ width: '100%' }}>
                                <Avatar>{item.Replier.Username[0]}</Avatar>
                                <div style={{ flex: 1 }}>
                                    <Space>
                                        <Text strong>{item.Replier.Username}</Text>
                                        <Text type="secondary">{new Date(item.CreatedAt).toLocaleString()}</Text>
                                    </Space>
                                    <Paragraph style={{ margin: '8px 0 0 0' }}>{item.Content}</Paragraph>
                                </div>
                            </Space>
                        </List.Item>
                    )}
                />
            ) : (
                <Text>暂无官方回复。</Text>
            )}

            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>添加新回复</Title>
             <Space align="start" style={{ width: '100%' }}>
                <Avatar>我</Avatar>
                <div style={{ flex: 1 }}>
                    <Form form={form} onFinish={handleReplySubmit}>
                        <Form.Item name="content" style={{marginBottom: 8}} rules={[{ required: true, message: "回复内容不能为空" }]}>
                            <Input.TextArea rows={4} placeholder="输入您的回复..." />
                        </Form.Item>
                        <Form.Item style={{marginBottom: 0}}>
                            <Button htmlType="submit" type="primary">
                                提交回复
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Space>
        </div>
    )
  }

  return (
    <Card>
      <Title level={4}>建议管理</Title>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Radio.Group value={view} onChange={e => setView(e.target.value)}>
            <Radio.Button value="待审核">待审核</Radio.Button>
            <Radio.Button value="已审核">已审核</Radio.Button>
          </Radio.Group>
        </Col>
        <Col>
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="按部门筛选"
              allowClear
              onChange={(value) => handleFilterChange('department_id', value)}
            >
              {departments.map(d => <Option key={d.ID} value={d.ID}>{d.Name}</Option>)}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchSuggestions(1, view, filters)}>刷新</Button>
            {selectedRowKeys.length > 0 && (
              <Button type="primary" danger onClick={handleBulkDelete}>
                删除选中 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        </Col>
      </Row>
      <Table
        rowKey="ID"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={suggestions}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        title={
            <Space>
                <MessageOutlined />
                查看与回复
            </Space>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {renderModalContent()}
      </Modal>
    </Card>
  );
};

export default SuggestionManagement; 
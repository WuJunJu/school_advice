import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card, Typography, Popconfirm } from 'antd';
import {
  getDepartmentsAdmin,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../api/admin';
import { AppstoreOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await getDepartmentsAdmin();
      setDepartments(response);
    } catch (error) {
      message.error('无法加载部门列表');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingDept) {
        await updateDepartment(editingDept.ID, values);
        message.success('部门更新成功');
      } else {
        await createDepartment(values);
        message.success('部门创建成功');
      }
      setIsModalVisible(false);
      setEditingDept(null);
      fetchDepartments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDepartment(id);
      message.success('部门删除成功');
      fetchDepartments();
    } catch (error) {
      message.error('删除失败，请确保没有管理员属于该部门');
    }
  };

  const showModal = (dept: any = null) => {
    setEditingDept(dept);
    form.setFieldsValue(dept ? { name: dept.Name } : { name: '' });
    setIsModalVisible(true);
  };
  
  const columns = [
    { title: 'ID', dataIndex: 'ID', key: 'id', width: 100 },
    { title: '部门名称', dataIndex: 'Name', key: 'name' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除该部门吗?"
            onConfirm={() => handleDelete(record.ID)}
            okText="确定"
            cancelText="取消"
            placement="topRight"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>部门管理</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          创建部门
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchDepartments}>刷新</Button>
      </Space>
      <Table columns={columns} dataSource={departments} rowKey="ID" loading={loading} />
      <Modal
        title={
          <Space>
            {editingDept ? <EditOutlined /> : <PlusOutlined />}
            {editingDept ? '编辑部门' : '创建新部门'}
          </Space>
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="departmentForm" preserve={false}>
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '部门名称不能为空' }]}>
            <Input prefix={<AppstoreOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManagement; 
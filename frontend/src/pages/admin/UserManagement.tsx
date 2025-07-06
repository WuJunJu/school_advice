import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Space, Card, Typography, Tag, Popconfirm } from 'antd';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api/admin';
import { getDepartments } from '../../api/departments';
import type { Department } from '../../api/departments';
import { UserOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

const roleColors: { [key: string]: string } = {
  "super_admin": "volcano",
  "admin": "geekblue",
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAdmins();
      setUsers(response);
    } catch (error) {
      message.error('无法加载用户列表');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDepts = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response);
    } catch(e) {
      message.error("无法加载部门列表");
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchDepts();
  }, []);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        // Password is not sent when editing unless a new one is provided
        if (values.Password === '') {
          delete values.Password;
        }
        await updateAdmin(editingUser.ID, values);
        message.success('用户更新成功');
      } else {
        await createAdmin(values);
        message.success('用户创建成功');
      }
      setIsModalVisible(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAdmin(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const showModal = (user: any = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({...user, Password: ''}); // Clear password field for editing
    } else {
      form.resetFields();
      form.setFieldsValue({ CanViewAll: false, Role: 'admin' });
    }
    setIsModalVisible(true);
  };
  
  const columns = [
    { title: '用户名', dataIndex: 'Username', key: 'username', render: (text: string) => <Space><UserOutlined />{text}</Space> },
    { 
      title: '角色', 
      dataIndex: 'Role', 
      key: 'role', 
      render: (role: string) => <Tag color={roleColors[role] || 'default'}>{role}</Tag> 
    },
    { 
      title: '所属部门', 
      dataIndex: ['Department', 'Name'], 
      key: 'department',
      render: (name: string) => name || 'N/A'
    },
    { title: '可查看所有', dataIndex: 'CanViewAll', key: 'canViewAll', render: (can: boolean) => <Switch checked={can} disabled /> },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除该用户吗?"
            onConfirm={() => handleDelete(record.ID)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>用户管理</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          创建管理员
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers}>刷新</Button>
      </Space>
      <Table columns={columns} dataSource={users} rowKey="ID" loading={loading} scroll={{ x: 'max-content' }} />
      <Modal
        title={
          <Space>
            {editingUser ? <EditOutlined /> : <PlusOutlined />}
            {editingUser ? '编辑管理员' : '创建新管理员'}
          </Space>
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="userForm" initialValues={{ Role: 'admin', CanViewAll: false }}>
          <Form.Item name="Username" label="用户名" rules={[{ required: true, message: '用户名不能为空' }]}>
            <Input />
          </Form.Item>
          <Form.Item 
            name="Password" 
            label={editingUser ? '新密码（不填则不修改）' : '密码'} 
            rules={[{ required: !editingUser, message: '初始密码不能为空' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="Role" label="角色" rules={[{ required: true, message: '必须选择一个角色' }]}>
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="super_admin">Super Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="department_id" 
            label="所属部门"
            rules={[{ 
              required: form.getFieldValue('Role') === 'admin', 
              message: 'Admin角色必须关联一个部门' 
            }]}
          >
            <Select>
              {departments.map(d => <Option key={d.ID} value={d.ID}>{d.Name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="CanViewAll" label="可查看所有部门的建议" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement; 
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Descriptions,
  Tag,
  Empty,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getSuggestionByCode } from '../api/suggestions';

const { Title, Paragraph, Text } = Typography;

const QuerySuggestionPage: React.FC = () => {
  const [queryForm] = Form.useForm();
  const [queryLoading, setQueryLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);

  const onSearch = async (values: { code: string }) => {
    const { code } = values;
    if (!code) return;
    setQueryLoading(true);
    try {
      const suggestion = await getSuggestionByCode(code);
      setCurrentSuggestion(suggestion);
      setIsModalVisible(true);
      queryForm.resetFields();
    } catch (error) {
      console.error('查询建议时出错:', error);
      let errorMessage = '查询时遇到未知错误，请稍后再试。';
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        errorMessage =
          '我们未能找到该查询码对应的建议。请您仔细核对是否输入正确，特别是区分大小写或包含空格。';
      } else if (axios.isAxiosError(error)) {
        errorMessage = `查询失败，服务器返回了错误: ${error.message}`;
      }
      Modal.error({
        title: '查询失败',
        content: errorMessage,
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setCurrentSuggestion(null);
  };

  return (
    <>
      <Row justify="center">
        <Col xs={24} sm={24} md={20} lg={16} xl={12}>
          <Card>
            <Typography>
              <Title level={4}>查询建议处理进度</Title>
              <Paragraph>
                如果您已提交建议，可在此处输入查询码来跟踪处理状态和官方回复。
              </Paragraph>
            </Typography>
            <Divider />
            <Form form={queryForm} onFinish={onSearch} layout="vertical">
              <Form.Item
                name="code"
                label="您的建议查询码"
                rules={[{ required: true, message: '查询码不能为空' }]}
              >
                <Input placeholder="请输入提交建议后获得的查询码" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={queryLoading}
                  icon={<SearchOutlined />}
                  size="large"
                  block
                >
                  查询进度
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {currentSuggestion && (
        <Modal
          title={`查询码: ${currentSuggestion.TrackingCode}`}
          visible={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="back" onClick={handleModalClose}>
              关闭
            </Button>,
          ]}
          width={800}
        >
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="标题">{currentSuggestion.Title}</Descriptions.Item>
            <Descriptions.Item label="内容">{currentSuggestion.Content}</Descriptions.Item>
            <Descriptions.Item label="提交至">{currentSuggestion.Department.Name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag>{currentSuggestion.Status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              {new Date(currentSuggestion.CreatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
          <Divider>回复</Divider>
          {currentSuggestion.Replies && currentSuggestion.Replies.length > 0 ? (
            currentSuggestion.Replies.map((reply: any) => (
              <Card key={reply.ID} type="inner" title={`回复来自: ${reply.Replier.Username}`} style={{ marginTop: 16 }}>
                <p>{reply.Content}</p>
                <Text type="secondary">{new Date(reply.CreatedAt).toLocaleString()}</Text>
              </Card>
            ))
          ) : (
            <Empty description="暂无回复" />
          )}
        </Modal>
      )}
    </>
  );
};

export default QuerySuggestionPage; 
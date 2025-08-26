'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUmami } from '@/hooks/use-umami';
import { toast } from 'sonner';

export default function TestUmamiPage() {
  const [eventName, setEventName] = useState('');
  const [eventData, setEventData] = useState('');
  const [userId, setUserId] = useState('');
  const [department, setDepartment] = useState('');

  const {
    identify,
    track,
    trackPageView,
    trackUserAction,
    trackFormSubmit,
    trackSearch,
    trackDownload,
    trackNavigation,
    isReady
  } = useUmami();

  const handleIdentifyUser = () => {
    if (!userId) {
      toast.error('请输入用户ID');
      return;
    }

    identify(userId, {
      id: userId,
      department: department || undefined,
      domainAccount: userId,
      role: 'test-user'
    });

    toast.success(`用户 ${userId} 已识别`);
  };

  const handleTrackEvent = () => {
    if (!eventName) {
      toast.error('请输入事件名称');
      return;
    }

    let data = {};
    if (eventData) {
      try {
        data = JSON.parse(eventData);
      } catch {
        data = { value: eventData };
      }
    }

    track(eventName, data);
    toast.success(`事件 "${eventName}" 已追踪`);
  };

  const handleTestActions = () => {
    // 测试各种追踪方法
    trackUserAction('button_click', { button: 'test-all' });
    trackFormSubmit('test-form', true, { fields: 3 });
    trackSearch('umami test', 10, 'test');
    trackDownload('test-file.pdf', 'pdf', 1024);
    trackNavigation('/dashboard', '/dashboard/test-umami', 'manual');
    trackPageView('/dashboard/test-umami', '/dashboard', 'Umami 测试页面');

    toast.success('所有测试事件已发送');
  };

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <h1 className='text-3xl font-bold'>Umami 追踪测试页面</h1>

      <Card>
        <CardHeader>
          <CardTitle>追踪状态</CardTitle>
          <CardDescription>检查 Umami 是否已初始化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-2'>
            <div
              className={`h-3 w-3 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span>{isReady ? 'Umami 已就绪' : 'Umami 未初始化'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>用户识别</CardTitle>
          <CardDescription>识别域账号用户</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='userId'>用户ID/域账号</Label>
            <Input
              id='userId'
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder='例如: john.doe@company.com'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='department'>部门</Label>
            <Input
              id='department'
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder='例如: IT部门'
            />
          </div>
          <Button onClick={handleIdentifyUser}>识别用户</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自定义事件追踪</CardTitle>
          <CardDescription>发送自定义事件到 Umami</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='eventName'>事件名称</Label>
            <Input
              id='eventName'
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder='例如: button_click'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='eventData'>事件数据 (JSON 格式)</Label>
            <Input
              id='eventData'
              value={eventData}
              onChange={(e) => setEventData(e.target.value)}
              placeholder='例如: {"page": "dashboard", "action": "test"}'
            />
          </div>
          <Button onClick={handleTrackEvent}>发送事件</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>批量测试</CardTitle>
          <CardDescription>测试所有追踪功能</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestActions} variant='outline'>
            发送所有测试事件
          </Button>
          <p className='text-muted-foreground mt-2 text-sm'>
            将发送: 用户行为、表单提交、搜索、下载、导航和页面浏览事件
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <p>
            1. 确保已配置环境变量 NEXT_PUBLIC_UMAMI_URL 和
            NEXT_PUBLIC_UMAMI_WEBSITE_ID
          </p>
          <p>2. 打开浏览器开发者工具的网络面板，查看发送到 Umami 的请求</p>
          <p>3. 在 Umami 仪表板中查看实时数据</p>
          <p>4. 用户识别后，所有后续事件都会关联到该用户</p>
        </CardContent>
      </Card>
    </div>
  );
}

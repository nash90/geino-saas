import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersManagementTab } from '@/components/admin/tabs/UsersManagementTab';
import { OrganizationsManagementTab } from '@/components/admin/tabs/OrganizationsManagementTab';

export default function SystemAdmin() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">システム管理</h1>
        <p className="text-gray-600 mt-1">ユーザーアカウント、システムロール、組織を管理します</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">ユーザー一覧</TabsTrigger>
          <TabsTrigger value="organizations">組織一覧</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UsersManagementTab />
        </TabsContent>
        
        <TabsContent value="organizations" className="mt-6">
          <OrganizationsManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

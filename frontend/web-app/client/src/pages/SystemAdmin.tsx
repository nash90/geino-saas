import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersManagementTab } from '@/components/admin/tabs/UsersManagementTab';
import { OrganizationsManagementTab } from '@/components/admin/tabs/OrganizationsManagementTab';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function SystemAdmin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isSystemAdmin = user?.systemRoleCode === 1;

  // Redirect non-system-admins to home page
  useEffect(() => {
    if (!loading && !isSystemAdmin) {
      setLocation('/');
    }
  }, [loading, isSystemAdmin, setLocation]);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show access denied if not system admin (brief flash before redirect)
  if (!isSystemAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            この操作にはシステム管理者権限が必要です。ホームページにリダイレクトしています...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/api/auth';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract token from URL hash (Supabase sends it in the hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenFromHash = hashParams.get('access_token') || '';
    
    // Also check query params as fallback
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = queryParams.get('token') || queryParams.get('access_token') || '';
    
    const tokenFromUrl = tokenFromHash || tokenFromQuery;
    
    console.log('Reset password URL:', window.location.href);
    console.log('Token from hash:', tokenFromHash);
    console.log('Token from query:', tokenFromQuery);
    
    if (!tokenFromUrl) {
      setError('無効なリセットリンクです。もう一度パスワードリセットを申請してください。');
    } else {
      console.log('Token extracted successfully');
    }
    
    setToken(tokenFromUrl);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return;
    }

    if (!token) {
      setError('無効なリセットリンクです');
      return;
    }

    setLoading(true);

    try {
      await authApi.updatePassword(token, formData.password);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワードの更新に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">新しいパスワードを設定</CardTitle>
          <CardDescription className="text-center">
            新しいパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <AlertDescription>
                  パスワードが更新されました！ログインページにリダイレクトします...
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">新しいパスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={loading || success || !token}
              />
              <p className="text-xs text-muted-foreground">8文字以上で入力してください</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading || success || !token}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success || !token}>
              {loading ? 'パスワード更新中...' : 'パスワードを更新'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <a className="text-sm text-primary hover:underline">ログインに戻る</a>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

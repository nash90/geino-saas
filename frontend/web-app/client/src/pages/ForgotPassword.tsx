import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await authApi.resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワードリセットに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">パスワードリセット</CardTitle>
          <CardDescription className="text-center">
            登録したメールアドレスにパスワードリセット用のリンクを送信します
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
                  パスワードリセット用のリンクをメールで送信しました。メールをご確認ください。
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="taro.yamada@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? '送信中...' : 'リセットリンクを送信'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/login">
            <a className="text-sm text-primary hover:underline">ログインに戻る</a>
          </Link>
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでないですか？{' '}
            <Link href="/register">
              <a className="text-primary hover:underline font-medium">新規登録</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

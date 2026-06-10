import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 2) { toast.error("用户名至少2位"); return; }
    if (password.length < 4) { toast.error("密码至少4位"); return; }
    setLoading(true);
    try {
      await register(username, password);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm bg-card rounded-lg border shadow-sm p-6">
        <h1 className="text-xl font-bold text-center mb-6">注册数字大脑</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">用户名</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium">密码</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground text-center mt-4">
          已有账号？<Link to="/login" className="text-primary underline">登录</Link>
        </p>
      </div>
    </div>
  );
}

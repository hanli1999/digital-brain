import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/config/api";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [feishuAppId, setFeishuAppId] = useState("");
  const [feishuAppSecret, setFeishuAppSecret] = useState("");
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["settings"],
    queryFn: () => apiFetch(`/settings`).then((r) => r.json()),
  });

  useEffect(() => {
    if (settings) {
      setFeishuAppId(settings.feishuAppId || "");
      setFeishuAppSecret(settings.feishuAppSecret || "");
      setDeepseekApiKey(settings.deepseekApiKey || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiFetch(`/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  const handleSave = () => {
    saveMutation.mutate({ feishuAppId, feishuAppSecret, deepseekApiKey });
  };

  return (
    <div className="max-w-2xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">飞书配置</CardTitle>
            <CardDescription>用于飞书双写同步和机器人 Webhook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">App ID</label>
              <Input value={feishuAppId} onChange={(e) => setFeishuAppId(e.target.value)} placeholder="cli_xxxxxxxx" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">App Secret</label>
              <Input type="password" value={feishuAppSecret} onChange={(e) => setFeishuAppSecret(e.target.value)} placeholder="••••••••" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI 引擎</CardTitle>
            <CardDescription>内置 DeepSeek API，可替换为自己的 Key</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="text-xs text-muted-foreground mb-1 block">DeepSeek API Key</label>
            <Input type="password" value={deepseekApiKey} onChange={(e) => setDeepseekApiKey(e.target.value)} placeholder="sk-••••••••（留空使用内置）" />
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saved ? "已保存 ✓" : "保存设置"}
        </Button>
      </div>
    </div>
  );
}

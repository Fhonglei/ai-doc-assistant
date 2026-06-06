"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import * as api from "@/lib/api-client";
import type { User } from "@/lib/types";
import { Spinner } from "@/components/common/Spinner";
import { ErrorBanner } from "@/components/common/ErrorBanner";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [authRequired, setAuthRequired] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const health = await api.checkHealth();
      setAuthRequired(Boolean(health.auth_enabled));
      if (!health.auth_enabled) {
        setLoading(false);
        return;
      }

      if (api.getAuthToken()) {
        const me = await api.getCurrentUser();
        setUser(me);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to initialize authentication.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
        const result =
          mode === "login"
            ? await api.login(email, password)
            : await api.register(email, password);
        api.setAuthToken(result.access_token);
        setUser(result.user);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Authentication failed.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, mode, password]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-base text-primary">
        <Spinner />
      </div>
    );
  }

  if (authRequired === null) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-base px-4">
        <div className="w-full max-w-md">
          <ErrorBanner
            message={error || "Backend is unavailable. Check NEXT_PUBLIC_API_URL and backend status."}
            onRetry={bootstrap}
          />
        </div>
      </div>
    );
  }

  if (!authRequired || user) return <>{children}</>;

  return (
    <div className="flex h-full items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-sm rounded-lg border border-subtle bg-surface-elevated p-5 shadow-panel">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-primary">AI Document Assistant</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login" ? "登录你的知识库" : "创建一个新的知识库账号"}
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-secondary">邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-subtle bg-surface-muted px-3 py-2 text-sm text-primary outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-secondary">密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="mt-1 w-full rounded-lg border border-subtle bg-surface-muted px-3 py-2 text-sm text-primary outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "处理中..." : mode === "login" ? "登录" : "注册"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
          className="mt-4 w-full text-center text-xs font-medium text-accent hover:underline"
        >
          {mode === "login" ? "没有账号？注册" : "已有账号？登录"}
        </button>
      </div>
    </div>
  );
}

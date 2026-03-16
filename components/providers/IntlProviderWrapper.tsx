"use client";

import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import MainLayout from "@/components/layout/MainLayout";

type IntlProviderWrapperProps = {
  locale: string;
  messages: IntlMessages;
  children: React.ReactNode;
};

// next-intl types messages as Record<string, unknown>
type IntlMessages = Record<string, unknown>;

export default function IntlProviderWrapper({
  locale,
  messages,
  children,
}: IntlProviderWrapperProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Bangkok">
      <AuthProvider>
        <QueryProvider>
          <ToastProvider>
            <MainLayout>{children}</MainLayout>
          </ToastProvider>
        </QueryProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

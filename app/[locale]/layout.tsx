import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ToastProvider } from "@/contexts/ToastContext";
import MainLayout from "@/components/layout/MainLayout";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToastProvider>
        <MainLayout>{children}</MainLayout>
      </ToastProvider>
    </NextIntlClientProvider>
  );
}

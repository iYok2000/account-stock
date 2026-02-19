import { getMessages } from "next-intl/server";
import IntlProviderWrapper from "@/components/providers/IntlProviderWrapper";

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
    <IntlProviderWrapper locale={locale} messages={messages ?? {}}>
      {children}
    </IntlProviderWrapper>
  );
}

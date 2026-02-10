import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const cards = [
    { 
      labelKey: "totalProducts", 
      value: "0", 
      path: "/inventory",
      icon: (
        <svg className="size-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      trend: null
    },
    { 
      labelKey: "lowStock", 
      value: "0", 
      path: "/inventory",
      icon: (
        <svg className="size-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      trend: null
    },
    { 
      labelKey: "pendingOrders", 
      value: "0", 
      path: "/orders",
      icon: (
        <svg className="size-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      trend: null
    },
    { 
      labelKey: "ordersToday", 
      value: "0", 
      path: "/orders",
      icon: (
        <svg className="size-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trend: null
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Overview of your inventory and orders
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
        {cards.map(({ labelKey, value, path, icon }) => (
          <LocaleLink
            key={labelKey}
            href={path}
            className="card card-hover group flex flex-col"
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-neutral-600">
                {t(labelKey)}
              </span>
              <div className="rounded-lg bg-neutral-50 p-2 transition-colors group-hover:bg-neutral-100">
                {icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {value}
              </span>
            </div>
          </LocaleLink>
        ))}
      </div>
    </div>
  );
}

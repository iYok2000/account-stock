import { getTranslations } from "next-intl/server";

export default async function ReportsPage() {
  const t = await getTranslations("reports");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        {t("title")}
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900">
            {t("salesSummary")}
          </h2>
          <p className="mt-4 text-3xl font-bold tabular-nums text-neutral-900">
            0
          </p>
          <p className="mt-3 text-sm text-neutral-500">{t("placeholder")}</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900">
            {t("topProducts")}
          </h2>
          <p className="mt-4 text-3xl font-bold tabular-nums text-neutral-900">
            0
          </p>
          <p className="mt-3 text-sm text-neutral-500">{t("placeholder")}</p>
        </div>
      </div>
    </div>
  );
}

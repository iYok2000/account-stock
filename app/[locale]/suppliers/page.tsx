import { getTranslations } from "next-intl/server";

export default async function SuppliersPage() {
  const t = await getTranslations("suppliers");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        {t("title")}
      </h1>
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell text-left text-neutral-700">
                  {t("colName")}
                </th>
                <th className="table-header-cell text-left text-neutral-700">
                  {t("colContact")}
                </th>
                <th className="table-header-cell w-24 text-right text-neutral-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-body-row">
                <td
                  colSpan={3}
                  className="py-16 text-center text-sm text-neutral-500"
                >
                  {t("empty")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-neutral-500">{t("placeholder")}</p>
    </div>
  );
}

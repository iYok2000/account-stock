"use client";

import { useTranslations } from "next-intl";
import { ImportWizard } from "@/components/upload/ImportWizard";

export default function ImportPage() {
  const t = useTranslations("import");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        {t("title")}
      </h1>
      <ImportWizard />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Receipt, Calculator, FileText, PiggyBank } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency } from "@/lib/utils";

const TAX_BRACKETS = [
  { upTo: 150_000, rate: 0 },
  { upTo: 300_000, rate: 5 },
  { upTo: 500_000, rate: 10 },
  { upTo: 750_000, rate: 15 },
  { upTo: 1_000_000, rate: 20 },
  { upTo: 2_000_000, rate: 25 },
  { upTo: 5_000_000, rate: 30 },
  { upTo: Infinity, rate: 35 },
];

function calcTax(taxableIncome: number) {
  let tax = 0;
  let prev = 0;
  const breakdown: { from: number; to: number; rate: number; tax: number }[] = [];
  for (const b of TAX_BRACKETS) {
    if (taxableIncome <= prev) break;
    const inBracket = Math.min(taxableIncome, b.upTo) - prev;
    const bracketTax = inBracket * (b.rate / 100);
    tax += bracketTax;
    if (inBracket > 0) breakdown.push({ from: prev, to: Math.min(taxableIncome, b.upTo), rate: b.rate, tax: bracketTax });
    prev = b.upTo;
  }
  return { total: tax, breakdown };
}

export default function TaxPage() {
  const [grossIncome, setGrossIncome] = useState(1_200_000);
  const [deductionMethod, setDeductionMethod] = useState<"flat" | "itemized">("flat");
  const [socialSecurity, setSocialSecurity] = useState(9_000);
  const [lifeInsurance, setLifeInsurance] = useState(15_000);
  const [ssfRmf, setSsfRmf] = useState(50_000);
  const [donations, setDonations] = useState(5_000);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [itemizedExpenses, setItemizedExpenses] = useState(450_000);

  const result = useMemo(() => {
    const personalDeduction = 60_000;
    const flatExpenseDeduction = grossIncome * 0.6;
    const expenseDeduction = deductionMethod === "flat" ? flatExpenseDeduction : itemizedExpenses;
    const totalPersonalAllowances = personalDeduction + socialSecurity + lifeInsurance + ssfRmf + donations + otherDeductions;
    const totalAllowances = expenseDeduction + totalPersonalAllowances;
    const taxableIncome = Math.max(grossIncome - totalAllowances, 0);
    const taxResult = calcTax(taxableIncome);
    const withholdingTax = grossIncome * 0.03;
    const netTaxPayable = taxResult.total - withholdingTax;
    const isRefund = netTaxPayable < 0;
    return {
      grossIncome, expenseDeduction, personalDeduction, totalPersonalAllowances,
      totalAllowances, taxableIncome,
      estimatedTax: taxResult.total,
      taxBreakdown: taxResult.breakdown,
      withholdingTax,
      netTaxDue: Math.max(netTaxPayable, 0),
      isRefund,
      refundAmount: Math.abs(Math.min(netTaxPayable, 0)),
      effectiveRate: grossIncome > 0 ? (taxResult.total / grossIncome) * 100 : 0,
      flatExpenseDeduction,
      usingFlat: deductionMethod === "flat",
    };
  }, [grossIncome, deductionMethod, itemizedExpenses, socialSecurity, lifeInsurance, ssfRmf, donations, otherDeductions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">เครื่องคำนวณภาษี</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            คำนวณภาษีเงินได้และวางแผนการลดหย่อน (อัพเดทแบบ real-time)
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground self-start">
          Local Preview
        </span>
      </div>

      {/* API banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>รอต่อ API — การยืนยันผลจาก Calc Engine จะเปิดใช้เมื่อเชื่อมต่อ backend</span>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "รายได้รวม (ปี)", value: formatCurrency(result.grossIncome), icon: Receipt },
          { title: "ค่าใช้จ่ายหักได้", value: formatCurrency(result.totalAllowances), icon: PiggyBank },
          { title: "เงินได้สุทธิ", value: formatCurrency(result.taxableIncome), icon: Calculator },
          {
            title: result.isRefund ? "ภาษีที่ได้คืน" : "ภาษีที่ต้องจ่ายเพิ่ม",
            value: result.isRefund ? formatCurrency(result.refundAmount) : formatCurrency(result.netTaxDue),
            icon: FileText,
          },
        ].map(({ title, value, icon: Icon }) => (
          <div key={title} className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              <p className="text-base font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input sliders */}
        <div className="card space-y-5">
          <div className="mb-1">
            <h3 className="font-semibold text-foreground">ปรับค่าเพื่อคำนวณภาษี</h3>
            <p className="text-sm text-muted-foreground mt-0.5">ลากปรับค่าเพื่อดูผลภาษีแบบ real-time</p>
          </div>

          <Slider label="รายได้ต่อปี" value={grossIncome} onChange={setGrossIncome} min={0} max={10_000_000} step={10_000} prefix="฿" />

          {/* Deduction toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">วิธีหักค่าใช้จ่าย</label>
            <div className="flex gap-3">
              {(["flat", "itemized"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDeductionMethod(m)}
                  className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    deductionMethod === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {m === "flat" ? "หักเหมา 60%" : "หักตามจริง"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {deductionMethod === "flat"
                ? `หักเหมา 60% = ${formatCurrency(result.flatExpenseDeduction)}`
                : `หักตามจริง = ${formatCurrency(itemizedExpenses)}`}
            </p>
          </div>

          {deductionMethod === "itemized" && (
            <Slider label="ค่าใช้จ่ายจริง" value={itemizedExpenses} onChange={setItemizedExpenses} min={0} max={grossIncome} step={10_000} prefix="฿" />
          )}

          <div className="border-t pt-3">
            <p className="text-sm font-medium text-foreground mb-3">ค่าลดหย่อน</p>
            <p className="text-xs text-muted-foreground mb-3">ส่วนตัว: {formatCurrency(60_000)} (คงที่)</p>
            <div className="space-y-4">
              <Slider label="ประกันสังคม" value={socialSecurity} onChange={setSocialSecurity} min={0} max={9_000} step={100} prefix="฿" />
              <Slider label="ประกันชีวิต" value={lifeInsurance} onChange={setLifeInsurance} min={0} max={100_000} step={1_000} prefix="฿" />
              <Slider label="กองทุน SSF/RMF" value={ssfRmf} onChange={setSsfRmf} min={0} max={500_000} step={5_000} prefix="฿" />
              <Slider label="เงินบริจาค" value={donations} onChange={setDonations} min={0} max={100_000} step={1_000} prefix="฿" />
              <Slider label="ค่าลดหย่อนอื่นๆ" value={otherDeductions} onChange={setOtherDeductions} min={0} max={200_000} step={1_000} prefix="฿" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="card space-y-2 text-sm">
            <div className="mb-2">
              <h3 className="font-semibold text-foreground">ผลลัพธ์ภาษี</h3>
              <p className="text-sm text-muted-foreground mt-0.5">ประมาณการ ภ.ง.ด.90</p>
            </div>

            {[
              { l: "รายได้รวม", v: formatCurrency(result.grossIncome), cls: "font-medium" },
              { l: result.usingFlat ? "หัก ค่าใช้จ่ายเหมา 60%" : "หัก ค่าใช้จ่ายตามจริง", v: `-${formatCurrency(result.expenseDeduction)}`, cls: "text-muted-foreground" },
              { l: "หัก ลดหย่อนส่วนตัว", v: `-${formatCurrency(result.personalDeduction)}`, cls: "text-muted-foreground" },
              socialSecurity > 0 ? { l: "หัก ประกันสังคม", v: `-${formatCurrency(socialSecurity)}`, cls: "text-muted-foreground" } : null,
              lifeInsurance > 0 ? { l: "หัก ประกันชีวิต", v: `-${formatCurrency(lifeInsurance)}`, cls: "text-muted-foreground" } : null,
              ssfRmf > 0 ? { l: "หัก SSF/RMF", v: `-${formatCurrency(ssfRmf)}`, cls: "text-muted-foreground" } : null,
              donations > 0 ? { l: "หัก เงินบริจาค", v: `-${formatCurrency(donations)}`, cls: "text-muted-foreground" } : null,
              otherDeductions > 0 ? { l: "หัก ค่าลดหย่อนอื่นๆ", v: `-${formatCurrency(otherDeductions)}`, cls: "text-muted-foreground" } : null,
            ]
              .filter(Boolean)
              .map((row) => row && (
                <div key={row.l} className={`flex justify-between py-1 border-b border-border/50 ${row.cls}`}>
                  <span>{row.l}</span>
                  <span>{row.v}</span>
                </div>
              ))}

            <div className="flex justify-between py-2 border-t font-medium">
              <span>เงินได้สุทธิ</span>
              <span>{formatCurrency(result.taxableIncome)}</span>
            </div>

            {/* Tax bracket breakdown */}
            {result.taxBreakdown.length > 0 && (
              <div className="border rounded-md overflow-hidden mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-1.5 px-2 font-medium">เงินได้สุทธิ</th>
                      <th className="text-center py-1.5 px-2 font-medium">อัตรา</th>
                      <th className="text-right py-1.5 px-2 font-medium">ภาษี</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.taxBreakdown.map((b, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-1.5 px-2">{b.from.toLocaleString()} – {b.to === Infinity ? "ขึ้นไป" : b.to.toLocaleString()}</td>
                        <td className="py-1.5 px-2 text-center">{b.rate === 0 ? "ยกเว้น" : `${b.rate}%`}</td>
                        <td className="py-1.5 px-2 text-right">{formatCurrency(b.tax)}</td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50 font-medium">
                      <td className="py-1.5 px-2" colSpan={2}>รวม</td>
                      <td className="py-1.5 px-2 text-right">{formatCurrency(result.estimatedTax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between py-2 border-t font-bold">
              <span>ภาษีที่ต้องจ่าย</span>
              <span className="text-red-600">{formatCurrency(result.estimatedTax)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>หัก ภาษีหัก ณ ที่จ่าย (3%)</span>
              <span>-{formatCurrency(result.withholdingTax)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-foreground/20">
              <span className="text-base font-bold">
                {result.isRefund ? "คุณได้รับคืน" : "ภาษีสุทธิที่ต้องจ่ายเพิ่ม"}
              </span>
              <span className={`text-base font-bold ${result.isRefund ? "text-green-600" : "text-red-600"}`}>
                {result.isRefund ? formatCurrency(result.refundAmount) : formatCurrency(result.netTaxDue)}
              </span>
            </div>

            {result.isRefund && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-800">
                  ภาษีหัก ณ ที่จ่ายมากกว่าภาษีที่ต้องจ่าย คุณได้รับคืน {formatCurrency(result.refundAmount)}
                </p>
              </div>
            )}

            <div className="flex justify-between pt-1 text-muted-foreground text-xs">
              <span>Effective tax rate</span>
              <span className="font-medium">{result.effectiveRate.toFixed(2)}%</span>
            </div>
          </div>

          {/* Tips */}
          {ssfRmf < 200_000 && (
            <div className="card space-y-2 text-sm">
              <h4 className="font-semibold text-foreground">Tips ลดภาษี</h4>
              <p className="text-muted-foreground">
                ถ้าเพิ่ม SSF/RMF อีก {formatCurrency(Math.min(200_000, 500_000 - ssfRmf))} จะลดภาษีได้อีกประมาณ {formatCurrency(Math.min(200_000, 500_000 - ssfRmf) * 0.1)} (ลองปรับ slider ดู)
              </p>
              {lifeInsurance < 100_000 && (
                <p className="text-muted-foreground">
                  ค่าประกันชีวิตลดหย่อนได้สูงสุด {formatCurrency(100_000)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tax bracket reference */}
      <div className="card">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">อัตราภาษีเงินได้บุคคลธรรมดา</h3>
          <p className="text-sm text-muted-foreground mt-0.5">อัตราภาษีแบบขั้นบันได</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium">เงินได้สุทธิ (THB)</th>
                <th className="text-center py-2 px-3 font-medium">อัตรา</th>
                <th className="text-right py-2 px-3 font-medium">ภาษีสูงสุดในขั้น</th>
              </tr>
            </thead>
            <tbody>
              {TAX_BRACKETS.map((bracket, i) => {
                const prevLimit = i === 0 ? 0 : TAX_BRACKETS[i - 1].upTo;
                const bracketWidth = bracket.upTo === Infinity ? 0 : bracket.upTo - prevLimit;
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      {i === 0 ? "0" : (prevLimit + 1).toLocaleString()} –{" "}
                      {bracket.upTo === Infinity ? "ขึ้นไป" : bracket.upTo.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center font-medium">
                      {bracket.rate === 0 ? "ยกเว้น" : `${bracket.rate}%`}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {bracket.upTo === Infinity ? "-" : formatCurrency(bracketWidth * (bracket.rate / 100))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import type { Runsheet, Order } from "@/data/dummyData";

type RunsheetReportOptions = {
  filename?: string;
  riderPhone?: string;
  onlineCollected?: number;
  codCollectedOverride?: number;
  prepaidTotalOverride?: number;
};

const escapeCsv = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).replace(/\r?\n|\r/g, " ");
  if (/[",]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const formatCurrency = (amount: number) => {
  if (!Number.isFinite(amount)) return "₹0.00";
  return `₹${amount.toFixed(2)}`;
};

const getRunsheetDate = (runsheet: Runsheet) => {
  const dateValue = (runsheet as any).run_date || (runsheet as any).date || (runsheet as any).created_at;
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateValue);
  }
};

export const downloadRunsheetReport = (
  runsheet: Runsheet,
  orders: Order[],
  options: RunsheetReportOptions = {}
) => {
  const filename = options.filename || `${runsheet.id || "runsheet"}-report.csv`;
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(
    (order) => order.status && order.status.toLowerCase() === "delivered"
  ).length;

  const codOrders = orders.filter((order) => order.payment_mode === "COD");
  const prepaidOrders = orders.filter((order) => order.payment_mode === "Online");

  const undeliveredOrders = orders.filter((order) => order.status && order.status.toLowerCase() === "undelivered");
  const undeliveredCOD = undeliveredOrders
    .filter((order) => order.payment_mode === "COD")
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const undeliveredPrepaid = undeliveredOrders
    .filter((order) => order.payment_mode === "Online")
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const undeliveredTotal = undeliveredCOD + undeliveredPrepaid;

  const rawCodExpected = codOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const rawPrepaidTotal = prepaidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const codExpected = Math.max(0, rawCodExpected - undeliveredCOD);
  const prepaidTotal = options.prepaidTotalOverride !== undefined
    ? options.prepaidTotalOverride
    : Math.max(0, rawPrepaidTotal - undeliveredPrepaid);

  const defaultCodCollected = codOrders
    .filter((order) => order.status && order.status.toLowerCase() === "delivered")
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const codCollected = options.codCollectedOverride ?? defaultCodCollected;
  const onlineCollected = options.onlineCollected ?? 0;

  const grandTotal = codExpected + prepaidTotal + undeliveredTotal;

  const headerRows: string[][] = [
    ["Runsheet Report"],
    ["Generated On", new Date().toLocaleString("en-IN")],
    ["Runsheet ID", runsheet.id || ""],
    ["Run Date", getRunsheetDate(runsheet)],
    ["Rider Name", (runsheet as any).rider_name || ""],
    ["Rider ID", (runsheet as any).rider_id || ""],
    ["Rider Phone", options.riderPhone || ""],
    ["Status", runsheet.status || ""],
    ["Total Orders", totalOrders.toString()],
    ["Delivered Orders", deliveredOrders.toString()],
    ["COD Expected", formatCurrency(codExpected)],
    ["COD Collected (Delivered COD)", formatCurrency(codCollected)],
    ["Online (UPI) Logged", formatCurrency(onlineCollected)],
    ["Prepaid Total", formatCurrency(prepaidTotal)],
    ["Undelivered Amount", formatCurrency(undeliveredTotal)],
    ["Grand Total", formatCurrency(grandTotal)],
    [],
  ];

  const tableHeader = [
    "Runsheet ID",
    "Run Date",
    "Rider Name",
    "Rider ID",
    "Order ID",
    "Order Number",
    "Customer Name",
    "Customer Phone",
    "Address",
    "Payment Mode",
    "Order Status",
    "COD Amount",
    "Prepaid Amount",
    "Order Total",
    "COD Payment Status",
    "Items",
  ];

  const orderRows = orders.map((order) => {
    const codAmount = order.payment_mode === "COD" ? order.total_amount || 0 : 0;
    const prepaidAmount = order.payment_mode === "Online" ? order.total_amount || 0 : 0;
    const codPaymentStatus = order.payment_mode === "COD"
      ? (order.status && order.status.toLowerCase() === "delivered" ? "Collected" : "Pending")
      : "N/A";
    const itemsSummary = (order.items || [])
      .map((item) => `${item.product_name} x${item.quantity} (₹${item.subtotal.toFixed(2)})`)
      .join(" | ");

    return [
      runsheet.id || "",
      getRunsheetDate(runsheet),
      (runsheet as any).rider_name || "",
      (runsheet as any).rider_id || "",
      order.id,
      order.order_number || "",
      order.customer_name || "",
      order.customer_phone || "",
      order.address || "",
      order.payment_mode,
      order.status || "",
      formatCurrency(codAmount),
      formatCurrency(prepaidAmount),
      formatCurrency(order.total_amount || 0),
      codPaymentStatus,
      itemsSummary,
    ];
  });

  const summaryRows: string[][] = [
    [],
    ["Summary"],
    ["Total Orders", totalOrders.toString()],
    ["Delivered Orders", deliveredOrders.toString()],
    ["COD Expected", formatCurrency(codExpected)],
    ["COD Collected (Delivered COD)", formatCurrency(codCollected)],
    ["Online (UPI) Logged", formatCurrency(onlineCollected)],
    ["Prepaid Total", formatCurrency(prepaidTotal)],
    ["Undelivered Amount", formatCurrency(undeliveredTotal)],
    ["Grand Total", formatCurrency(grandTotal)],
  ];

  const csvMatrix = [...headerRows, tableHeader, ...orderRows, ...summaryRows];
  const csvContent = "\ufeff" + csvMatrix.map((row) => row.map(escapeCsv).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

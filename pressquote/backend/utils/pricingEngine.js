/**
 * PressQuote Pricing Engine
 * Shared pricing logic for Quick Quote and Custom Job workflows
 */

function getDaysUntilDue(dueDateStr) {
  if (!dueDateStr) return 30;
  const due = new Date(dueDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function getRushMultiplier(daysUntilDue) {
  if (daysUntilDue <= 2) return { multiplier: 1.5, percent: 50 };
  if (daysUntilDue <= 6) return { multiplier: 1.25, percent: 25 };
  if (daysUntilDue <= 13) return { multiplier: 1.1, percent: 10 };
  return { multiplier: 1.0, percent: 0 };
}

function calculateQuote({
  materialCost = 0,
  laborHours = 0,
  designHours = 0,
  outsourcedCost = 0,
  settings,
  dueDate,
  complexityMultiplier = 1.0,
}) {
  const laborRate = parseFloat(settings.labor_rate || 45);
  const designRate = parseFloat(settings.design_hourly_rate || 75);
  const overheadPercent = parseFloat(settings.overhead_percent || 20);
  const targetMarginPercent = parseFloat(settings.target_margin_percent || 40);
  const minimumJobPrice = parseFloat(settings.minimum_job_price || 25);
  const economicMultiplier = parseFloat(settings.economic_multiplier || 1.0);

  const laborCost = laborHours * laborRate;
  const designCost = designHours * designRate;

  // Apply complexity multiplier to labor
  const adjustedLaborCost = laborCost * complexityMultiplier;

  const subtotal = materialCost + adjustedLaborCost + designCost + outsourcedCost;
  const overheadCost = subtotal * (overheadPercent / 100);
  const costWithOverhead = subtotal + overheadCost;
  const costWithMultiplier = costWithOverhead * economicMultiplier;

  // Apply target margin: price = cost / (1 - margin)
  const marginDecimal = targetMarginPercent / 100;
  const priceBeforeRush = marginDecimal >= 1 ? costWithMultiplier * 2 : costWithMultiplier / (1 - marginDecimal);

  // Rush pricing
  const daysUntilDue = getDaysUntilDue(dueDate);
  const { multiplier: rushMultiplier, percent: rushPercent } = getRushMultiplier(daysUntilDue);
  const priceWithRush = priceBeforeRush * rushMultiplier;
  const rushFee = priceWithRush - priceBeforeRush;

  // Enforce minimum
  const finalPrice = Math.max(priceWithRush, minimumJobPrice);

  // Profit & margin
  const totalCost = subtotal + overheadCost;
  const profit = finalPrice - totalCost;
  const marginActual = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

  return {
    materialCost: round(materialCost),
    laborCost: round(adjustedLaborCost),
    designCost: round(designCost),
    outsourcedCost: round(outsourcedCost),
    subtotal: round(subtotal),
    overheadCost: round(overheadCost),
    rushFee: round(rushFee),
    rushPercent,
    daysUntilDue,
    finalPrice: round(finalPrice),
    profit: round(profit),
    marginPercent: round(marginActual),
  };
}

function round(val) {
  return Math.round(val * 100) / 100;
}

// Calculate labor hours for a product template + quantity
function calcTemplateHours(template, quantity) {
  const setup = parseFloat(template.setup_time || 0);
  const runPerUnit = parseFloat(template.run_time_per_unit || 0);
  const finishing = parseFloat(template.finishing_time || 0);
  return setup + (runPerUnit * quantity) + finishing;
}

module.exports = { calculateQuote, getDaysUntilDue, getRushMultiplier, calcTemplateHours };

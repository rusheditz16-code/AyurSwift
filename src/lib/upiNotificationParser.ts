export interface ParsedUpiNotification {
  amount: number;
  txnId: string;
  senderName: string;
  orderIdHint: string | null;
  sanitizedSummary: string;
}

/**
 * Parses incoming Android push notifications / bank SMS alerts for UPI credits.
 * Specifically tuned for BOTH FamApp by Trio / FamPay notification formats:
 *   Format 1: "You received Rs.3500.0 from DABHI MITALI .. with txn ID FMPIB7008115932. Your FamX a/c balance is Rs.12066.99 on FamApp by Trio"
 *   Format 2: "Rs 534.6 was credited to your account with transaction ID FMPIB6913513778. Currently, your account balance is Rs 6615.08 on FamPay."
 * as well as Google Pay, PhonePe, Paytm, BHIM, and Indian bank UPI credit SMS formats.
 *
 * Security & Privacy:
 * - Always strips wallet/account balance clauses FIRST so private balances are never stored
 *   and never mistaken for the received order amount.
 */
export function parseUpiCreditNotification(rawText: string): ParsedUpiNotification | null {
  if (typeof rawText !== 'string') return null;
  const collapsed = rawText.replace(/\s+/g, ' ').trim();
  if (collapsed.length < 10 || collapsed.length > 2_000) return null;

  // Reject outgoing / failed / collect-request notifications
  if (
    /\b(?:you\s+paid|paid\s+to|sent\s+rs|was\s+debited|debited\s+from|failed|declined|requested\s+money|collect\s+request)\b/i.test(
      collapsed
    ) &&
    !/\b(?:you\s+received|credited\s+to\s+your|was\s+credited)\b/i.test(collapsed)
  ) {
    return null;
  }

  // 1. Strip private wallet / bank account balance sentences FIRST (FamX, FamPay, bank balances)
  const withoutBalance = collapsed
    .replace(
      /\.?\s*(?:currently,?\s*)?your\s+(?:famx\s+)?(?:a\/c|acct|account)\s+balance\s+is\s+(?:rs\.?|inr|₹)\s*[\d,]+(?:\.\d+)?(?:\s+on\s+(?:famapp(?:\s+by\s+trio)?|fampay))?\.?/gi,
      ''
    )
    .replace(
      /\.?\s*(?:currently,?\s*)?(?:your\s+)?(?:a\/c|acct|account|avl|available|wallet|updated|new)\s*bal(?:ance)?\s*(?:is|:|-)?\s*(?:rs\.?|inr|₹)?\s*[\d,]+(?:\.\d+)?/gi,
      ''
    )
    .trim();

  // 2. Extract received rupee amount (supports "You received Rs.3500.0" AND "Rs 534.6 was credited to your account")
  const amountPatterns: RegExp[] = [
    /(?:you\s+received|received|credited(?:\s+with|\s+by)?|paid\s+you)\s*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:was\s+|is\s+|has\s+been\s+)?(?:received|credited)/i,
  ];

  let amount: number | null = null;
  for (const pat of amountPatterns) {
    const m = pat.exec(withoutBalance);
    if (m && m[1]) {
      const val = Number(m[1].replace(/,/g, ''));
      if (Number.isFinite(val) && val > 0 && val <= 500_000) {
        amount = Number(val.toFixed(2));
        break;
      }
    }
  }

  if (amount === null) return null;

  // 3. Extract FamApp/FamPay txn ID (e.g. FMPIB7008115932 / FMPIB6913513778) or 12-digit NPCI UTR
  let txnId = '';
  const txnPatterns: RegExp[] = [
    /\b(FMP[A-Z0-9]{7,24})\b/i,
    /(?:with\s+)?(?:txn|transaction|upi|utr|ref(?:erence)?)\s*(?:id|no\.?|number|#)?\s*[:#-]*\s*([A-Z0-9]{8,28})\b/i,
    /\b(\d{12})\b/,
  ];

  for (const pat of txnPatterns) {
    const m = pat.exec(withoutBalance);
    if (m && m[1]) {
      const candidate = m[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (
        candidate.length >= 8 &&
        !/^(RECEIVED|CREDITED|FAMAPP|FAMPAY|BALANCE|ACCOUNT|TRANSACTION)$/.test(candidate)
      ) {
        txnId = candidate;
        break;
      }
    }
  }

  // 4. Extract sender name if present (e.g. "from DABHI MITALI .. with txn ID")
  let senderName = '';
  const senderMatch =
    /\bfrom\s+([A-Za-z][A-Za-z0-9\s.]{1,50}?)(?:\s*\.\.|\s+with\s+(?:txn|transaction)|\s+via\s+|\s+on\s+fam|\s+ref\b|\s+utr\b|\s+txn\b|[.,;]|$)/i.exec(
      withoutBalance
    );
  if (senderMatch && senderMatch[1]) {
    const candidateSender = senderMatch[1]
      .replace(/\.+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    if (!/^(?:your\s+account|account)$/i.test(candidateSender)) {
      senderName = candidateSender;
    }
  }

  // 5. Extract optional AyurSwift Order ID hint if present in notification note
  let orderIdHint: string | null = null;
  const orderMatch = /#?(AS-[A-Z0-9]{6,12})\b/i.exec(withoutBalance);
  if (orderMatch && orderMatch[1]) {
    orderIdHint = `#${orderMatch[1].toUpperCase()}`;
  }

  if (!txnId) {
    const senderSlug = (senderName || 'UPI').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
    const fiveMinBucket = Math.floor(Date.now() / 300_000);
    txnId = `FAM_${Math.round(amount * 100)}_${senderSlug || 'ANON'}_${fiveMinBucket}`;
  }

  const sanitizedSummary = `Rs.${amount}${senderName ? ` from ${senderName}` : ''} (Txn: ${txnId})`;

  return {
    amount,
    txnId,
    senderName,
    orderIdHint,
    sanitizedSummary,
  };
}

/**
 * Checks whether a sender name from FamApp (e.g. "DABHI MITALI") reasonably matches
 * an order's customerName (e.g. "Mitali Dabhi" or "Dabhi Mitali").
 */
export function doesSenderMatchCustomerName(senderName: string, customerName: string): boolean {
  if (!senderName || !customerName) return false;
  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3);

  const senderTokens = tokenize(senderName);
  const customerTokens = new Set(tokenize(customerName));
  if (senderTokens.length === 0 || customerTokens.size === 0) return false;

  return senderTokens.some((tok) => customerTokens.has(tok));
}

export function priceYes(qYes: number, qNo: number, b: number) {
  const expYes = Math.exp(qYes / b);
  const expNo = Math.exp(qNo / b);
  return expYes / (expYes + expNo);
}

export function costToBuy(
  side: "YES" | "NO",
  delta: number,
  qYes: number,
  qNo: number,
  b: number,
) {
  const C = (qY: number, qN: number) =>
    b * Math.log(Math.exp(qY / b) + Math.exp(qN / b));
  const costBefore = C(qYes, qNo);
  const costAfter = side === "YES" ? C(qYes + delta, qNo) : C(qYes, qNo + delta);
  return costAfter - costBefore;
}

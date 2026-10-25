// Same rule the server uses to price cart lines (Backend order-pricing.service.js):
// best of item-specific discount (flat or %), price rule (%), and restaurant-wide discount (%).
export const getDiscountedItemPrice = (restaurant, itemId, basePrice) => {
  const price = Number(basePrice) || 0
  let bestAmount = 0
  let bestValue = 0
  let bestIsFlat = false

  const itemDiscount = (restaurant?.itemDiscounts || []).find(
    (d) => String(d.itemId) === String(itemId),
  )
  if (itemDiscount) {
    const value = Number(itemDiscount.discountValue) || 0
    const isFlat = String(itemDiscount.discountType || "").toUpperCase() === "FLAT"
    const amount = isFlat ? value : (price * value) / 100
    if (amount > bestAmount) {
      bestAmount = amount
      bestValue = value
      bestIsFlat = isFlat
    }
  }

  const rule = (restaurant?.discountRules || []).find((r) => {
    const val = Number(r.conditionValue)
    if (r.conditionType === "PRICE_ABOVE" && price > val) return true
    if (r.conditionType === "PRICE_BELOW" && price < val) return true
    return false
  })
  if (rule) {
    const value = Number(rule.discountValue) || 0
    const amount = (price * value) / 100
    if (amount > bestAmount) {
      bestAmount = amount
      bestValue = value
      bestIsFlat = false
    }
  }

  const globalDiscount = Number(restaurant?.discount || 0)
  if (globalDiscount > 0 && (price * globalDiscount) / 100 > bestAmount) {
    bestValue = globalDiscount
    bestIsFlat = false
  }

  if (!(bestValue > 0)) return price
  return Math.round(bestIsFlat ? Math.max(0, price - bestValue) : price * (1 - bestValue / 100))
}

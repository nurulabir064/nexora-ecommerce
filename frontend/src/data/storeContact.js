// Public NEXORA support contact. Keep the number in Bangladesh local format here.
export const STORE_PHONE_LOCAL = '01304302201';
export const STORE_PHONE_INTERNATIONAL = `880${STORE_PHONE_LOCAL.slice(1)}`;
export const STORE_TEL_URL = `tel:+${STORE_PHONE_INTERNATIONAL}`;
export const STORE_WHATSAPP_URL = `https://wa.me/${STORE_PHONE_INTERNATIONAL}`;

export function buildOrderWhatsAppUrl(order) {
  const lines = [
    `Hello NEXORA, I have placed an order.`,
    `Order: ${order.orderNumber}`,
    `Total: BDT ${Number(order.total).toLocaleString('en-BD')}`,
    `Payment: Cash on delivery`
  ];
  return `${STORE_WHATSAPP_URL}?text=${encodeURIComponent(lines.join('\n'))}`;
}

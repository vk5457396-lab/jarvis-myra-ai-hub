// Flash Sale Configuration
// MYRA 2.0 discount: ₹899 → ₹799 for 24 hours
const FLASH_SALE_START = new Date('2026-02-09T00:00:00+05:30'); // IST
const FLASH_SALE_END = new Date('2026-02-10T00:00:00+05:30'); // 24 hours later

export const isFlashSaleActive = (): boolean => {
  const now = new Date();
  return now >= FLASH_SALE_START && now < FLASH_SALE_END;
};

export const getFlashSaleEnd = (): Date => FLASH_SALE_END;

export const getMyraPrice = (): number => {
  if (isFlashSaleActive()) return 799;
  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  return isAfterFeb1 ? 899 : 799;
};

export const getBundlePrice = (): number => {
  if (isFlashSaleActive()) return 1499;
  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  return isAfterFeb1 ? 1599 : 1499;
};

export const getMyraName = (): string => {
  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  return isAfterFeb1 ? "MYRA 2.0" : "MYRA";
};

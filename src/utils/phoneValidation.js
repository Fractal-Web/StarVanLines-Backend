export const phoneValidationMessage =
  'Phone number must be at least 10 digits, digits only, with an optional single leading +.';

const PHONE_REGEX =
  /^(?=(?:\D*\d){10,}$)\+?[\d\s()-]+$/;

export const isValidPhone = (value) => {
  const phone = String(value ?? '').trim();
  if (!phone) return false;
  return PHONE_REGEX.test(phone);
};

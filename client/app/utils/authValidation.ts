export type FieldErrors = Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());
export const isValidMobileNumber = (value: string) => MOBILE_REGEX.test(value.replace(/\D/g, ""));
export const isStrongPassword = (value: string) => STRONG_PASSWORD_REGEX.test(value);

export const getPasswordValidationError = (value: string) => {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(value)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must include at least one special character.";
  return "";
};

export const validateLoginForm = ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
};

export const validateSignupForm = ({
  fullname,
  email,
  mobilenumber,
  password,
}: {
  fullname: string;
  email: string;
  mobilenumber: string;
  password: string;
}) => {
  const errors: FieldErrors = {};

  if (!fullname.trim()) {
    errors.fullname = "Full name is required.";
  }

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!mobilenumber.trim()) {
    errors.mobilenumber = "Mobile number is required.";
  } else if (!isValidMobileNumber(mobilenumber)) {
    errors.mobilenumber = "Please enter a valid 10-digit mobile number.";
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
};

export const validateResetPasswordForm = ({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) => {
  const errors: FieldErrors = {};

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};

export const validatePasswordChangeForm = ({
  currentPassword,
  newPassword,
  confirmPassword,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const errors: FieldErrors = {};

  if (!currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  const passwordError = getPasswordValidationError(newPassword);
  if (passwordError) {
    errors.newPassword = passwordError;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};

export const normalizeAuthErrorMessage = (message?: string) => {
  const normalized = (message || "").toLowerCase();

  if (normalized.includes("invalid email")) return "Invalid email";
  if (normalized.includes("invalid password")) return "Invalid password";
  if (normalized.includes("invalid credentials")) return "Invalid email or password";
  if (normalized.includes("current password is incorrect")) return "Current password is incorrect";

  return message || "An error occurred. Please try again.";
};

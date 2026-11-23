export type PasswordStrength = {
  score: number;
  label: string;
};

const labels = ["Very weak", "Very weak", "Weak", "Fair", "Strong", "Very strong"];

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Very weak" };

  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const score = [
    password.length >= 8,
    password.length >= 12,
    hasMixedCase,
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  return { score, label: labels[score] ?? "Very strong" };
}

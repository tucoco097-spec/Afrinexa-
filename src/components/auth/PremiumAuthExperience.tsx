import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent, ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPasswordStrength } from "@/lib/password-strength";
import "./premium-auth.css";

type AuthMode = "in" | "up";
const MOTION_PREFERENCE_EVENT = "afrinexa:motion-preference";

function useAuthMotionPreference() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const syncPreference = () => {
      const saved = window.localStorage.getItem("afrinexa:reduce-motion");
      setReduced(
        saved === null
          ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
          : saved === "true",
      );
    };
    syncPreference();
    window.addEventListener(MOTION_PREFERENCE_EVENT, syncPreference);
    return () => window.removeEventListener(MOTION_PREFERENCE_EVENT, syncPreference);
  }, []);
  return reduced;
}

const particles = [
  [7, 24, 0.2],
  [16, 76, 1.3],
  [24, 14, 2.1],
  [35, 83, 0.8],
  [45, 20, 1.8],
  [55, 73, 0.4],
  [64, 12, 2.5],
  [73, 88, 1.5],
  [82, 25, 0.6],
  [91, 68, 2.2],
  [12, 51, 2.7],
  [30, 44, 1.1],
  [69, 52, 0.9],
  [87, 43, 1.9],
];

export function PremiumAuthFrame({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [motionOverride, setMotionOverride] = useState(false);
  const pointerFrame = useRef<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("afrinexa:reduce-motion");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionOverride(saved !== null);
    setReduceMotion(saved === null ? prefersReduced : saved === "true");
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = "en";
    return () => {
      document.documentElement.lang = previousLang || "fr";
    };
  }, []);

  function toggleMotion() {
    const next = !reduceMotion;
    setMotionOverride(true);
    setReduceMotion(next);
    window.localStorage.setItem("afrinexa:reduce-motion", String(next));
    window.dispatchEvent(new Event(MOTION_PREFERENCE_EVENT));
  }

  function moveLight(event: PointerEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    if (pointerFrame.current !== null) window.cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = window.requestAnimationFrame(() => {
      const bounds = element.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      element.style.setProperty("--pointer-x", `${x}%`);
      element.style.setProperty("--pointer-y", `${y}%`);
      pointerFrame.current = null;
    });
  }

  useEffect(
    () => () => {
      if (pointerFrame.current !== null) window.cancelAnimationFrame(pointerFrame.current);
    },
    [],
  );

  return (
    <div
      className={`premium-auth${reduceMotion ? " is-reduced" : ""}${motionOverride && !reduceMotion ? " motion-user-enabled" : ""}`}
      onPointerMove={moveLight}
    >
      <div className="auth-scene" aria-hidden="true">
        <div className="auth-scene-glow" />
        <div className="auth-scene-grid" />
        <span className="auth-orb auth-orb-one" />
        <span className="auth-orb auth-orb-two" />
        <span className="auth-orb auth-orb-three" />
        <span className="auth-orb auth-orb-four" />
        <span className="auth-orb auth-orb-five" />
        <span className="auth-orb auth-orb-six" />
        {particles.map(([left, top, delay], index) => (
          <span
            key={index}
            className="auth-particle"
            style={
              { "--left": `${left}%`, "--top": `${top}%`, "--delay": `${delay}s` } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="auth-stage">
        <motion.header
          className="auth-brand"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="auth-brand-mark" aria-hidden="true">
            <span>A</span>
          </div>
          <div className="auth-brand-word">AFRINEXA</div>
          <div className="auth-brand-caption">GLOBAL LOGISTICS &amp; CARGO TRACKING</div>
          <p className="auth-brand-slogan">Connecting the World. Delivering Trust.</p>
        </motion.header>

        <button
          type="button"
          className="auth-motion-toggle"
          onClick={toggleMotion}
          aria-pressed={reduceMotion}
          aria-label={reduceMotion ? "Enable background motion" : "Reduce background motion"}
        >
          {reduceMotion ? <Waves aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
          <span>{reduceMotion ? "Motion reduced" : "Reduce motion"}</span>
        </button>

        {children}

        <p className="auth-footer-note">SECURE ACCESS · GLOBAL SERVICE · AFRINEXA</p>
      </div>
    </div>
  );
}

export function PremiumLoginExperience() {
  const reduceMotion = useAuthMotionPreference();
  const [mode, setMode] = useState<AuthMode>("in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationSent, setRegistrationSent] = useState(false);
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const googleOAuthEnabled = import.meta.env["VITE_GOOGLE_OAUTH_ENABLED"] === "true";
  const strength = getPasswordStrength(password);

  useEffect(() => {
    const remembered = window.localStorage.getItem("afrinexa:remembered-email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const emailValue = String(form.get("email") ?? "").trim();
    const passwordValue = String(form.get("password") ?? "");

    if (mode === "up") {
      const phone = String(form.get("phone") ?? "").trim();
      const confirmPassword = String(form.get("confirmPassword") ?? "");
      if (!/^\+?[0-9().\s-]{7,20}$/.test(phone)) {
        setError("Enter a valid phone number, including your country code.");
        return;
      }
      if (passwordValue !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }
      if (strength.score < 3 || !/\d/.test(passwordValue)) {
        setError(
          "Choose a stronger password with at least 8 characters, mixed case, and a number.",
        );
        return;
      }
      if (!form.get("acceptTerms")) {
        setError("Please accept the Terms & Conditions to create your account.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        });
        if (signInError) {
          setError("Email or password is incorrect. Please try again.");
          return;
        }
        if (rememberMe) window.localStorage.setItem("afrinexa:remembered-email", emailValue);
        else window.localStorage.removeItem("afrinexa:remembered-email");
        await navigate({ to: "/espace" });
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue,
        password: passwordValue,
        options: {
          emailRedirectTo: `${window.location.origin}/espace`,
          data: {
            full_name: String(form.get("fullName") ?? "").trim(),
            phone: String(form.get("phone") ?? "").trim(),
            country: String(form.get("country") ?? "").trim(),
          },
        },
      });
      if (signUpError) {
        setError(
          /already registered|already exists/i.test(signUpError.message)
            ? "An account already uses this email. Please sign in instead."
            : "Sign up is temporarily unavailable. Please try again later.",
        );
        return;
      }
      if (data.session) {
        await navigate({ to: "/espace" });
        return;
      }
      setRegistrationSent(true);
    } catch {
      setError("Authentication is temporarily unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    if (!googleOAuthEnabled) return;
    setError("");
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/espace` },
      });
      if (oauthError) {
        setError(
          /provider.*(not enabled|unsupported)|unsupported provider/i.test(oauthError.message)
            ? "Google sign-in is not enabled in Supabase yet. You can continue with email."
            : "Google sign-in is temporarily unavailable.",
        );
      }
    } catch {
      setError("Google sign-in is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: AuthMode) {
    setError("");
    setPassword("");
    setShowPassword(false);
    setShowConfirmation(false);
    setMode(next);
  }

  return (
    <PremiumAuthFrame>
      <motion.section
        className="auth-card"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          delay: reduceMotion ? 0 : 0.12,
          ease: "easeOut",
        }}
      >
        {registrationSent ? (
          <div className="auth-success-state" role="status">
            <span className="auth-success-icon">
              <Check aria-hidden="true" />
            </span>
            <p className="auth-eyebrow">ACCOUNT CREATED</p>
            <h1>CHECK YOUR INBOX</h1>
            <p className="auth-description">
              If your account needs email confirmation, follow the secure link we sent to your
              inbox. You can then sign in to your AFRINEXA account.
            </p>
            <button
              type="button"
              className="auth-text-link"
              onClick={() => setRegistrationSent(false)}
            >
              <ArrowLeft aria-hidden="true" /> Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="auth-panel-heading">
              <span className="auth-eyebrow">
                {mode === "in" ? "CLIENT PORTAL" : "JOIN AFRINEXA"}
              </span>
              <h1>{mode === "in" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}</h1>
              <p className="auth-description">
                {mode === "in"
                  ? "Sign in to your AFRINEXA account."
                  : "Join AFRINEXA and discover a better logistics experience."}
              </p>
            </div>

            <button
              type="button"
              className="auth-google-button"
              onClick={continueWithGoogle}
              disabled={loading || !googleOAuthEnabled}
              title={
                googleOAuthEnabled ? "Continue with Google" : "Google sign-in is not configured"
              }
            >
              <span className="auth-google-g" aria-hidden="true">
                G
              </span>
              {googleOAuthEnabled ? "Continue with Google" : "Google sign-in not configured"}
            </button>

            <div className="auth-divider">
              <span>OR CONTINUE WITH EMAIL</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.form
                key={mode}
                onSubmit={submit}
                className="auth-form"
                initial={reduceMotion ? false : { opacity: 0, x: mode === "up" ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "up" ? -18 : 18 }}
                transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
              >
                {mode === "up" && (
                  <>
                    <div className="auth-field">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="auth-control-wrap">
                        <UserRound aria-hidden="true" />
                        <Input
                          id="fullName"
                          name="fullName"
                          autoComplete="name"
                          placeholder="Your full name"
                          required
                          className="auth-input"
                        />
                      </div>
                    </div>
                    <div className="auth-grid-two">
                      <div className="auth-field">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="auth-control-wrap">
                          <Phone aria-hidden="true" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+237 6…"
                            title="Use 7–20 digits and optionally a country code."
                            required
                            className="auth-input"
                          />
                        </div>
                      </div>
                      <div className="auth-field">
                        <Label htmlFor="country">Country</Label>
                        <div className="auth-control-wrap">
                          <Globe2 aria-hidden="true" />
                          <Input
                            id="country"
                            name="country"
                            autoComplete="country-name"
                            placeholder="Country / region"
                            required
                            className="auth-input"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="auth-field">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="auth-control-wrap">
                    <Mail aria-hidden="true" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-label-row">
                    <Label htmlFor="password">Password</Label>
                    {mode === "in" && (
                      <Link to="/forgot-password" className="auth-inline-link">
                        Forgot Password?
                      </Link>
                    )}
                  </div>
                  <div className="auth-control-wrap">
                    <LockKeyhole aria-hidden="true" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "in" ? "current-password" : "new-password"}
                      minLength={mode === "in" ? undefined : 8}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={
                        mode === "in" ? "Enter your password" : "Create a strong password"
                      }
                      className="auth-input auth-password-input"
                    />
                    <button
                      type="button"
                      className="auth-reveal"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                  {mode === "up" && <PasswordStrengthMeter password={password} />}
                </div>

                {mode === "up" && (
                  <>
                    <div className="auth-field">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="auth-control-wrap">
                        <ShieldCheck aria-hidden="true" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmation ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          placeholder="Re-enter your password"
                          className="auth-input auth-password-input"
                        />
                        <button
                          type="button"
                          className="auth-reveal"
                          onClick={() => setShowConfirmation((value) => !value)}
                          aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"}
                        >
                          {showConfirmation ? (
                            <EyeOff aria-hidden="true" />
                          ) : (
                            <Eye aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                    <label className="auth-terms-check">
                      <input type="checkbox" name="acceptTerms" required />
                      <span>I agree to the AFRINEXA Terms &amp; Conditions.</span>
                    </label>
                  </>
                )}

                {mode === "in" && (
                  <label className="auth-remember-check">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Remember Me</span>
                    <span className="auth-remember-note">
                      Remembers this email only, never your password.
                    </span>
                  </label>
                )}

                {error && (
                  <p className="auth-form-error" role="alert">
                    {error}
                  </p>
                )}

                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : (
                    <span>{mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}</span>
                  )}
                  {!loading && <ArrowRight aria-hidden="true" />}
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="auth-switch-copy">
              {mode === "in" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="auth-text-link"
                onClick={() => switchMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "CREATE ACCOUNT" : "SIGN IN"}
              </button>
            </p>
          </>
        )}
      </motion.section>
    </PremiumAuthFrame>
  );
}

export function PremiumForgotPassword() {
  const reduceMotion = useAuthMotionPreference();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError("We couldn't process this request right now. Please wait a moment and try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn't process this request right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PremiumAuthFrame>
      <motion.section
        className="auth-card auth-card-compact"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
      >
        {sent ? (
          <div className="auth-success-state" role="status">
            <span className="auth-success-icon">
              <Mail aria-hidden="true" />
            </span>
            <p className="auth-eyebrow">SECURE RECOVERY</p>
            <h1>CHECK YOUR INBOX</h1>
            <p className="auth-description">
              If an account exists and email delivery is available, a password reset link will be
              sent. Check your inbox and spam folder.
            </p>
            <Link to="/auth" className="auth-back-link">
              <ArrowLeft aria-hidden="true" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-panel-heading">
              <span className="auth-eyebrow">SECURE RECOVERY</span>
              <h1>RESET YOUR PASSWORD</h1>
              <p className="auth-description">
                Enter your email address to receive a password reset link.
              </p>
            </div>
            <form onSubmit={submit} className="auth-form">
              <div className="auth-field">
                <Label htmlFor="recoveryEmail">Email Address</Label>
                <div className="auth-control-wrap">
                  <Mail aria-hidden="true" />
                  <Input
                    id="recoveryEmail"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    className="auth-input"
                  />
                </div>
              </div>
              {error && (
                <p className="auth-form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <span>SEND RESET LINK</span>
                )}
                {!loading && <ArrowRight aria-hidden="true" />}
              </button>
            </form>
            <Link to="/auth" className="auth-back-link">
              <ArrowLeft aria-hidden="true" /> Back to sign in
            </Link>
          </>
        )}
      </motion.section>
    </PremiumAuthFrame>
  );
}

export function PremiumResetPassword() {
  const reduceMotion = useAuthMotionPreference();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [recoveryAuthorized, setRecoveryAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const strength = getPasswordStrength(password);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(Boolean(session));
        setRecoveryAuthorized(Boolean(session));
        if (session) {
          try {
            window.sessionStorage.setItem(
              "afrinexa:password-recovery-at",
              JSON.stringify({ at: Date.now(), userId: session.user.id }),
            );
          } catch {
            // The current recovery session is still valid for this page view.
          }
        }
      } else if (event === "SIGNED_OUT") {
        setHasSession(false);
        setRecoveryAuthorized(false);
        try {
          window.sessionStorage.removeItem("afrinexa:password-recovery-at");
        } catch {
          // Ignore storage restrictions.
        }
      }
      setChecking(false);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setHasSession(Boolean(data.session));
        try {
          const marker = JSON.parse(
            window.sessionStorage.getItem("afrinexa:password-recovery-at") ?? "null",
          ) as { at?: unknown; userId?: unknown } | null;
          const recoveryAt = typeof marker?.at === "number" ? marker.at : Number.NaN;
          const recoveryAge = Date.now() - recoveryAt;
          setRecoveryAuthorized(
            Boolean(
              data.session &&
              marker?.userId === data.session.user.id &&
              Number.isFinite(recoveryAt) &&
              recoveryAge >= 0 &&
              recoveryAge < 15 * 60 * 1000,
            ),
          );
        } catch {
          setRecoveryAuthorized(false);
        }
        setChecking(false);
      })
      .catch(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Your passwords do not match.");
      return;
    }
    if (strength.score < 3 || !/\d/.test(password)) {
      setError("Choose a stronger password with at least 8 characters, mixed case, and a number.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("This reset link may have expired. Request a new link and try again.");
        return;
      }
      try {
        window.sessionStorage.removeItem("afrinexa:password-recovery-at");
      } catch {
        // Ignore storage restrictions; the recovery timestamp expires automatically.
      }
      await navigate({ to: "/espace" });
    } catch {
      setError("We couldn't update your password. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PremiumAuthFrame>
      <motion.section
        className="auth-card auth-card-compact"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
      >
        {checking ? (
          <div className="auth-loading-state">
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            <span>Verifying secure link…</span>
          </div>
        ) : !hasSession || !recoveryAuthorized ? (
          <div className="auth-success-state">
            <span className="auth-success-icon">
              <KeyRound aria-hidden="true" />
            </span>
            <p className="auth-eyebrow">SECURE RECOVERY</p>
            <h1>LINK EXPIRED</h1>
            <p className="auth-description">
              This password reset link is invalid or has expired. Request a new secure link to
              continue.
            </p>
            <Link to="/forgot-password" className="auth-back-link">
              Request a new link <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-panel-heading">
              <span className="auth-eyebrow">SECURE RECOVERY</span>
              <h1>CREATE A NEW PASSWORD</h1>
              <p className="auth-description">
                Choose a strong password for your AFRINEXA account.
              </p>
            </div>
            <form onSubmit={submit} className="auth-form">
              <div className="auth-field">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="auth-control-wrap">
                  <LockKeyhole aria-hidden="true" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    className="auth-input auth-password-input"
                  />
                  <button
                    type="button"
                    className="auth-reveal"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>
              <div className="auth-field">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="auth-control-wrap">
                  <ShieldCheck aria-hidden="true" />
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="Re-enter your password"
                    className="auth-input"
                  />
                </div>
              </div>
              {error && (
                <p className="auth-form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <span>UPDATE PASSWORD</span>
                )}
                {!loading && <ArrowRight aria-hidden="true" />}
              </button>
            </form>
          </>
        )}
      </motion.section>
    </PremiumAuthFrame>
  );
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="auth-strength" aria-live="polite">
      <div className="auth-strength-bars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((bar) => (
          <span
            key={bar}
            className={strength.score >= bar ? `is-active strength-${strength.score}` : ""}
          />
        ))}
      </div>
      <span>{password ? strength.label : "Use 8+ characters, mixed case and a number"}</span>
    </div>
  );
}

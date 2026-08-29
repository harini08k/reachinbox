export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-white p-10 shadow-sm">
        <h1 className="mb-8 text-center text-3xl font-bold text-text-primary">
          Login
        </h1>

        <button className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-brand-greenLight py-3 text-text-primary transition hover:opacity-90">
          <GoogleIcon />
          <span>Login with Google</span>
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-surface-border" />
          <span className="text-sm text-text-secondary">
            or sign up through email
          </span>
          <div className="h-px flex-1 bg-surface-border" />
        </div>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email ID"
            className="w-full rounded-xl bg-surface-muted px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-surface-muted px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <button className="w-full rounded-xl bg-brand-green py-3 font-medium text-white transition hover:bg-brand-greenDark">
          Login
        </button>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.97-4.33 2.97-7.31Z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H1.06v2.59A10 10 0 0 0 10 20Z"
      />
      <path
        fill="#FBBC05"
        d="M4.41 11.91a6 6 0 0 1 0-3.82V5.5H1.06a10 10 0 0 0 0 9l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.06 5.5l3.35 2.59C5.2 5.72 7.4 3.96 10 3.96Z"
      />
    </svg>
  );
}

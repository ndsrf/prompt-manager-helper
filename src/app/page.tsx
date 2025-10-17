import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-6xl font-bold text-center mb-8">
          PromptEasy
        </h1>
        <p className="text-xl text-center mb-12 text-muted-foreground">
          Your comprehensive LLM prompt management system
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/library"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Go to Library
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}

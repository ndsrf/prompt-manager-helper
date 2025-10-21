import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-12 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-center mb-6 sm:mb-8">
          PromptEasy
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-center mb-8 sm:mb-12 text-muted-foreground px-4">
          Your comprehensive LLM prompt management system
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Link
            href="/library"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-center"
          >
            Go to Library
          </Link>
          <Link
            href="/gallery"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition text-center"
          >
            Public Gallery
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition text-center"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition text-center"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}

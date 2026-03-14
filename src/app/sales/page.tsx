import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <div className="px-6 py-4 border-b border-white/5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-headline transition-colors font-opensans"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-accent/10">
            <Construction className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <h1 className="font-montserrat font-bold text-xl text-brand-headline mb-2">
              Sales & Pipeline
            </h1>
            <p className="font-opensans text-sm text-brand-muted">
              Coming soon — this dashboard is under construction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

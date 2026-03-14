import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function ClientsPage() {
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
          <Image
            src="/north-star-logo.png"
            alt="North Star Solutions"
            width={64}
            height={64}
            style={{ height: 64, width: "auto" }}
          />
          <div>
            <h1 className="font-montserrat font-bold text-xl text-brand-headline mb-2">
              Client Success
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

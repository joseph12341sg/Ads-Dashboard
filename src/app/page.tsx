import Header from "@/components/Header";
import KpiBar from "@/components/KpiBar";
import DashboardGrid from "@/components/DashboardGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="text-center py-6">
          <h1 className="font-montserrat font-bold text-4xl md:text-5xl text-brand-headline mb-3">
            North Star Solutions
          </h1>
          <p className="font-opensans text-base text-brand-muted">
            Overview of key metrics and business areas
          </p>
        </div>

        <KpiBar />
        <DashboardGrid />
      </main>
    </div>
  );
}

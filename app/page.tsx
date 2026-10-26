import { TipCalculator } from "@/components/tip-calculator";

export default function Home() {
  return (
    <main className="page">
      <h1>Tip splitter</h1>
      <p className="lead">Enter the bill, pick a tip, and see what each person pays.</p>
      <TipCalculator />
    </main>
  );
}

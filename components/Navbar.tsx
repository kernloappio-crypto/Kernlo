import Link from "next/link";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function Navbar() {
  return (
    <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold hover:opacity-80 transition">
            kernlo
          </div>
        </Link>
      </div>
    </nav>
  );
}

import Link from "next/link";
import { Moon } from "lucide-react";

export default function NavBar() {
  return (
    <nav className="bg-white/50 backdrop-blur-md px-4 lg:px-6 py-4 flex justify-center items-center sticky top-0 z-20 shadow-sm">
      <div className="flex flex-col items-center justify-center gap-1">
      <div className="flex items-center justify-center gap-2">
        <Moon className="w-6 h-6 lg:w-7 lg:h-7 text-black" />
        <Link
        href="/"
        className="text-xl lg:text-2xl font-bold text-gray-800 hover:text-red-500 transition-colors"
        >
        ScentDex
        </Link>
      </div>
      <p className="text-gray-600 text-xs lg:text-sm">
        Browse and study the most popular fragrances
      </p>
      </div>
    </nav>
  );
}

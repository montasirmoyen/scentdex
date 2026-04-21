import HeroSection from "@/components/ui/hero";
import type { NavigationSection } from "@/components/ui/header";
import Header from "@/components/ui/header";
import BrandSlider, { BrandList } from "@/components/ui/brand-slider";
import type { AvatarList } from "@/components/ui/hero";

export default function AgencyHeroSection() {
  const avatarList: AvatarList[] = [
    {
      image: "https://images.shadcnspace.com/assets/profiles/user-1.jpg",
    },
    {
      image: "https://images.shadcnspace.com/assets/profiles/user-2.jpg",
    },
    {
      image: "https://images.shadcnspace.com/assets/profiles/user-3.jpg",
    },
    {
      image: "https://images.shadcnspace.com/assets/profiles/user-5.jpg",
    },
  ];

  const brandList: BrandList[] = [
    {
      image: "/ysl-logo.png",
      name: "YSL",
    },
    {
      image: "/dior-logo.png",
      name: "Dior",
    },
    {
      image: "/versace-logo.png",
      name: "Versace",
    },
    {
      image: "/gucci-logo.png",
      name: "Gucci",
    },
  ];

  return (
    <div className="relative">
      <main>
        <HeroSection avatarList={avatarList} />
        <BrandSlider brandList={brandList} />
      </main>
    </div>
  );
}

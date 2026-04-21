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

  const navigationData: NavigationSection[] = [
    {
      title: "Home",
      href: "/",
      isActive: true,
    },
    {
      title: "Library",
      href: "library",
    },
    {
      title: "AI",
      href: "ai",
    }
  ];

  const brandList: BrandList[] = [
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-1.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-1.svg",
      name: "Brand 1",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-2.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-2.svg",
      name: "Brand 2",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-3.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-3.svg",
      name: "Brand 3",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-4.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-4.svg",
      name: "Brand 4",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-5.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-5.svg",
      name: "Brand 5",
    },
  ];

  return (
    <div className="relative">
      <Header navigationData={navigationData} />
      <main>
        <HeroSection avatarList={avatarList} />
        <BrandSlider brandList={brandList} />
      </main>
    </div>
  );
}

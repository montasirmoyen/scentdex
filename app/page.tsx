import AgencyHeroSection from "@/components/hero-section";
import TestimonialsComponent from '@/components/ui/testimonials'
import type { TestimonialItem } from '@/components/ui/testimonials'

const testimonials: TestimonialItem[] = [
    {
        name: 'Kanan Guliyev',
        description: 'Owns 25+ fragrances',
        avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png?width=40&height=40&format=auto',
        rating: 5,
        content: "I tried ScentDex to find a new signature scent, and I was blown away by the results."
    },
    {
        name: 'Bexsultan Abila',
        description: 'Fragrance researcher',
        avatar: 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png?width=40&height=40&format=auto',
        rating: 5,
        content: "ScentDex makes my fragrance research so much easier. The AI-powered recommendations are spot on, and the user interface is incredibly intuitive"
    }
]
export default function page() {
    return (
        <div>
            <AgencyHeroSection />
            <TestimonialsComponent testimonials={testimonials} />
        </div>
    )
}
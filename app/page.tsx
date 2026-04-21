import AgencyHeroSection from "@/components/hero-section";
import ProductList from '@/components/ui/product-list'
import TestimonialsComponent from '@/components/ui/testimonials'
import type { ProductItem } from '@/components/ui/product-list'
import type { TestimonialItem } from '@/components/ui/testimonials'
import fragranceData from '@/data/fragrances.json'

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

type HomepageFragrance = {
    Name: string
    Brand: string
    Gender: string
    Price: string
    'Image URL': string
}

const featuredFragranceNames = [
    'Jean Paul Gaultier Le Male Elixir',
    'Sauvage Eau de Parfum for men',
    'Emporio Armani Stronger With You Intensely',
    'Creed Aventus',
    'Eros Parfum for men',
    'Y'
] as const

const fragranceLookup = new Map(
    (fragranceData as HomepageFragrance[]).map((fragrance) => [fragrance.Name, fragrance])
)

const productList: ProductItem[] = featuredFragranceNames.map((name) => {
    const fragrance = fragranceLookup.get(name)

    if (!fragrance) {
        throw new Error(`Missing homepage fragrance: ${name}`)
    }

    return {
        image: fragrance['Image URL'],
        imgAlt: fragrance.Name,
        name: fragrance.Name,
        price: Number.parseFloat(fragrance.Price) || 0,
        badges: [fragrance.Brand, fragrance.Gender]
    }
})

export default function page() {
    return (
        <div>
            <AgencyHeroSection />
            <ProductList products={productList} />
            <TestimonialsComponent testimonials={testimonials} />
        </div>
    )
}
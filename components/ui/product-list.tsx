import { HeartIcon, ShoppingCartIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import Image from 'next/image'
import Link from 'next/link'

export type ProductItem = {
    ID: number
    image: string
    imgAlt: string
    name: string
    price: number
    salePrice?: number
    badges: string[]
}

type ProductProps = {
    products: ProductItem[]
}

const ProductList = ({ products }: ProductProps) => {
    return (
        <section className='py-8 sm:py-16 lg:py-24 mt-14'>
            <div className='mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:space-y-24 lg:px-8'>
                <div className='space-y-4 text-center'>
                    <p className='text-sm font-medium'>Popular fragrances</p>
                    <h2 className='text-2xl font-semibold sm:text-3xl lg:text-4xl'>Trending Scent Picks</h2>
                </div>

                <div className='mx-auto grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {/* Product Cards */}
                    {products.map((product) => (
                        <Link key={product.ID} href={`/fragrance/${product.ID}`}>
                            <article
                                className='overflow-hidden rounded-lg bg-card transition-all hover:-translate-y-0.5 hover:shadow-md'
                            >
                                <div className='relative aspect-square bg-white rounded-3xl'>
                                    <Image
                                        src={product.image}
                                        alt={product.imgAlt}
                                        fill
                                        unoptimized
                                        sizes='(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw'
                                        className='object-contain p-2'
                                    />
                                    {product.salePrice && (
                                        <Badge className='bg-destructive/10 text-destructive absolute top-3 left-3 rounded-sm px-2 py-1 text-xs font-medium uppercase'>
                                            Sale
                                        </Badge>
                                    )}
                                </div>

                                <div className='w-full space-y-1 p-3 bg-background text-background-foreground'>
                                    <h3 className='text-center text-sm font-semibold'>{product.name}</h3>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ProductList

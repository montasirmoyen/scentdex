import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa'

import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8'>
        <a href='#'>
          <div className='flex items-center gap-3'>
            <Image className='gap-3' src='/sd-logo.png' alt='Logo' width={40} height={40} />
            <span className='text-lg font-bold'>ScentDex</span>
          </div>
        </a>

        <div className='flex items-center gap-4'>
          <a href='#'>
            <FaFacebook className='size-5' />
          </a>
          <a href='#'>
            <FaInstagram className='size-5' />
          </a>
          <a href='#'>
            <FaTwitter className='size-5' />
          </a>
          <a href='#'>
            <FaYoutube className='size-5' />
          </a>
        </div>
      </div>

      <Separator />

      <div className='mx-auto flex max-w-7xl justify-center px-4 mt-8 sm:px-6'>
        <p className='text-center font-medium text-balance pb-8'>
          {`© ${new Date().getFullYear()}`}
          {' '}
          ScentDex. All rights reserved. 
        </p>
      </div>
    </footer>
  )
}

export { Footer }
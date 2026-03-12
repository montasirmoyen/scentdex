const Footer = () => {
    return (
        <footer>
            <div className='mx-auto text-muted-foreground flex max-w-7xl justify-center px-4 py-8 sm:px-6'>
                <p className='text-center font-medium text-balance'>
                    {`©${new Date().getFullYear()}`}{' '}
                    ScentDex. {' '}
                    Images sourced from <a href="https://www.fragrantica.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">Fragrantica</a>.
                    Data sourced from <a href="https://api.fragella.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">Fragella API</a>.
                    All rights reserved to their respective owners.
                </p>
            </div>
        </footer>
    )
}

export default Footer

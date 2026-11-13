import Image from 'next/image';

export default function BusinessProfileLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex w-full max-w-sm flex-col items-center px-6 text-center">
        <div className="relative">
          <span
            className="absolute inset-0 rounded-full border-2 border-[#215481]/20 border-t-[#215481] animate-spin"
            aria-hidden
          />
          <div className="m-2 flex h-20 w-20 items-center justify-center rounded-full bg-white">
            <Image
              src="/brands/fb-mark-240.png"
              alt="FinderB"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
        </div>
        <p className="mt-5 text-sm font-medium text-zinc-600">Opening profile...</p>
      </div>
    </div>
  );
}

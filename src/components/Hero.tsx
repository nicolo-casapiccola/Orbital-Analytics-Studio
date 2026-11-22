import { DatasetMeta } from '../types/dataset';
import { formatNumber } from '../utils/analytics';

interface HeroProps {
  meta: DatasetMeta;
}

export function Hero({ meta }: HeroProps) {
  return (
    <div className="pb-6 pt-10 sm:pb-8 sm:pt-14">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#6E6E73]">
        <span className="rounded-full bg-[#007AFF]/10 px-2.5 py-1 font-mono font-semibold tracking-[0.12em] text-[#007AFF]">
          UCS
        </span>
        <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1">
          UCS · aprile 2023
        </span>
        <span className="rounded-full border border-black/[0.08] bg-white px-2.5 py-1">
          SATCAT · {formatNumber(meta.catalog.totalObjects)} oggetti
        </span>
      </div>
      <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-[#1D1D1F] sm:text-[46px]">
        La flotta spaziale, in numeri.
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#6E6E73] sm:text-[16px]">
        {formatNumber(meta.satelliteCount)} satelliti censiti e incrociati con il catalogo
        orbitale. Chi li controlla, a cosa servono e quanto pesa il problema dei detriti.
      </p>
    </div>
  );
}

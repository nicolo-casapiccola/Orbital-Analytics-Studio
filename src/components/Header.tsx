import { Orbit } from 'lucide-react';
import { NAV_ITEMS } from '../types/dataset';

interface HeaderProps {
  activeSection: string;
}

export function Header({ activeSection }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#F5F5F7]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        <a href="#panoramica" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#007AFF] text-white shadow-sm">
            <Orbit size={17} strokeWidth={2.2} />
          </span>
          <span className="hidden text-[15px] font-semibold tracking-tight text-[#1D1D1F] sm:inline">
            Orbital Analytics
          </span>
        </a>
        <nav className="-mr-1 ml-auto flex items-center gap-0.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3.5 sm:text-[12.5px] ${
                  isActive
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

import { Link } from "react-router-dom";
import { ExploreGridSkeleton } from "@food/components/ui/loading-skeletons";
import InteractiveExploreIcon from "./InteractiveExploreIcon";

export default function ExploreMoreSection({
  heading = "Explore More",
  items = [],
  showSkeleton = false,
}) {
  return (
    <section className="content-auto pt-2 sm:pt-3 lg:pt-4">
      <div className="px-4 mb-5 flex items-center gap-2">
        <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
          {heading}
        </h2>
        <div className="h-[1px] bg-gray-100 dark:bg-gray-800 flex-1" />
      </div>
      <div className="px-4 pb-4 lg:pb-6">
        <div className="flex overflow-x-auto no-scrollbar gap-8 sm:gap-12 md:gap-16 items-start justify-center py-2">
          {showSkeleton
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`explore-skel-${index}`}
                  className="flex-shrink-0 w-20 sm:w-24 md:w-28"
                >
                  <ExploreGridSkeleton count={1} />
                </div>
              ))
            : items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-20 sm:w-24 md:w-28 transition-transform duration-300 hover:-translate-y-1.5 active:scale-95"
                  style={{
                    animation: `fade-in-up 0.4s ease-out ${index * 0.08}s backwards`,
                  }}
                >
                  <Link to={item.href} className="block w-full">
                    <div className="flex flex-col items-center gap-2.5 w-full group">
                      {/* Squircle card with warm cream background matching reference aesthetic */}
                      <div className="relative w-full aspect-square rounded-[1.6rem] bg-[#FFFDF9] dark:bg-[#1E1A16] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03)] group-hover:shadow-[0_14px_28px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-[#EDE8E0] dark:border-[#382E28] group-hover:border-primary/40">
                        {/* Shimmer sweep effect */}
                        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] w-[150%] animate-explore-shine"
                            style={{ animationDelay: `${4 + index * 0.6}s` }}
                          />
                        </div>
                        {/* 3D Icon */}
                        <InteractiveExploreIcon
                          label={item.label}
                          image={item.image}
                          fallbackImage={item.fallbackImage || item.image}
                          alt={item.label}
                          className="w-full h-full p-2 sm:p-2.5 relative z-10 transition-transform duration-300 group-hover:scale-108"
                        />
                      </div>
                      {/* Bold, prominent label matching reference image */}
                      <span className="text-xs sm:text-[13px] font-black text-[#2D3748] dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary transition-colors text-center tracking-wide leading-tight uppercase px-1">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { BookOpen, Clock, User, ArrowRight, Sparkles, Shield, Award, CheckCircle, Terminal, Layers } from 'lucide-react';

interface CourseCardProps {
  course: {
    _id: string;
    slug?: string;
    title: string;
    description?: string;
    shortDescription?: string;
    thumbnail?: string;
    instructor?: string;
    moduleCount?: number;
    lectureCount?: number;
    totalDuration?: string;
    type?: 'free' | 'paid';
    price?: number;
    currency?: string;
    category?: string;
    level?: string;
    isFeatured?: boolean;
    whatYouWillLearn?: string[];
    tags?: string[];
    hasDiscount?: boolean;
    discountPrice?: number;
    discountPercent?: number;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const courseSlug = (course.slug && !course.slug.startsWith('http') && !course.slug.includes('/')) ? course.slug : course._id;
  const isTBC = course.type === 'paid' && (!course.price || course.price === 0);
  const isFree = !isTBC && (course.type === 'free' || !course.price || course.price === 0);
  const priceFormatted = isTBC ? 'To be confirmed' : isFree ? 'FREE' : `${course.currency || 'PKR'} ${(course.price || 0).toLocaleString()}`;
  const hasValidDiscount = !isFree && !isTBC && (course.hasDiscount || (typeof course.discountPrice === 'number' && course.discountPrice > 0)) && typeof course.discountPrice === 'number' && course.discountPrice > 0 && course.discountPrice < (course.price || 0);
  const discountPercent = course.discountPercent || (hasValidDiscount && course.price ? Math.round(((course.price - course.discountPrice!) / course.price) * 100) : 0);
  const category = course.category || 'Cyber Security';
  const level = course.level || 'Beginner to Advanced';

  // Dynamic banner background styling for courses without images
  const getBannerTheme = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('web') || c.includes('dev')) {
      return {
        icon: Terminal,
        tag: 'DEV TRACK',
        sub: 'Modern Engineering',
        bg: 'from-[#f4f8fb] via-slate-50 to-[#eaf3f7]/60',
        accent: 'text-[#0E8696]',
        border: 'border-[#d5e0e8]'
      };
    }
    if (c.includes('cloud') || c.includes('devops')) {
      return {
        icon: Layers,
        tag: 'INFRA TRACK',
        sub: 'Cloud Architecture',
        bg: 'from-[#f4f8fb] via-slate-50 to-[#eaf3f7]/60',
        accent: 'text-[#0E8696]',
        border: 'border-[#d5e0e8]'
      };
    }
    return {
      icon: Shield,
      tag: 'SECURITY TRACK',
      sub: 'Offensive & Defensive',
      bg: 'from-[#f4f8fb] via-slate-50 to-[#eaf3f7]/60',
      accent: 'text-[#0E8696]',
      border: 'border-[#d5e0e8]'
    };
  };

  const bannerTheme = getBannerTheme(category);
  const BannerIcon = bannerTheme.icon;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-[#d5e0e8] shadow-xs hover:shadow-xl hover:border-[#0b4a66] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden">
      
      {/* Dynamic Banner Stage (Bright Theme) */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 border-b border-[#d5e0e8]">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bannerTheme.bg} flex flex-col justify-between p-5 relative select-none`}>
            {/* Tech grid texture overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#d5e0e8_1px,transparent_1px),linear-gradient(to_bottom,#d5e0e8_1px,transparent_1px)] bg-[size:1.25rem_1.25rem] opacity-40" />
            
            {/* Top Row: Watermark Icon (Right Aligned to avoid overlapping top-left floating badges) */}
            <div className="relative z-10 flex items-center justify-end">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#d5e0e8] shadow-xs flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <BannerIcon className={`w-4 h-4 ${bannerTheme.accent}`} />
              </div>
            </div>

            {/* Center Graphic */}
            <div className="relative z-10 flex flex-col items-center justify-center py-2 text-center">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[#d5e0e8] shadow-xs flex items-center justify-center mb-1 group-hover:scale-110 group-hover:rotate-2 transition-all duration-300">
                <BannerIcon className={`w-6 h-6 ${bannerTheme.accent}`} />
              </div>
              <span className="text-xs font-bold text-[#021F37]">School of Information Security</span>
            </div>

            {/* Bottom: Subtitle / Track & Level */}
            <div className="relative z-10 flex items-center justify-between text-[10px] text-[#4d6477] font-medium pt-2 border-t border-[#d5e0e8]/80">
              <span className="font-semibold text-[#4d6477]">{bannerTheme.tag} • {bannerTheme.sub}</span>
              <span className="text-[#021F37] font-bold bg-white/80 px-2 py-0.5 rounded border border-[#d5e0e8]">{level}</span>
            </div>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shadow-xs ${
              isTBC ? 'bg-amber-600 text-white' : isFree ? 'bg-[#0b6f7c] text-white' : 'bg-slate-900 text-white'
            }`}
          >
            {isTBC ? 'FEE TBC' : isFree ? 'FREE ENROLLMENT' : 'PRO TRACK'}
          </span>
          {hasValidDiscount && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {course.isFeatured && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse-glow">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        {/* Category Pill (when thumbnail is custom image) */}
        {course.thumbnail && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-md text-[#021F37] border border-[#d5e0e8] shadow-xs">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 justify-between space-y-4">
        <div className="space-y-3">
          
          {/* Metadata Row: Lectures, Modules, Duration */}
          <div className="flex items-center justify-between text-[11px] text-[#4d6477] font-semibold border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#0E8696]" />
              <span>
                {course.moduleCount ? `${course.moduleCount} Modules • ` : ''}
                {course.lectureCount || 0} Lectures
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#5f7587]" />
              <span>{course.totalDuration || (course as any).duration || 'To be confirmed'}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-[#021F37] line-clamp-2 group-hover:text-[#0E8696] transition-colors leading-snug">
            <Link href={`/courses/${courseSlug}`}>
              {course.title}
            </Link>
          </h3>

          {/* Description */}
          {(course.shortDescription || course.description) && (
            <p className="text-xs text-[#4d6477] line-clamp-2 leading-relaxed">
              {course.shortDescription || course.description}
            </p>
          )}

          {/* Feature / Topic Tags (Rendered ONLY if admin added tags) */}
          {Array.isArray(course.tags) && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {course.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[#021F37] text-[10px] font-medium hover:bg-[#f4f8fb] hover:text-[#0b6f7c] transition-colors"
                >
                  <CheckCircle className="w-2.5 h-2.5 text-[#0E8696]" /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Instructor & Faculty (Shown only when instructor is assigned) */}
          {course.instructor && (
            <div className="flex items-center gap-2 pt-2 text-xs text-[#4d6477]">
              <div className="w-6 h-6 rounded-full bg-[#f4f8fb] text-[#0b6f7c] border border-[#d5e0e8] font-bold text-[10px] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {course.instructor.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-xs">Instructor: <strong className="font-semibold text-[#021F37]">{course.instructor}</strong></span>
            </div>
          )}
        </div>

        {/* Footer & Price & CTA */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5f7587] block tracking-wider">Tuition</span>
            {hasValidDiscount ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  {course.currency || 'PKR'} {course.discountPrice!.toLocaleString()}
                </span>
                <span className="text-xs text-[#5f7587] line-through font-semibold">
                  {course.currency || 'PKR'} {(course.price || 0).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className={`text-base sm:text-lg font-black ${isFree ? 'text-[#0E8696]' : 'text-[#021F37]'}`}>
                {priceFormatted}
              </span>
            )}
          </div>

          <Link
            href={`/courses/${courseSlug}`}
            className="group/btn inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0b6f7c] hover:bg-[#021F37] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            Explore Course
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}

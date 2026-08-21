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
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const courseSlug = (course.slug && !course.slug.startsWith('http') && !course.slug.includes('/')) ? course.slug : course._id;
  const isFree = course.type === 'free' || !course.price || course.price === 0;
  const priceFormatted = isFree ? 'FREE' : `${course.currency || 'PKR'} ${(course.price || 0).toLocaleString()}`;
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
        bg: 'from-slate-900 via-slate-950 to-blue-950',
        accent: 'text-blue-400',
        border: 'border-blue-500/20'
      };
    }
    if (c.includes('cloud') || c.includes('devops')) {
      return {
        icon: Layers,
        tag: 'INFRA TRACK',
        sub: 'Cloud Architecture',
        bg: 'from-slate-900 via-slate-950 to-slate-900',
        accent: 'text-sky-400',
        border: 'border-sky-500/20'
      };
    }
    return {
      icon: Shield,
      tag: 'SECURITY TRACK',
      sub: 'Offensive & Defensive',
      bg: 'from-slate-900 via-slate-950 to-indigo-950',
      accent: 'text-blue-400',
      border: 'border-blue-500/20'
    };
  };

  const bannerTheme = getBannerTheme(category);
  const BannerIcon = bannerTheme.icon;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-blue-500/60 transition-all duration-300 overflow-hidden">
      
      {/* Dynamic Banner Stage */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bannerTheme.bg} flex flex-col justify-between p-5 relative select-none border-b border-slate-800`}>
            {/* Tech grid texture overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20" />
            
            {/* Top Row: Track tag & watermark */}
            <div className="relative z-10 flex items-center justify-between">
              <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md bg-slate-900/90 border ${bannerTheme.border} ${bannerTheme.accent}`}>
                {bannerTheme.tag}
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <BannerIcon className={`w-4 h-4 ${bannerTheme.accent}`} />
              </div>
            </div>

            {/* Middle: Rich Course Title Showcase */}
            <div className="relative z-10 space-y-1">
              <h4 className="text-base sm:text-lg font-black text-white tracking-tight line-clamp-1 group-hover:text-blue-300 transition-colors">
                {course.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                CSZone Certified Curriculum
              </p>
            </div>

            {/* Bottom: Subtitle / Level */}
            <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-white/5">
              <span>{bannerTheme.sub}</span>
              <span className="text-slate-300 font-bold">{level}</span>
            </div>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase shadow-md ${
              isFree
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950/90 backdrop-blur-md text-white border border-slate-700'
            }`}
          >
            {isFree ? 'FREE ENROLLMENT' : 'PRO TRACK'}
          </span>
          {course.isFeatured && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        {/* Category Pill (when thumbnail is custom image) */}
        {course.thumbnail && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/85 backdrop-blur-md text-slate-200 border border-white/10">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 justify-between space-y-4">
        <div className="space-y-3">
          
          {/* Metadata Row: Lectures, Modules, Duration */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {course.moduleCount ? `${course.moduleCount} Modules • ` : ''}
                {course.lectureCount || 0} Lectures
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{course.totalDuration || '4 Hours'}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            <Link href={`/courses/${courseSlug}`}>
              {course.title}
            </Link>
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {course.shortDescription || course.description || 'Hands-on practical training designed by cybersecurity professionals.'}
          </p>

          {/* Feature Highlights Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
              <CheckCircle className="w-2.5 h-2.5 text-blue-500" /> Hands-on Labs
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
              <CheckCircle className="w-2.5 h-2.5 text-blue-500" /> Certificate
            </span>
          </div>

          {/* Instructor & Faculty */}
          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">
              CS
            </div>
            <span className="truncate text-xs">Faculty: <strong className="font-semibold text-slate-800">{course.instructor || 'CSZone Security Team'}</strong></span>
          </div>
        </div>

        {/* Footer & Price & CTA */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tuition</span>
            <span className={`text-base sm:text-lg font-black ${isFree ? 'text-blue-600' : 'text-slate-900'}`}>
              {priceFormatted}
            </span>
          </div>

          <Link
            href={`/courses/${courseSlug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all group-hover:gap-2 cursor-pointer shrink-0"
          >
            Explore Course
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

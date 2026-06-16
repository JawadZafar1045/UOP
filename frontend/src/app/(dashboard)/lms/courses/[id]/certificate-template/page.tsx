"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import * as lmsService from "@/services/lms.service";
import Link from "next/link";
import { ChevronLeft, Save, Image as ImageIcon, CheckCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";
export default function CertificateTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();
  const user = useStore((state) => state.user);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  
  // Design state
  const [backgroundColor, setBackgroundColor] = useState("#FAFAF7");
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [textColor, setTextColor] = useState("#1B3A5C");
  const [fontStyle, setFontStyle] = useState("serif");
  const [borderStyle, setBorderStyle] = useState("double");
  const [instituteName, setInstituteName] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);



  useEffect(() => {
    if (user && user.role !== "teacher" && user.role !== "admin") {
      router.push(`/lms/courses/${courseId}`);
      return;
    }

    const fetchData = async () => {
      try {
        const [courseData, templateRes] = await Promise.all([
          lmsService.getCourse(courseId),
          lmsService.getCertificateTemplate(courseId)
        ]);
        
        setCourse(courseData);
        
        if (templateRes?.data?.design) {
          const d = templateRes.data.design;
          if (d.backgroundColor) setBackgroundColor(d.backgroundColor);
          if (d.accentColor) setAccentColor(d.accentColor);
          if (d.textColor) setTextColor(d.textColor);
          if (d.fontStyle) setFontStyle(d.fontStyle);
          if (d.borderStyle) setBorderStyle(d.borderStyle);
          if (d.instituteName) setInstituteName(d.instituteName);
          if (d.signatoryName) setSignatoryName(d.signatoryName);
          if (d.signatoryTitle) setSignatoryTitle(d.signatoryTitle);
          if (d.logoUrl) setLogoUrl(d.logoUrl);
        }
        

      } catch (err) {
        console.error("Failed to load template", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, user, router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("backgroundColor", backgroundColor);
      formData.append("accentColor", accentColor);
      formData.append("textColor", textColor);
      formData.append("fontStyle", fontStyle);
      formData.append("borderStyle", borderStyle);
      formData.append("instituteName", instituteName);
      formData.append("signatoryName", signatoryName);
      formData.append("signatoryTitle", signatoryTitle);
      

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await lmsService.saveCertificateTemplate(courseId, formData);
      alert("Certificate template saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><Loader size="lg" text="Loading designer..." /></div>;

  // Compute CSS for preview
  let fontFamily = "Georgia, serif";
  if (fontStyle === "sans") fontFamily = "Arial, sans-serif";
  if (fontStyle === "elegant") fontFamily = "Palatino, Georgia, serif";

  let borderCSS = {};
  if (borderStyle === "double") {
    borderCSS = {
      border: `12px solid ${accentColor}`,
      outline: `4px solid ${accentColor}`,
      outlineOffset: "-20px",
    };
  } else if (borderStyle === "single") {
    borderCSS = { border: `8px solid ${accentColor}` };
  }

  return (
    <>

<div className="flex flex-col lg:flex-row gap-6 min-h-[800px]">
      {/* LEFT - CONTROLS (40%) */}
      <div className="w-full lg:w-2/5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-4">
          <Link href={`/lms/courses/${courseId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all group active:scale-[0.98] shadow-blue-500/20 w-fit">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to Course
          </Link>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Certificate Designer</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          {/* Colors */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <span className="text-xs font-mono text-slate-500">{backgroundColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Accent / Border</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <span className="text-xs font-mono text-slate-500">{accentColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                  <span className="text-xs font-mono text-slate-500">{textColor}</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Typography */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Typography</h3>
            <div className="flex gap-2">
              {[
                { id: "serif", label: "Serif" },
                { id: "sans", label: "Sans-Serif" },
                { id: "elegant", label: "Elegant" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setFontStyle(opt.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    fontStyle === opt.id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Border */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Border Style</h3>
            <div className="flex gap-2">
              {[
                { id: "double", label: "Double" },
                { id: "single", label: "Single" },
                { id: "none", label: "None" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setBorderStyle(opt.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    borderStyle === opt.id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Branding */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">College Branding</h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Institute Logo</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img src={logoUrl} alt="Logo" className="h-12 object-contain bg-slate-50 rounded border border-slate-200 p-1" />
                    <button onClick={() => { setLogoUrl(""); setLogoFile(null); }} className="text-[10px] text-red-500 hover:underline mt-1 block">Remove logo</button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Institute Name</label>
                <input type="text" value={instituteName} onChange={e => setInstituteName(e.target.value)} placeholder="e.g. NCBAE College"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Signatory Name</label>
                  <input type="text" value={signatoryName} onChange={e => setSignatoryName(e.target.value)} placeholder="e.g. Dr. Ahmed"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Signatory Title</label>
                  <input type="text" value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} placeholder="e.g. Director"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50">
          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Template</>}
          </button>
        </div>
      </div>

      {/* RIGHT - LIVE PREVIEW (60%) */}
      <div className="w-full lg:w-3/5 flex flex-col bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-200/50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Live Preview (A4 Scaled)
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-start lg:justify-center p-4 md:p-8 overflow-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] min-h-[500px]">
          {/* We scale the 1122x794 div so it fits visually in the container */}
            <div className="shadow-2xl bg-white origin-center shrink-0" style={{ width: 1122, height: 794, transform: 'scale(0.55)', backgroundColor, color: textColor, fontFamily }}>
              <div style={{ ...borderCSS, width: '100%', height: '100%', padding: 40, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                
                {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxHeight: 80, marginBottom: 20 }} />}
                
                <h1 style={{ fontSize: 46, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 4, margin: '0 0 10px 0', color: textColor, textAlign: 'center' }}>
                  Certificate of Completion
                </h1>
                
                <div style={{ width: 120, height: 4, backgroundColor: accentColor, margin: '10px 0 30px 0' }} />
                
                <div style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 20, color: '#666' }}>
                  This is to certify that
                </div>
                
                <div style={{ fontSize: 48, fontWeight: 'bold', color: accentColor, marginBottom: 20, textAlign: 'center', fontFamily: "'Times New Roman', serif", borderBottom: '2px solid #ccc', paddingBottom: 5, width: '70%' }}>
                  Muhammad Ali
                </div>
                
                <div style={{ fontSize: 20, fontStyle: 'italic', marginBottom: 20, color: '#666' }}>
                  has successfully completed the course
                </div>
                
                <div style={{ fontSize: 28, fontWeight: 'bold', margin: '20px 0', textAlign: 'center' }}>
                  {course?.title || "Advanced Web Development"}
                </div>
                
                <div style={{ fontSize: 16, color: '#555', marginBottom: 30 }}>
                  Attendance: 85% &nbsp; | &nbsp; Overall Score: 78%
                </div>
                
                <div style={{ fontSize: 18, marginBottom: 40 }}>
                  Issued on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', marginTop: 'auto', marginBottom: 40 }}>
                  <div style={{ textAlign: 'center', width: 250 }}>
                    <div style={{ borderTop: `1px solid ${textColor}`, marginBottom: 8, paddingTop: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 'bold' }}>{signatoryName || "Course Instructor"}</div>
                      <div style={{ fontSize: 14, color: '#666' }}>{signatoryTitle || "Lead Instructor"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', width: 250 }}>
                    <div style={{ borderTop: `1px solid ${textColor}`, marginBottom: 8, paddingTop: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 'bold' }}>{instituteName || "Educational Institute"}</div>
                      <div style={{ fontSize: 14, color: '#666' }}>Issuing Authority</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ position: 'absolute', bottom: 20, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontFamily: 'sans-serif' }}>
                  <div>Certificate ID: CS-ZONE-2026-00001</div>
                  <div>Verify: /verify/example-uuid</div>
                </div>

              </div>
            </div>
        </div>
      </div>
    </div>
    </>
  );
}

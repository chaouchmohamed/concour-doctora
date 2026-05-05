import React, { useState, useRef, useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import { BookOpen, Building2, Calendar, FileText, Briefcase, Plus, CheckCircle2, ChevronDown, Check } from "lucide-react";
import { ROUTES, cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// Helper routines for academic years
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, 8 is September
  if (month >= 8) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

const getAcademicYears = () => {
  const current = new Date().getFullYear();
  const years = [];
  for (let i = -2; i <= 4; i++) {
    years.push(`${current + i - 1}/${current + i}`);
  }
  return years.map(y => ({ value: y, label: y }));
};

const FACULTIES = [
  { value: "Computer Science", label: "Computer Science" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Physics", label: "Physics" },
  { value: "Biology", label: "Biology" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Engineering", label: "Engineering" },
];

const TYPES = [
  { value: "National", label: "National" },
  { value: "Local", label: "Local" },
  { value: "Internal", label: "Internal" },
  { value: "Regional", label: "Regional" },
  { value: "International", label: "International" },
  { value: "Special", label: "Special" },
];

const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  icon: Icon, 
  placeholder 
}: { 
  value: string; 
  options: {value: string, label: string}[]; 
  onChange: (v: string) => void;
  icon: React.ElementType;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-11 px-4 text-[13px] bg-[#FAFAFA] border rounded-xl cursor-pointer transition-all focus-visible:outline-none",
          isOpen ? "border-[#8B7355] ring-2 ring-[#8B7355]/20 bg-white" : "border-[#EBEBEB] hover:border-[#CACACA]",
          !selectedOption ? "text-[#9B9B9B]" : "text-[#1A1A1A]"
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-[#9B9B9B]" />}
          <span className={cn("ml-1 font-medium", !selectedOption && "font-normal")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={14} className={cn("text-[#9B9B9B] transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] border border-border overflow-hidden p-1.5 z-50 flex flex-col gap-0.5 max-h-[240px] overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={cn(
                    "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer border border-transparent",
                    isSelected ? "bg-[#8B7355]/5 border-[#8B7355]/10" : "hover:bg-[#FAFAFA] hover:border-border/50"
                  )}
                >
                  <span className={cn("text-[13px]", isSelected ? "text-[#8B7355] font-bold" : "text-[#1A1A1A] font-medium")}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#8B7355] flex items-center justify-center shadow-sm">
                      <Check size={12} strokeWidth={3} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CreateConcourPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    faculty: "",
    academicYear: getCurrentAcademicYear(),
    description: "",
    concoursType: "National",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.faculty || !formData.academicYear || !formData.concoursType) {
      // Basic validation handled by native forms, but custom selects don't trigger native HTML required easily without hidden inputs.
      // We will assume validation passes if values are selected.
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 2000);
    }, 1200);
  };

  return (
    <AppShell title="Create Concour">
      <div className="h-full flex flex-col items-center justify-start pt-8 pb-4 px-4 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-2">Create New Concour</h2>
            <p className="text-[13px] text-[#6B6B6B]">
              Configure the details for a new concours session. Choose from the available structured options.
            </p>
          </div>

          <Card className="p-6 md:p-8 bg-white border border-[#EBEBEB] shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#1A1A1A] block">
                  Concours Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
                    <BookOpen size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doctorate in Computer Science 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 text-[13px] bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all"
                  />
                </div>
              </div>

              {/* Faculty & Academic Year Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#1A1A1A] block">
                    Faculty / Department <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect 
                    value={formData.faculty} 
                    onChange={(v) => setFormData({ ...formData, faculty: v })} 
                    options={FACULTIES}
                    icon={Building2}
                    placeholder="Select Faculty"
                  />
                  {/* Hidden required input for native form validation */}
                  <input type="text" value={formData.faculty} required className="hidden" readOnly />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#1A1A1A] block">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect 
                    value={formData.academicYear} 
                    onChange={(v) => setFormData({ ...formData, academicYear: v })} 
                    options={getAcademicYears()}
                    icon={Calendar}
                    placeholder="Select Year"
                  />
                  <input type="text" value={formData.academicYear} required className="hidden" readOnly />
                </div>
              </div>

              {/* Concours Type */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#1A1A1A] block">
                  Concours Type <span className="text-red-500">*</span>
                </label>
                <CustomSelect 
                  value={formData.concoursType} 
                  onChange={(v) => setFormData({ ...formData, concoursType: v })} 
                  options={TYPES}
                  icon={Briefcase}
                  placeholder="Select Type"
                />
                <input type="text" value={formData.concoursType} required className="hidden" readOnly />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#1A1A1A] block">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-[#9B9B9B]">
                    <FileText size={16} />
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Enter any additional details about this concours..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full py-3 pl-10 pr-4 text-[13px] bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all resize-none custom-scrollbar"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  className="px-5 py-2.5 rounded-xl border border-[#EBEBEB] bg-white text-[13px] font-semibold text-[#555] hover:bg-[#FAFAFA] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || success}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B7355] text-white text-[13px] font-bold hover:bg-[#7a6348] transition-all shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : success ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {isSubmitting ? "Creating..." : success ? "Created Successfully!" : "Create Concour"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

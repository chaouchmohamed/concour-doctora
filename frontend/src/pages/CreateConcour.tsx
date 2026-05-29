import React, { useEffect, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/UI";
import {
  BadgeHelp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  Info,
  PanelTopOpen,
  Plus,
  Shield,
  Tag,
} from "lucide-react";
import { ROUTES, cn } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const SESSION_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

const CustomSelect = ({
  value,
  options,
  onChange,
  icon: Icon,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex items-center justify-between w-full h-11 px-4 text-[13px] bg-[#FAFAFA] border rounded-xl cursor-pointer transition-all focus-visible:outline-none",
          isOpen ? "border-[#8B7355] ring-2 ring-[#8B7355]/20 bg-white" : "border-[#EBEBEB] hover:border-[#CACACA]",
          !selectedOption ? "text-[#9B9B9B]" : "text-[#1A1A1A]"
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-[#9B9B9B]" />}
          <span className={cn("ml-1 font-medium", !selectedOption && "font-normal")}>{selectedOption ? selectedOption.label : placeholder}</span>
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
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer border border-transparent",
                    isSelected ? "bg-[#8B7355]/5 border-[#8B7355]/10" : "hover:bg-[#FAFAFA] hover:border-border/50"
                  )}
                >
                  <span className={cn("text-[13px]", isSelected ? "text-[#8B7355] font-bold" : "text-[#1A1A1A] font-medium")}>{option.label}</span>
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
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    year: String(new Date().getFullYear()),
    date: new Date().toISOString().slice(0, 10),
    status: "DRAFT",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.year || !formData.date) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const requestBody = {
      name: formData.name.trim(),
      year: Number(formData.year),
      date: formData.date,
      status: formData.status as "DRAFT" | "ACTIVE" | "CLOSED",
      description: formData.description.trim(),
    };

    console.groupCollapsed("Create exam session request");
    console.log("POST /api/examinations/sessions/");
    console.log("request body", requestBody);

    try {
      const response = await api.sessions.create(requestBody);
      console.log("response", response);
      console.groupEnd();

      setSuccess(true);
      setTimeout(() => navigate(ROUTES.DASHBOARD), 1800);
    } catch (submitError) {
      console.error("response error", submitError);
      console.groupEnd();
      setError(submitError instanceof Error ? submitError.message : "Unable to create exam session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Create Session">
      <div className="h-full flex flex-col items-center justify-start pt-8 pb-4 px-4 overflow-y-auto bg-gradient-to-b from-[#FCFCFA] via-white to-[#F8F6F2]">
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-2">Create Exam Session</h2>
            <p className="text-[13px] text-[#6B6B6B]">
              Create a new exam session using the fields below.
            </p>
          </div>

          <Card className="p-6 md:p-8 bg-white border border-[#EBEBEB] shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#1A1A1A] block">
                    Session Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
                      <FileText size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Automne 2026"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 text-[13px] bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A] block">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
                        <Hash size={16} />
                      </div>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        required
                        placeholder="2026"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full h-11 pl-10 pr-4 text-[13px] bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#1A1A1A] block">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
                        <Calendar size={16} />
                      </div>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full h-11 pl-10 pr-4 text-[13px] bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#1A1A1A] block">Status</label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(v) => setFormData({ ...formData, status: v })}
                    options={SESSION_STATUSES}
                    icon={Tag}
                    placeholder="Select status"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#1A1A1A] block">Description</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-[#9B9B9B]">
                      <FileText size={16} />
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Doctoral concours session 2026"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full py-3 pl-10 pr-4 text-[13px] bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] transition-all resize-none custom-scrollbar"
                    />
                  </div>
                </div>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

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
                    {isSubmitting ? "Creating..." : success ? "Created Successfully!" : "Create Session"}
                  </button>
                </div>
              </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

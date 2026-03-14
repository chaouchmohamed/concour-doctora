import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, PenLine, WifiOff, ShieldCheck, CheckCircle, EyeOff, BarChart2 } from 'lucide-react';
import { ROUTES } from '../constants';
import { motion } from 'motion/react';
import doctorImg from '../assets/doctor.png';
import iconImg from '../assets/Icon.png';
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-[Inter,sans-serif]">

      {/* ─── NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-[1400px] mx-auto px-6 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 ">
            <div className='bg-[#8B7355] w-[30px] h-[30px] flex items-center pl-[0.5px] justify-center rounded-full'>
              <img src={iconImg} />
            </div>
            <span className="font-bold text-[15px] text-[#1A1A1A] tracking-tight">ConcoursDoctor</span>
          </div>
          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <a href="#workflow" className="text-[14px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              How it works
            </a>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center h-[36px] px-5 bg-[#8B7355] text-white text-[14px] font-medium rounded-md hover:bg-[#7A6448] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="relative bg-white pt-[72px] pb-[80px] overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#F5F0E8] opacity-40 blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#EDE9E0] opacity-30 blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-[1.8px] rounded-full border border-[#D4C4A0] bg-[#FAF7F2]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8B7355]" />
                <span className="text-[11px] font-semibold text-[#8B7355] uppercase tracking-widest">
                  Institutional Grade Security
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[44px]  lg:text-[52px] font-[Inter,sans-serif] font-black tracking-wider text-[#1A1A1A] leading-[1.05] mb-6">
                Modernizing<br />
                Medical<br />
                Examinations with<br />
                <span className="text-[#8B7355] text-[44px] font-black lg:text-[52px] font-[Inter,sans-serif] font-bold">Precision</span>
              </h1>

              {/* Sub */}
              <p className="text-[16px] text-[#5A5A5A] leading-relaxed mb-8 max-w-[460px]">
                The all-in-one platform for secure candidate management, offline attendance, and double-blind correction. Designed for excellence in medical education.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-3">
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 h-[48px] px-7 bg-[#8B7355] text-white text-[15px] font-semibold rounded-lg hover:bg-[#2D2D2D] transition-colors"
                >
                  Request demo <ArrowRight size={18} />
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 h-[48px] px-7 border border-[#D4D4D4] text-[#A39275] text-[15px] font-semibold rounded-lg hover:bg-[#F9F9F9] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </motion.div>
            {/* Right — Device Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              className="relative flex items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{
                  duration: 4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 0,
                }}
                className="relative flex items-center justify-center"
              >
                <div className="relative w-[380px] h-[515px]">

                  {/* Tablet frame — rotated ~4deg clockwise */}
                  <div
                    className="absolute inset-0"
                    style={{ transform: 'rotate(3deg)', transformOrigin: 'center bottom' }}
                  >
                    <div className="w-full h-full bg-white rounded-[28px] border-[8px] border-[#1E2A3A] shadow-[0_32px_64px_rgba(0,0,0,0.15)] overflow-hidden relative">
                      <img
                        src={doctorImg}
                        alt="Doctor with tablet"
                        className="w-full h-full object-cover"
                        style={{ transform: 'scale(1.08)' }}
                      />
                      <div className="absolute inset-0 bg-[rgba(210,215,220,0.25)]" />
                      <div className="absolute top-[20px] right-[20px] w-4.5 h-4.5 rounded-full bg-[#999] opacity-40" />
                    </div>
                  </div>

                  {/* Overlay UI — form bars */}
                  <div className="absolute rotate-3 top-[44px] left-[53px] flex flex-col gap-[10px] w-[290px] z-10">
                    <div className="flex items-center gap-3 relative">
                      <div className="w-[26px] h-[26px] rounded-[8px] bg-[#A09070] shrink-0 absolute top-1 left-3 z-200 opacity-90" />
                      <div className="h-[35px] bg-white/82 rounded-[8px] flex-1 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] ml-2 opacity-50" />
                    </div>
                    <div className="h-[35px] bg-white/75 rounded-[8px] backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] ml-2 opacity-50" />
                    <div className="h-[35px] bg-white/70 rounded-[8px] backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] ml-2 opacity-50" />
                    <div className="h-[35px] bg-white/65 rounded-[8px] backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.05)] ml-2 opacity-50" />
                  </div>

                  {/* Floating stat card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
                    transition={{
                      opacity: { duration: 0.5, delay: 0 },
                      scale: { duration: 0.5, delay: 0 },
                      y: {
                        duration: 4,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: 0,
                      }
                    }}
                    className="absolute -bottom-[-55px] -left-33 rotate-[-3deg] bg-white rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#EBEBEB] p-5 w-[320px] z-20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#F0EDE7] flex items-center justify-center">
                        <BarChart2 size={16} className="text-[#8B7355]" />
                      </div>
                      <span className="text-[11px] font-bold text-[#8B7355] uppercase tracking-wider">Live Statistics</span>
                    </div>
                    <p className="text-[22px] font-bold text-[#1A1A1A] mb-3">98.4% Sync Rate</p>
                    <div className="flex items-end gap-[6px] h-9">
                      {[
                        { h: 50, color: '#D4CBBA' },
                        { h: 62, color: '#C4B99A' },
                        { h: 56, color: '#B8AE92' },
                        { h: 100, color: '#8B7355' },
                        { h: 68, color: '#C4B99A' },
                        { h: 52, color: '#D4CBBA' },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded"
                          style={{ height: `${bar.h}%`, background: bar.color }}
                        />
                      ))}
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE CARDS ───────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto ">
          <div className="flex flex-col md:flex-row justify-evenly items-center gap-12">
            {[
              {
                icon: <Upload size={22} className="text-[#6B6B6B]" />,
                title: 'Automated Import',
                desc: 'Bulk candidate data processing with ease. Support for multiple formats and intelligent validation to prevent data entry errors.'
              },
              {
                icon: <WifiOff size={22} className="text-[#6B6B6B]" />,
                title: 'Offline-friendly PWA',
                desc: 'Record attendance anywhere, sync when back online. Our Progressive Web App ensures reliability even in large amphitheatres with poor signal.'
              },
              {
                icon: <EyeOff size={22} className="text-[#6B6B6B]" />,
                title: 'Double-blind Correction',
                desc: 'Ensure fairness with anonymous grading workflows. Completely detach candidate identities from their scripts during the correction phase.'
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-[#EBEBEB] bg-[#F0EDE8] hover:border-[#D4C4A0] hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-white border border-[#EBEBEB] flex items-center justify-center mb-5 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="text-[17px] font-bold text-[#1A1A1A] mb-3">{f.title}</h3>
                <p className="text-[14px] text-[#6B6B6B] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WORKFLOW ────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 bg-[#F8FAFC]">
        <div className="w-[97%] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-bold text-[#1A1A1A] mb-3">The ConcoursDoctor Workflow</h2>
            <p className="text-[15px] text-[#6B6B6B]">A standardized path from initial data collection to final academic results.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {[
              { n: '1', title: 'Import', desc: 'Upload and validate candidate databases securely.', icon: <Upload size={22} className="text-[#8B7355]" /> },
              { n: '2', title: 'Anonymize', desc: 'Generate secure barcodes and remove identity markers.', icon: <ShieldCheck size={22} className="text-[#8B7355]" /> },
              { n: '3', title: 'Correct', desc: 'Double-blind grading with integrated conflict resolution.', icon: <PenLine size={22} className="text-[#8B7355]" /> },
              { n: '4', title: 'Deliberate', desc: 'Final verification and official result publication.', icon: <CheckCircle size={22} className="text-[#8B7355]" /> },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-[#EEEEEE] px-6 py-8 flex flex-col items-center text-center shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-[#8B7355] text-white flex items-center justify-center text-[16px] font-bold mb-4 shadow-sm">
                  {step.n}
                </div>
                <div className="mb-4">
                  {step.icon}
                </div>
                <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-2">{step.title}</h4>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#EBEBEB] pt-14 pb-8">
        <div className=" w-full px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className='bg-[#8B7355] w-[30px] h-[30px] flex items-center pl-[0.5px] justify-center rounded-full'>
                  <img src={iconImg} />
                </div>                <span className="font-bold text-[15px] text-[#1A1A1A]">ConcoursDoctor</span>
              </div>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed max-w-[220px]">
                Leading the modernisation of medical examinations through secure, efficient, and fair digital processes.
              </p>
            </div>

            {/* Resources */}
            <div>
              <h5 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">Resources</h5>
              <ul className="space-y-3">
                {['Docs', 'Support', 'Case Studies'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-[14px] text-[#6B6B6B] hover:text-[#8B7355] transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider mb-4">Legal</h5>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Cookie Policy'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-[14px] text-[#6B6B6B] hover:text-[#8B7355] transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="border-t border-[#EBEBEB] pt-6">
            <p className="text-[13px] text-[#9A9A9A] text-center">
              © 2024 ConcoursDoctor. All rights reserved. Precision in Academic Excellence.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
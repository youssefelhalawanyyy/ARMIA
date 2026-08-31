'use client';

import React, { useState } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
  const { success } = useToast();
  const { isArabic } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'wholesale',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    success(
      isArabic ? 'تم إرسال استفسارك بنجاح لفريق أرميا' : 'Your inquiry has been sent to the ARMIA team',
      isArabic ? 'تم الإرسال' : 'Inquiry Sent'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              {isArabic ? 'تواصلي مع أرميا بوتيك' : 'Connect With Us'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              {isArabic ? 'خدمة العملاء وطلبات الجملة' : 'WHOLESALE & SUPPORT'}
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              {isArabic
                ? 'يسعدنا دائماً الإجابة عن أي استفسار بخصوص طلباتك، المقاسات الخاصة، أو توريد الجملة للبوتيكات.'
                : 'Have questions about your order, custom sizing, or boutique wholesale distribution? We are delighted to assist.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E8E2D8] p-8 space-y-6 rounded-xl shadow-sm">
                <h3 className="font-serif text-xl font-bold text-[#1F1F1F] border-b border-[#E8E2D8] pb-3">
                  {isArabic ? 'بيانات التواصل الرسمية' : 'Boutique Contacts'}
                </h3>

                <div className="space-y-4 text-xs font-sans text-[#1F1F1F]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#B67355] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm">
                        {isArabic ? 'الأتيليه وصالة العرض' : 'Cairo Atelier & Showroom'}
                      </strong>
                      <p className="text-[#8E8A85] mt-0.5">
                        {isArabic ? 'القاهرة والإسكندرية، جمهورية مصر العربية' : 'Cairo & Alexandria, Egypt'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#B67355] shrink-0" />
                    <div>
                      <strong className="block text-sm">
                        {isArabic ? 'المكالمات وخدمة العملاء' : 'Calls & Customer Hotline'}
                      </strong>
                      <a href="tel:01220859992" className="text-[#8E8A85] hover:text-[#1F1F1F] font-mono" dir="ltr">
                        +20 122 085 9992
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#B67355] shrink-0" />
                    <div>
                      <strong className="block text-sm">
                        {isArabic ? 'البريد الإلكتروني المباشر' : 'Direct Email'}
                      </strong>
                      <a href="mailto:armiaboutique1@gmail.com" className="text-[#8E8A85] hover:text-[#1F1F1F]">
                        armiaboutique1@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#B67355] shrink-0" />
                    <div>
                      <strong className="block text-sm">
                        {isArabic ? 'حساب إنستاباي (Instapay)' : 'Instapay Account'}
                      </strong>
                      <p className="text-[#8E8A85] font-mono">01204000195</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp button */}
                <div className="pt-4 border-t border-[#E8E2D8] space-y-3">
                  <a
                    href="https://wa.me/201220859992"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#25D366] text-white py-3 px-4 text-xs uppercase tracking-wider font-sans font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md rounded"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isArabic ? 'محادثة واتساب فورية (01220859992)' : 'Instant WhatsApp (01220859992)'}</span>
                  </a>

                  {/* Social links row */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <a
                      href="https://www.instagram.com/armia.boutique.eg?igsi=OGN5a3pyYXl0NW8w"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-[#F6F3EE] hover:bg-[#DCC9A6] text-[#1F1F1F] rounded-full transition-colors"
                      title="Instagram"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>

                    <a
                      href="https://www.tiktok.com/@armia.boutique.eg?_r=1&_t=ZS-99LEBpU9Yps"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-[#F6F3EE] hover:bg-[#DCC9A6] text-[#1F1F1F] rounded-full transition-colors"
                      title="TikTok"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46 6.27 6.27 0 0 0 1.95-4.46V8.75a8.28 8.28 0 0 0 4.78 1.5V6.8a4.82 4.82 0 0 1-1-.11z"/>
                      </svg>
                    </a>

                    <a
                      href="https://www.facebook.com/share/1DaZbKyCRd/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-[#F6F3EE] hover:bg-[#DCC9A6] text-[#1F1F1F] rounded-full transition-colors"
                      title="Facebook"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.592 0 9 1.582 9 4.615V8z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiry Form (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-[#E8E2D8] p-8 shadow-sm rounded-xl">
                <h3 className="font-serif text-xl font-bold text-[#1F1F1F] mb-1">
                  {isArabic ? 'إرسال طلب أو استفسار' : 'Send an Inquiry'}
                </h3>
                <p className="text-xs text-[#8E8A85] font-sans mb-6">
                  {isArabic
                    ? 'يرجى كتابة تفاصيل استفسارك وسيقوم فريق أرميا بالرد عليكِ خلال 24 ساعة.'
                    : 'Fill in your details below and our boutique director will reply within 24 hours.'}
                </p>

                {submitted ? (
                  <div className="p-8 text-center bg-[#F6F3EE] border border-[#E8E2D8] rounded-lg">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-serif text-lg font-bold text-[#1F1F1F]">
                      {isArabic ? 'تم استلام استفسارك بنجاح' : 'Inquiry Received'}
                    </h4>
                    <p className="text-xs text-[#8E8A85] font-sans mt-1 mb-4">
                      {isArabic
                        ? 'شكراً لتواصلكِ مع أرميا بوتيك. سنتواصل معكِ في أقرب وقت.'
                        : 'Thank you for reaching out to ARMIA Boutique. We will contact you shortly.'}
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs uppercase tracking-wider text-[#B67355] font-semibold underline"
                    >
                      {isArabic ? 'إرسال رسالة أخرى' : 'Send another message'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          {isArabic ? 'الاسم بالكامل *' : 'Your Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={isArabic ? 'مثال: سارة محمد' : 'e.g. Salma Hassan'}
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          {isArabic ? 'البريد الإلكتروني *' : 'Email Address *'}
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="salma@example.com"
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          {isArabic ? 'رقم الهاتف (مصر) *' : 'Phone Number (Egypt) *'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="012XXXXXXXX"
                          dir="ltr"
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          {isArabic ? 'نوع الاستفسار' : 'Inquiry Type'}
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans text-[#1F1F1F] focus:outline-none focus:border-[#B67355] rounded"
                        >
                          <option value="wholesale">
                            {isArabic ? 'شراكة وطلبات جملة للبوتيكات' : 'Wholesale Boutique Partnership'}
                          </option>
                          <option value="order">
                            {isArabic ? 'تتبع وتأكيد طلب حالي' : 'Order Tracking & Support'}
                          </option>
                          <option value="general">
                            {isArabic ? 'استفسار عام' : 'General Inquiry'}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                        {isArabic ? 'تفاصيل الرسالة أو الطلب *' : 'Your Message / Requirements *'}
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={
                          isArabic
                            ? 'اكتبي تفاصيل استفساركِ أو متطلبات الجملة والمقاسات...'
                            : 'Tell us about your boutique location, estimated order quantities, or specific pieces of interest...'
                        }
                        className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-md rounded"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isArabic ? 'إرسال الاستفسار' : 'Submit Inquiry'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

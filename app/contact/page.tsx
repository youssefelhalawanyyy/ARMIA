'use client';

import React, { useState } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ContactPage() {
  const { success } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'wholesale', // or retail
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    success('Your inquiry has been sent to the ARMIA team', 'Inquiry Sent');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              Connect With Us
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              WHOLESALE & SUPPORT
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              Have questions about your order, custom sizing, or boutique wholesale distribution? We are delighted to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Details (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E8E2D8] p-8 space-y-6">
                <h3 className="font-serif text-xl font-bold text-[#1F1F1F] border-b border-[#E8E2D8] pb-3">
                  Boutique Contacts
                </h3>

                <div className="space-y-4 text-xs font-sans text-[#1F1F1F]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#B67355] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm">Cairo Atelier & Showroom</strong>
                      <p className="text-[#8E8A85] mt-0.5">
                        New Cairo & Heliopolis, Cairo, Egypt
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#B67355] shrink-0" />
                    <div>
                      <strong className="block text-sm">Customer & Wholesale Hotline</strong>
                      <p className="text-[#8E8A85]">+20 100 123 4567 (10 AM - 9 PM)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#B67355] shrink-0" />
                    <div>
                      <strong className="block text-sm">Direct Email</strong>
                      <p className="text-[#8E8A85]">support@armiaboutique.com</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp button */}
                <div className="pt-4 border-t border-[#E8E2D8]">
                  <a
                    href="https://wa.me/201001234567"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#25D366] text-white py-3 px-4 text-xs uppercase tracking-wider font-sans font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Instant WhatsApp Chat</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Inquiry Form (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-[#E8E2D8] p-8 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-[#1F1F1F] mb-1">
                  Send an Inquiry
                </h3>
                <p className="text-xs text-[#8E8A85] font-sans mb-6">
                  Fill in your details below and our boutique director will reply within 24 hours.
                </p>

                {submitted ? (
                  <div className="p-8 text-center bg-[#F6F3EE] border border-[#E8E2D8]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-serif text-lg font-bold text-[#1F1F1F]">
                      Inquiry Received
                    </h4>
                    <p className="text-xs text-[#8E8A85] font-sans mt-1 mb-4">
                      Thank you for reaching out to ARMIA Boutique. We will contact you shortly.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs uppercase tracking-wider text-[#B67355] font-semibold underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Salma Hassan"
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="salma@example.com"
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          Phone Number (Egypt) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="010XXXXXXXX"
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                          Inquiry Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans text-[#1F1F1F] focus:outline-none focus:border-[#B67355]"
                        >
                          <option value="wholesale">Wholesale Boutique Partnership</option>
                          <option value="order">Order Tracking & Support</option>
                          <option value="general">General Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F] mb-1">
                        Your Message / Requirements *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your boutique location, estimated order quantities, or specific pieces of interest..."
                        className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
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

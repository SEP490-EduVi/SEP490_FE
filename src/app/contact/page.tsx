'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, MessageCircle, Clock } from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      toast.success('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Bạn có câu hỏi, góp ý hay cần hỗ trợ? Đội ngũ EduVi luôn sẵn sàng giúp đỡ bạn.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h2>
                <div className="space-y-5">
                  {[
                    { icon: Mail, label: 'Email', value: 'support@eduvi.tech', href: 'mailto:support@eduvi.tech' },
                    { icon: Phone, label: 'Hotline', value: '1900-xxxx', href: 'tel:1900xxxx' },
                    { icon: MapPin, label: 'Địa chỉ', value: 'TP. Hồ Chí Minh, Việt Nam', href: undefined },
                    { icon: Clock, label: 'Giờ làm việc', value: 'Thứ 2 - Thứ 6: 8:00 - 17:30', href: undefined },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="text-gray-900 font-medium hover:text-green-600 transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-gray-900 font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Hỗ trợ nhanh</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Đối với các vấn đề kỹ thuật khẩn cấp, vui lòng gửi email đến{' '}
                  <a href="mailto:support@eduvi.tech" className="text-green-600 font-medium hover:underline">
                    support@eduvi.tech
                  </a>{' '}
                  để được hỗ trợ nhanh nhất.
                </p>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h3>
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Chủ đề
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white"
                    >
                      <option value="">-- Chọn chủ đề --</option>
                      <option value="support">Hỗ trợ kỹ thuật</option>
                      <option value="billing">Thanh toán & gói dịch vụ</option>
                      <option value="feedback">Góp ý sản phẩm</option>
                      <option value="partnership">Hợp tác</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Nội dung <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Mô tả chi tiết câu hỏi hoặc vấn đề của bạn..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {sending ? 'Đang gửi...' : (
                      <>
                        <Send className="w-4 h-4" />
                        Gửi tin nhắn
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

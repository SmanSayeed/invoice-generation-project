"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Printer,
  CreditCard,
  FileText,
  Stamp,
  Image as ImageIcon,
  Calendar,
  Award,
  Star,
  ArrowUp,
  PhoneCall,
  Menu
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";


// Services list - 16 items for 2 columns (8x8)
const services = [
  // Column 1
  { name: "মানি রিসিট", nameEn: "Money Receipt", icon: FileText },
  { name: "রেজাল্ট কার্ড", nameEn: "Result Card", icon: Award },
  { name: "বেতন কার্ড", nameEn: "Salary Card", icon: CreditCard },
  { name: "মাহফিল কুপন", nameEn: "Mahfil Coupon", icon: FileText },
  { name: "রমজানের ক্যালেন্ডার", nameEn: "Ramadan Calendar", icon: Calendar },
  { name: "নতুন বছরের ক্যালেন্ডার", nameEn: "New Year Calendar", icon: Calendar },
  { name: "নির্বাচন পোস্টার", nameEn: "Election Poster", icon: ImageIcon },
  { name: "মাহফিল পোস্টার", nameEn: "Mahfil Poster", icon: ImageIcon },
  { name: "স্কুলের খাতা", nameEn: "School Notebook", icon: FileText },
  { name: "পরীক্ষার খাতা", nameEn: "Exam Notebook", icon: FileText },
  { name: "স্কুলের সিলেবাস", nameEn: "School Syllabus", icon: FileText },
  { name: "স্কুল ডায়রী", nameEn: "School Diary", icon: FileText },

  // Column 2
  { name: "সকল প্রকার ক্রেস্ট", nameEn: "All Kinds of Crests", icon: Award },
  { name: "স্টুডেন্ট আইডি কার্ড", nameEn: "Student ID Card", icon: CreditCard },
  { name: "আইডি কার্ড ফিতা", nameEn: "ID Card Ribbon", icon: CreditCard },
  { name: "কাপড় প্রিন্ট", nameEn: "Cloth Print", icon: Printer },
  { name: "ডিটিএফ প্রিন্ট", nameEn: "DTF Print", icon: Printer },
  { name: "গেঞ্জি প্রিন্ট", nameEn: "T-shirt Print", icon: Printer },
  { name: "মগ প্রিন্ট", nameEn: "Mug Print", icon: Printer },
  { name: "কলম প্রিন্ট", nameEn: "Pen Print", icon: Printer },
  { name: "চাবির রিং প্রিন্ট", nameEn: "Key Ring Print", icon: Printer },
  { name: "অটো সিল", nameEn: "Auto Seal", icon: Stamp },
  { name: "রাবার সিল", nameEn: "Rubber Seal", icon: Stamp },
  { name: "ডিজিটাল সিল", nameEn: "Digital Seal", icon: Stamp },
];

// Gallery items
const galleryItems = [
  { src: "/images/japanese-hamada.jpeg", title: "Japanese Hamada Machine", titleBn: "জাপানিজ হামাদা মেশিন" },
  { src: "/images/chinese-cutting.jpeg", title: "Chinese Cutting Machine", titleBn: "চাইনিজ কাটিং মেশিন" },
  { src: "/images/japanese-hasi.jpeg", title: "Japanese Hasi Machine", titleBn: "জাপানিজ হাসি মেশিন" },
  { src: "/images/japanese-cord.jpeg", title: "Japanese Cord Machine", titleBn: "জাপানিজ কর্ড মেশিন" },
  { src: "/images/pvc-machine.jpeg", title: "PVC Machine", titleBn: "পিভিসি মেশিন" },
  { src: "/images/heatpress-item.jpeg", title: "Heat Press Items", titleBn: "হিট প্রেস আইটেম" },
  { src: "/images/seal-item.jpeg", title: "Rubber Seals", titleBn: "রাবার সিল" },
  { src: "/images/crest-item.jpeg", title: "Crest Items", titleBn: "ক্রেস্ট আইটেম" },
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navItems = [
    { label: "হোম", id: "hero" },
    { label: "আমাদের সম্পর্কে", id: "about" },
    { label: "সেবা সমূহ", id: "services" },
    { label: "গ্যালারি", id: "gallery" },
    { label: "যোগাযোগ", id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .animate-marquee {
                animation: marquee 20s linear infinite;
            }
        `}</style>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-white shadow-lg py-2"
          : "bg-transparent py-4"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <div className={`rounded-lg p-2 transition-all ${isScrolled ? "bg-white" : "bg-white/90"}`}>
            <img
              src="/images/full-logo.png"
              alt="Siyam Printing Press"
              className="h-8 md:h-12 w-auto"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`font-medium transition-colors hover:text-pink-600 ${isScrolled ? "text-gray-700" : "text-white"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <a
              href="tel:+8801980223401"
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white px-5 py-2 rounded-full font-semibold hover:from-pink-700 hover:to-pink-600 transition-all shadow-md hover:shadow-lg text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              Hotline: +8801980223401
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={isScrolled ? "text-gray-900" : "text-white"}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-gray-900 border-r border-gray-800">
                <span className="sr-only">
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </span>
                <div className="flex flex-col gap-6 py-8">
                  <div className="px-2 bg-white rounded-lg w-fit p-2">
                    <img
                      src="/images/full-logo.png"
                      alt="Siyam Printing Press"
                      className="h-8 w-auto"
                    />
                  </div>
                  <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          scrollToSection(item.id);
                          // Close sheet implicitly by UI interaction or let user click outside
                        }}
                        className="text-left text-lg font-medium text-white hover:text-pink-500 transition-colors px-2 py-1"
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                  <a
                    href="tel:+8801980223401"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white px-5 py-3 rounded-full font-semibold shadow-md mt-4"
                  >
                    <PhoneCall className="w-5 h-5" />
                    Hotline: +8801980223401
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 -top-48 -left-48 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10 w-full w-full mx-auto px-4 flex-grow flex flex-col justify-center">
          {/* Main Center Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl mt-6 p-8 md:p-12 border border-white/10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-cyan-500 to-yellow-500"></div>

            {/* Content */}
            <div className="flex flex-col items-center">
              {/* Owner Image - Centered and Large */}
              <div className="mb-8 relative">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white/5 border-4 border-pink-500/30 flex items-center justify-center shadow-2xl relative z-10">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-white">
                    <img
                      src="/images/owner.jpeg"
                      alt="Md. Shahjahan"
                      className="w-full h-full object-contain bg-white transform hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-full border border-white/10 scale-125 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border border-white/5 scale-150 animate-pulse delay-75"></div>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                সিয়াম প্রিন্টিং প্রেস এন্ড পেপার হাউজ
              </h1>
              <p className="text-xl md:text-2xl text-cyan-200 mb-6 font-light">
                Siyam Printing Press & Paper House
              </p>

              <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full mb-6"></div>

              <div className="space-y-1 mb-8">
                <h3 className="text-2xl font-bold text-white">মোঃ শাহজাহান</h3>
                <p className="text-gray-300">Md. Shahjahan</p>
                <p className="text-pink-400 font-medium tracking-wide text-sm uppercase">Entrepreneur & Director</p>
              </div>

              <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8 font-light italic">
                "We have complete printing service. So we are the best in quality and print."
              </p>

              <a
                href="tel:+8801980223401"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-700 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <PhoneCall className="w-5 h-5" />
                Call Now: +8801980223401
              </a>
            </div>
          </div>
        </div>

        {/* Carousel Section */}
        <div className="relative w-full py-8 overflow-hidden bg-black/20 backdrop-blur-sm border-t border-white/5 mt-8">
          <div className="flex animate-marquee whitespace-nowrap">
            {/* Original Set */}
            {galleryItems.map((item, index) => (
              <div key={`orig-${index}`} className="inline-block mx-4 w-48 h-32 rounded-lg overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 relative group">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                  <span className="text-white/80 text-xs font-medium px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">{item.titleBn}</span>
                </div>
              </div>
            ))}
            {/* Duplicate Set for smooth infinite scroll */}
            {galleryItems.map((item, index) => (
              <div key={`dup-${index}`} className="inline-block mx-4 w-48 h-32 rounded-lg overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 relative group">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                  <span className="text-white/80 text-xs font-medium px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">{item.titleBn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section - Full Width */}
      <section id="about" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              আমাদের সম্পর্কে
            </h2>
            <p className="text-lg text-gray-600">About Us</p>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-cyan-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="text-center space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                আমাদের প্রতিষ্ঠান
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg max-w-3xl mx-auto">
                সিয়াম প্রিন্টিং প্রেস এন্ড পেপার হাউজ নেত্রকোনার মদনে অবস্থিত একটি আধুনিক ও বিশ্বস্ত প্রিন্টিং প্রতিষ্ঠান।
                আমরা সর্বোচ্চ মানের প্রিন্টিং সেবা প্রদান করি এবং গ্রাহক সন্তুষ্টি আমাদের প্রধান লক্ষ্য।
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                কেন আমাদের বেছে নেবেন?
              </h4>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  "সর্বোচ্চ মানের প্রিন্টিং সেবা",
                  "আধুনিক জাপানিজ ও চাইনিজ মেশিনারি",
                  "যুক্তিসঙ্গত মূল্য",
                  "সময়মত ডেলিভারি",
                  "অভিজ্ঞ ও দক্ষ কর্মী বাহিনী",
                ].map((item, index) => (
                  <span key={index} className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-gray-700">
                    <span className="w-2 h-2 bg-pink-500 rounded-full" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - 2 Columns, Center Aligned */}
      <section id="services" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              আমাদের সেবা সমূহ
            </h2>
            <p className="text-lg text-gray-600">Our Services</p>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-pink-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                      {service.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {service.nameEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              আমাদের গ্যালারি
            </h2>
            <p className="text-lg text-gray-400">Our Gallery</p>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-cyan-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item, index) => (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-4">
                    <h3 className="text-white font-semibold">{item.titleBn}</h3>
                    <p className="text-gray-300 text-sm">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              যোগাযোগ করুন
            </h2>
            <p className="text-lg text-gray-600">Contact Us</p>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-cyan-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Phone */}
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ফোন</h3>
              <div className="space-y-2">
                <a href="tel:+8801980223401" className="block text-pink-600 font-semibold hover:text-pink-700 transition-colors">
                  +8801980223401 (Hotline)
                </a>
                <a href="tel:+8801913908249" className="block text-gray-600 hover:text-pink-600 transition-colors">
                  +8801913908249
                </a>
                <a href="tel:+8801790658341" className="block text-gray-600 hover:text-pink-600 transition-colors">
                  +8801790658341
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ইমেইল</h3>
              <div className="space-y-2">
                <a href="mailto:siyamsph2017@gmail.com" className="block text-gray-600 hover:text-cyan-600 transition-colors text-sm">
                  siyamsph2017@gmail.com
                </a>
                <a href="mailto:siyam.print@gmail.com" className="block text-gray-600 hover:text-cyan-600 transition-colors text-sm">
                  siyam.print@gmail.com
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ঠিকানা</h3>
              <p className="text-gray-600">
                ভাই ভাই সুপার মার্কেট,<br />
                গ্রাউন্ড ফ্লোর,<br />
                জাহাঙ্গীরপুর সেন্টার,<br />
                মদন, নেত্রকোনা
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="bg-white rounded-lg p-3">
              <img
                src="/images/full-logo.png"
                alt="Siyam Printing Press"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 text-center">
              © {new Date().getFullYear()} Siyam Printing Press & Paper House. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="tel:+8801980223401" className="text-gray-400 hover:text-pink-500 transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <a href="mailto:siyamsph2017@gmail.com" className="text-gray-400 hover:text-cyan-500 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

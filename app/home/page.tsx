"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    ArrowUp
} from "lucide-react";

// Services list based on the services.jpeg
const services = [
    { name: "ভিজিটিং কার্ড", nameEn: "Visiting Cards", icon: CreditCard },
    { name: "বিয়ের কার্ড", nameEn: "Wedding Cards", icon: FileText },
    { name: "হালখাতার কার্ড", nameEn: "Halkhata Cards", icon: FileText },
    { name: "দাওয়াত কার্ড", nameEn: "Invitation Cards", icon: FileText },
    { name: "স্কুল ডায়রী", nameEn: "School Diary", icon: FileText },
    { name: "পি.ভি.সি ব্যানার", nameEn: "PVC Banner", icon: ImageIcon },
    { name: "প্যানা ফ্ল্যাক্স", nameEn: "Pana Flex", icon: ImageIcon },
    { name: "র‍্যাক পি.ভি.সি", nameEn: "Rack PVC", icon: ImageIcon },
    { name: "ক্যাশ মেমো", nameEn: "Cash Memo", icon: FileText },
    { name: "পোস্টার", nameEn: "Posters", icon: ImageIcon },
    { name: "ক্যালেন্ডার", nameEn: "Calendars", icon: Calendar },
    { name: "রাবার সিল", nameEn: "Rubber Seals", icon: Stamp },
    { name: "ভিনাইল প্রিন্ট", nameEn: "Vinyl Print", icon: Printer },
    { name: "ক্লিয়ার মিডিয়া", nameEn: "Clear Media", icon: ImageIcon },
    { name: "স্টিকার প্রিন্ট", nameEn: "Sticker Print", icon: ImageIcon },
    { name: "লাইটিং বোর্ড", nameEn: "Lighting Board", icon: Award },
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

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white shadow-lg py-2"
                    : "bg-transparent py-4"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className={`rounded-lg p-2 transition-all ${isScrolled ? "bg-white" : "bg-white/90"}`}>
                        <img
                            src="/images/full-logo.png"
                            alt="Siyam Printing Press"
                            className="h-10 md:h-12 w-auto"
                        />
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        {[
                            { label: "হোম", labelEn: "Home", id: "hero" },
                            { label: "আমাদের সম্পর্কে", labelEn: "About", id: "about" },
                            { label: "সেবা সমূহ", labelEn: "Services", id: "services" },
                            { label: "গ্যালারি", labelEn: "Gallery", id: "gallery" },
                            { label: "যোগাযোগ", labelEn: "Contact", id: "contact" },
                        ].map((item) => (
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
                </div>
            </header>

            {/* Hero Section */}
            <section
                id="hero"
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                }}
            >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-96 h-96 -top-48 -left-48 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">

                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            সিয়াম প্রিন্টিং প্রেস এন্ড পেপার হাউজ
                        </h1>   
                        <p className="text-xl md:text-2xl text-gray-300 mb-6">
                            Siyam Printing Press & Paper House
                        </p>
                        <p className="text-lg text-pink-400 font-medium mb-8">
                            We have complete printing service. So we are the best in quality and print.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="tel:+8801980883401"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-700 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Phone className="w-5 h-5" />
                                +880 1980 88 34 01
                            </a>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <button
                        onClick={() => scrollToSection("about")}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce"
                    >
                        <ChevronDown className="w-8 h-8" />
                    </button>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            আমাদের সম্পর্কে
                        </h2>
                        <p className="text-lg text-gray-600">About Us</p>
                        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-cyan-500 mx-auto mt-4 rounded-full" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Owner Info */}
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                            <div className="relative bg-white rounded-2xl shadow-2xl p-8 text-center">
                                <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden ring-4 ring-pink-500/20 shadow-xl">
                                    <img
                                        src="/images/owner.jpeg"
                                        alt="Md. Shahjahan"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    মোঃ শাহজাহান
                                </h3>
                                <p className="text-lg text-gray-700 mb-1">Md. Shahjahan</p>
                                <p className="text-pink-600 font-medium mb-6">
                                    Entrepreneur & Director
                                </p>
                                <div className="space-y-3 text-left">
                                    <a href="tel:+8801913908249" className="flex items-center gap-3 text-gray-600 hover:text-pink-600 transition-colors">
                                        <Phone className="w-5 h-5" />
                                        +880 1913 908249
                                    </a>
                                    <a href="tel:+8801790658341" className="flex items-center gap-3 text-gray-600 hover:text-pink-600 transition-colors">
                                        <Phone className="w-5 h-5" />
                                        +880 1790 658341
                                    </a>
                                    <a href="mailto:siyamsph2017@gmail.com" className="flex items-center gap-3 text-gray-600 hover:text-pink-600 transition-colors">
                                        <Mail className="w-5 h-5" />
                                        siyamsph2017@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Company Info */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-500" />
                                    আমাদের প্রতিষ্ঠান
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    সিয়াম প্রিন্টিং প্রেস এন্ড পেপার হাউজ নেত্রকোনার মদনে অবস্থিত একটি আধুনিক ও বিশ্বস্ত প্রিন্টিং প্রতিষ্ঠান।
                                    আমরা সর্বোচ্চ মানের প্রিন্টিং সেবা প্রদান করি এবং গ্রাহক সন্তুষ্টি আমাদের প্রধান লক্ষ্য।
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                    কেন আমাদের বেছে নেবেন?
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        "সর্বোচ্চ মানের প্রিন্টিং সেবা",
                                        "আধুনিক জাপানিজ ও চাইনিজ মেশিনারি",
                                        "যুক্তিসঙ্গত মূল্য",
                                        "সময়মত ডেলিভারি",
                                        "অভিজ্ঞ ও দক্ষ কর্মী বাহিনী",
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3 text-gray-600">
                                            <span className="w-2 h-2 bg-pink-500 rounded-full" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            আমাদের সেবা সমূহ
                        </h2>
                        <p className="text-lg text-gray-600">Our Services</p>
                        <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-pink-500 mx-auto mt-4 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {services.map((service, index) => {
                            const Icon = service.icon;
                            return (
                                <div
                                    key={index}
                                    className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {service.nameEn}
                                    </p>
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
                                <a href="tel:+8801980883401" className="block text-gray-600 hover:text-pink-600 transition-colors">
                                    +880 1980 88 34 01
                                </a>
                                <a href="tel:+8801913908249" className="block text-gray-600 hover:text-pink-600 transition-colors">
                                    +880 1913 908249
                                </a>
                                <a href="tel:+8801790658341" className="block text-gray-600 hover:text-pink-600 transition-colors">
                                    +880 1790 658341
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
                            <a href="tel:+8801980883401" className="text-gray-400 hover:text-pink-500 transition-colors">
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
                    className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 animate-bounce"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

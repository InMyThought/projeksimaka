'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, Shield, Zap, Eye, Star, Menu, X, ArrowRight, Calendar, Clock, CheckCircle, UserPlus, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';

const BatmanAcademyBranding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const programs = [
    {
      title: "Justice Leadership",
      description: "Develop strategic leadership skills to become the next generation of crime-fighting leaders",
      duration: "2 Years",
      icon: Shield
    },
    {
      title: "Stealth & Tactics",
      description: "Master advanced stealth techniques and tactical operations for urban environments",
      duration: "18 Months",
      icon: Eye
    },
    {
      title: "Forensic Sciences",
      description: "Learn cutting-edge forensic technology and investigative methodologies",
      duration: "2 Years",
      icon: Zap
    },
    {
      title: "Martial Arts Mastery",
      description: "Achieve peak physical conditioning and master multiple combat disciplines",
      duration: "3 Years",
      icon: Star
    }
  ];

  const testimonials = [
    {
      name: "Tim Drake",
      role: "Graduate, Class of 2023",
      quote: "BATSCHOOL transformed me from a curious teenager into a capable guardian of Gotham. The training is intense but life-changing.",
      avatar: "TD"
    },
    {
      name: "Stephanie Brown",
      role: "Current Student, Year 2",
      quote: "Every day at BATSCHOOL pushes me beyond my limits. The instructors don't just teach skills—they forge character.",
      avatar: "SB"
    },
    {
      name: "Cassandra Cain",
      role: "Graduate, Class of 2022",
      quote: "The discipline and focus I learned here saved countless lives. BATSCHOOL doesn't just create fighters—it creates heroes.",
      avatar: "CC"
    }
  ];

  const BatmanIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" className="text-yellow-400">
      <path
        fill="currentColor"
        d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 3 1.5 4.5L12 22l4.5-9.5C17.5 11 18 9.5 18 8c0-3.5-2.5-6-6-6zm0 2c2.2 0 4 1.8 4 4 0 1-.3 2-1 3H9c-.7-1-1-2-1-3 0-2.2 1.8-4 4-4z"
      />
    </svg>
  );

  const FloatingBats = () => {
    // Only render bats on client side to avoid SSR issues
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
    }, []);
    
    if (!isClient) return null;
    
    // Responsive bat count based on screen size
    const batCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 15;
    
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(batCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-6 text-yellow-400/20"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: -50,
              opacity: 0
            }}
            animate={{
              y: [null, (typeof window !== 'undefined' ? window.innerHeight : 800) + 100],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
              repeatDelay: Math.random() * 5
            }}
          >
            <BatmanIcon />
          </motion.div>
        ))}
      </div>
    );
  };

  const DynamicBackground = () => {
    // Simplified background without mouse tracking for better performance
    const backgroundStyle = {
      backgroundImage: `
        radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
        linear-gradient(to bottom right, #0f172a, #000000, #0f172a)
      `
    };

    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900 z-0"
        style={backgroundStyle}
      >
        <FloatingBats />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>
      </div>
    );
  };

  const HeroSection = () => (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <motion.div
          className="text-center max-w-4xl px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.div
            className="mb-6 sm:mb-8"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <BatmanIcon />
          </motion.div>
          <motion.h1 
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              BATSCHOOL
            </span>
          </motion.h1>
          <motion.p 
            className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            Where ordinary individuals become extraordinary guardians of justice
          </motion.p>
          <motion.div
            className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <motion.button
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-black px-5 py-3 xs:px-6 xs:py-3 sm:px-8 sm:py-4 rounded-full font-bold text-sm xs:text-base sm:text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 215, 0, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              Daftar Sekarang
            </motion.button>
            <motion.button
              className="border-2 border-yellow-500 text-yellow-400 px-5 py-3 xs:px-6 xs:py-3 sm:px-8 sm:py-4 rounded-full font-bold text-sm xs:text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-yellow-500/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              Jelajahi Fasilitas
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div
        className="absolute bottom-6 xs:bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-yellow-400" />
      </motion.div>
    </section>
  );

  const AboutSection = () => (
    <section className="relative py-12 xs:py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-10 xs:mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 xs:mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Tentang BATSCHOOL
            </span>
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Didirikan di hati Gotham City, BATSCHOOL adalah akademi pelatihan paling canggih di dunia untuk calon pahlawan keadilan.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xs:gap-8 sm:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-3 xs:mb-4 sm:mb-6 text-white">Warisan Keadilan</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed text-sm xs:text-base">
              Selama lebih dari dua dekade, BATSCHOOL telah melatih generasi terbaik pelindung keadilan. 
              Kurikulum kami dirancang oleh para ahli dari seluruh dunia, menggabungkan teknologi terkini 
              dengan prinsip-prinsip keadilan yang abadi.
            </p>
            <div className="space-y-2 xs:space-y-3 sm:space-y-4">
              {[
                { icon: Shield, text: "Pelatihan Keamanan Tingkat Tinggi" },
                { icon: GraduationCap, text: "Kurikulum Terakreditasi Internasional" },
                { icon: Users, text: "Jaringan Alumni Global" },
                { icon: Zap, text: "Teknologi Pelatihan Terkini" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 xs:gap-3 text-gray-300"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <item.icon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 xs:p-6 sm:p-8 border border-gray-700 shadow-2xl">
              <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                <div className="flex items-center gap-3 xs:gap-4">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-black" />
                  </div>
                  <div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">1247+</h4>
                    <p className="text-xs xs:text-sm text-gray-400">Lulusan Sukses</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 xs:gap-4">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">89+</h4>
                    <p className="text-xs xs:text-sm text-gray-400">Program Pelatihan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 xs:gap-4">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl font-bold text-white">94.2%</h4>
                    <p className="text-xs xs:text-sm text-gray-400">Tingkat Penempatan</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  const ProgramsSection = () => (
    <section className="relative py-12 xs:py-16 sm:py-20 px-4 bg-black/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-10 xs:mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 xs:mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Program Pelatihan
            </span>
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Pilih jalur pelatihan yang sesuai dengan panggilan Anda untuk melayani keadilan
          </p>
        </motion.div>

        {/* Responsive grid layout */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <motion.div
                key={index}
                className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg xs:rounded-xl flex items-center justify-center mb-3 xs:mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 xs:w-6 xs:h-6 text-black" />
                </div>
                <h3 className="text-base xs:text-lg font-bold text-white mb-2">{program.title}</h3>
                <p className="text-xs xs:text-sm text-gray-400 mb-3 leading-relaxed">{program.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] xs:text-xs text-gray-500">{program.duration}</span>
                  <ArrowRight className="w-3 h-3 xs:w-4 xs:h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );

  const TestimonialsSection = () => {
    // Removed auto-advance testimonials to prevent loading triggers

    return (
      <section className="relative py-12 xs:py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10 xs:mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 xs:mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Testimoni Lulusan
              </span>
            </h2>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-300">
              Dengar langsung dari mereka yang telah melalui perjalanan transformasi di BATSCHOOL
            </p>
          </motion.div>

          <div className="relative">
            {/* Navigation arrows for manual testimonial control - hidden on mobile */}
            <button 
              className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-gray-900/80 border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-all"
              onClick={() => setActiveTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
            >
              <ArrowRight className="w-5 h-5 xs:w-6 xs:h-6 text-yellow-400 rotate-180" />
            </button>
            
            <button 
              className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-gray-900/80 border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-all"
              onClick={() => setActiveTestimonial(prev => (prev + 1) % testimonials.length)}
            >
              <ArrowRight className="w-5 h-5 xs:w-6 xs:h-6 text-yellow-400" />
            </button>

            {/* Testimonial Cards Container */}
            <div className="overflow-hidden py-4">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 w-full px-1 xs:px-2"
                  >
                    <motion.div
                      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl xs:rounded-3xl p-5 xs:p-6 sm:p-8 border border-gray-700"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center text-black font-bold text-lg xs:text-xl sm:text-2xl mb-4 xs:mb-5 sm:mb-6">
                          {testimonial.avatar}
                        </div>
                        <blockquote className="text-base xs:text-lg sm:text-xl text-gray-200 mb-4 xs:mb-5 sm:mb-6 leading-relaxed italic">
                          "{testimonial.quote}"
                        </blockquote>
                        <div>
                          <p className="text-base xs:text-lg sm:text-xl font-bold text-white">{testimonial.name}</p>
                          <p className="text-xs xs:text-sm sm:text-base text-gray-400">{testimonial.role}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex justify-center mt-6 xs:mt-8 sm:mt-12 space-x-1 xs:space-x-2 sm:space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                  index === activeTestimonial 
                    ? 'bg-yellow-500 w-4 xs:w-5 sm:w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile navigation controls */}
          <div className="sm:hidden flex justify-center mt-5 xs:mt-6 space-x-3 xs:space-x-4">
            <button
              className="px-3 py-2 xs:px-4 xs:py-2 bg-gray-800 rounded-lg text-yellow-400 text-xs xs:text-sm"
              onClick={() => setActiveTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
            >
              Previous
            </button>
            <button
              className="px-3 py-2 xs:px-4 xs:py-2 bg-gray-800 rounded-lg text-yellow-400 text-xs xs:text-sm"
              onClick={() => setActiveTestimonial(prev => (prev + 1) % testimonials.length)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    );
  };

  const RegistrationSection = () => (
    <section className="relative py-12 xs:py-16 sm:py-20 px-4 bg-gradient-to-r from-gray-900/50 to-black/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-8 xs:mb-10 sm:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-3 xs:mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Daftar Sekarang
            </span>
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-300">
            Jadilah bagian dari legenda berikutnya
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl xs:rounded-3xl p-5 xs:p-6 sm:p-8 border border-gray-700"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xs:gap-7 sm:gap-8">
            <div>
              <h3 className="text-xl xs:text-2xl font-bold text-white mb-4 xs:mb-5 sm:mb-6">Informasi Pendaftaran</h3>
              <div className="space-y-3 xs:space-y-4">
                <div className="flex items-center gap-2 xs:gap-3 text-gray-300">
                  <Calendar className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">Tahun Ajaran: 2025/2026</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3 text-gray-300">
                  <Clock className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">Pendaftaran dibuka: Januari - Maret 2025</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3 text-gray-300">
                  <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">Ujian masuk: April 2025</span>
                </div>
                <div className="pt-4 xs:pt-5 sm:pt-6">
                  <h4 className="text-base xs:text-lg sm:text-xl font-bold text-white mb-2 xs:mb-3">Persyaratan:</h4>
                  <ul className="text-gray-400 space-y-1 xs:space-y-2 text-xs xs:text-sm sm:text-base">
                    <li>• Usia 16-25 tahun</li>
                    <li>• Lulus ujian fisik dan mental</li>
                    <li>• Komitmen penuh terhadap keadilan</li>
                    <li>• Rekomendasi dari otoritas terkait</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl xs:text-2xl font-bold text-white mb-4 xs:mb-5 sm:mb-6">Kontak Pendaftaran</h3>
              <div className="space-y-3 xs:space-y-4">
                <div className="flex items-center gap-2 xs:gap-3 text-gray-300">
                  <Phone className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">+1 (555) BAT-CITY</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3 text-gray-300">
                  <Mail className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">enroll@batschool.gotham</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3 text-gray-300">
                  <MapPin className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs xs:text-sm sm:text-base">Wayne Tower, Gotham City</span>
                </div>
              </div>
              
              <motion.button
                className="w-full mt-6 xs:mt-7 sm:mt-8 bg-gradient-to-r from-yellow-600 to-orange-600 text-black py-3 xs:py-4 rounded-lg xs:rounded-xl font-bold text-base xs:text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus className="w-4 h-4 xs:w-5 xs:h-5" />
                Formulir Pendaftaran Online
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <DynamicBackground />
      
      {/* Navigation - responsive with mobile menu */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 xs:px-6 py-3 xs:py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2 xs:gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <BatmanIcon />
              <span className="text-lg xs:text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                BATSCHOOL
              </span>
            </motion.div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-yellow-400 focus:outline-none"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="h-5 w-5 xs:h-6 xs:w-6" /> : <Menu className="h-5 w-5 xs:h-6 xs:w-6" />}
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6 xs:gap-7 sm:gap-8">
              {['Beranda', 'Tentang', 'Program', 'Testimoni', 'Pendaftaran'].map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-300 hover:text-yellow-400 transition-colors font-medium text-sm xs:text-base"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {item}
                </motion.a>
              ))}
              <motion.button
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-black px-4 py-2 xs:px-5 xs:py-2.5 sm:px-6 sm:py-3 rounded-full font-bold text-sm xs:text-base hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Daftar
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                className="md:hidden mt-3 xs:mt-4 pb-3 xs:pb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col gap-2 xs:gap-3">
                  {['Beranda', 'Tentang', 'Program', 'Testimoni', 'Pendaftaran'].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      className="text-gray-300 hover:text-yellow-400 transition-colors font-medium text-sm xs:text-base py-2 px-3 rounded-lg hover:bg-gray-800/50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                  <button
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 text-black px-4 py-2.5 xs:py-3 rounded-full font-bold text-sm xs:text-base hover:shadow-lg transition-all w-full mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Daftar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main>
        <HeroSection />
        <AboutSection />
        <ProgramsSection />
        <TestimonialsSection />
        <RegistrationSection />
      </main>

      {/* Footer */}
      <footer className="relative py-6 xs:py-8 sm:py-12 px-4 border-t border-gray-800 bg-black/50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-3 xs:mb-4 sm:mb-6">
            <BatmanIcon />
          </div>
          <p className="text-gray-400 mb-2 text-xs xs:text-sm sm:text-base">
            BATSCHOOL Academy • Where Heroes Are Forged
          </p>
          <p className="text-gray-500 text-[10px] xs:text-xs sm:text-sm">
            © 2025 BATSCHOOL. All rights reserved. Justice Never Sleeps.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BatmanAcademyBranding;
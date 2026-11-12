import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-[#fbfbfd]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10"
      >
        <h2 className="text-sm font-semibold tracking-widest uppercase mb-4 text-gray-500">San Marcos, CA</h2>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 mb-6">
          Precision. <span className="text-blue-600">Artistry.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-light">
          A high-end studio experience tailored to the modern individual. 
          Where technique meets the California sun.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition-all">
            Book Appointment
          </button>
          <button className="text-blue-600 px-8 py-3 font-medium hover:underline">
            View Lookbook &gt;
          </button>
        </div>
      </motion.div>

      {/* Background Ambient "Blob" */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-50" />
    </section>
  );
}

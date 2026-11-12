export default function BentoServices() {
  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#f5f5f7] py-20">
      <div className="md:col-span-2 h-80 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 backdrop-blur-md bg-white/70 flex flex-col justify-end">
        <h3 className="text-2xl font-bold">Signature Cuts</h3>
        <p className="text-gray-500">Tailored to your facial structure.</p>
      </div>
      <div className="md:col-span-1 h-80 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-8 text-white flex flex-col justify-end">
        <h3 className="text-2xl font-bold">Coloring</h3>
        <p className="opacity-80">Balayage & Beyond.</p>
      </div>
      <div className="md:col-span-1 h-80 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-end">
        <h3 className="text-2xl font-bold">Styling</h3>
      </div>
    </div>
  );
}

// GallerySlider.tsx के अंदर return ब्लॉक में:
return (
  <div className="w-full relative group">
    {/* Upload Button overlay on top-right */}
    <div className="absolute top-4 right-4 z-20">
      <label className="bg-white/90 backdrop-blur-md text-blue-900 px-4 py-2 rounded-2xl text-[10px] font-black cursor-pointer shadow-xl hover:bg-blue-900 hover:text-white transition-all duration-300">
        {uploading ? "UPLOADING..." : "+ ADD PHOTO"}
        <input type="file" className="hidden" onChange={handleUpload} />
      </label>
    </div>

    {/* The Slider Container */}
    <div className="relative h-56 md:h-72 overflow-hidden rounded-[40px] shadow-2xl shadow-blue-900/10 bg-white border border-gray-100">
      {gallery.length > 0 ? (
        <div 
          className="flex transition-transform duration-1000 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {gallery.map((img: any) => (
            <div key={img.id} className="min-w-full h-full relative group/item">
              <img 
                src={img.url} 
                className="w-full h-full object-cover" 
                alt="School"
                onClick={() => window.open(img.url, '_blank')}
              />
              {/* Image Title / Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white font-black uppercase tracking-widest text-xs">School Highlights</p>
              </div>
              
              {/* Delete Icon */}
              <button 
                onClick={(e) => { e.stopPropagation(); deleteImage(img.id, img.url); }}
                className="absolute top-4 left-4 bg-red-600/90 text-white p-2.5 rounded-xl opacity-0 group-hover/item:opacity-100 transition shadow-lg"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
          <span className="text-4xl">📸</span>
          <p className="font-black uppercase text-[10px] tracking-widest">No Photos to Slide</p>
        </div>
      )}

      {/* Modern Line Indicators instead of Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {gallery.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-10 bg-white' : 'w-4 bg-white/30'}`} 
          />
        ))}
      </div>
    </div>
  </div>
);

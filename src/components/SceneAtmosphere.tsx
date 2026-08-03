export function SceneAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="mesh-grid absolute inset-0 opacity-70" />
      <div className="orb orb-teal animate-float-slow left-[-6%] top-[8%] h-72 w-72 md:h-[28rem] md:w-[28rem]" />
      <div className="orb orb-azure animate-float right-[-8%] top-[18%] h-64 w-64 md:h-[24rem] md:w-[24rem]" />
      <div className="orb orb-mint animate-pulse-soft bottom-[4%] left-[35%] h-48 w-48 md:h-72 md:w-72" />
      <div className="absolute left-1/2 top-[22%] h-40 w-40 -translate-x-1/2 rounded-[2rem] border border-white/60 bg-white/25 shadow-[0_30px_80px_rgba(15,28,46,0.08)] backdrop-blur-md [transform:perspective(900px)_rotateX(58deg)_rotateZ(-18deg)] md:h-56 md:w-56" />
    </div>
  );
}

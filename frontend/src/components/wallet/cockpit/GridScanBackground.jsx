import { motion, useReducedMotion } from 'framer-motion';

export default function GridScanBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#090a0f]" />

      <motion.div
        className="absolute left-1/2 top-[18%] h-[170%] w-[180%] -translate-x-1/2 opacity-55"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(67,53,97,0.52) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(67,53,97,0.52) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '56px 56px',
          transform: 'perspective(1600px) rotateX(76deg) scale(1.16)',
          transformOrigin: 'center top',
          filter: 'drop-shadow(0 0 28px rgba(255,159,252,0.08))',
        }}
        animate={reducedMotion ? undefined : { backgroundPosition: ['0px 0px, 0px 0px', '0px 56px, 56px 0px'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute left-1/2 top-[12%] h-[26%] w-[90%] -translate-x-1/2"
        style={{
          background: 'linear-gradient(180deg, rgba(255,159,252,0) 0%, rgba(255,159,252,0.22) 48%, rgba(255,159,252,0) 100%)',
          filter: 'blur(20px)',
          opacity: 0.72,
        }}
        animate={reducedMotion ? undefined : { y: ['0%', '215%'] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(circle at 50% 34%, rgba(255,159,252,0.12), transparent 28%)',
            'radial-gradient(circle at 50% 76%, rgba(97,82,138,0.22), transparent 36%)',
            'linear-gradient(180deg, rgba(9,10,15,0.22) 0%, rgba(9,10,15,0.80) 60%, rgba(9,10,15,0.96) 100%)',
          ].join(','),
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
}

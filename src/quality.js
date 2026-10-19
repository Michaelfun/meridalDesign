// True on phones and small tablets: the 3D scene then runs a lighter configuration
export const LOW = typeof window !== 'undefined' && (window.innerWidth < 768 || (!!window.matchMedia && window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024))

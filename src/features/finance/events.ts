const listeners=new Set<()=>void>();
export const financeEvents={subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},notify(){for(const fn of listeners)fn();}};

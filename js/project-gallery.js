export function setupProjectGallery({reducedMotion}) {
  const section=document.querySelector('#collection'),pin=section.querySelector('.h-pin');
  const track=section.querySelector('.h-track'),cards=[...track.children];
  const prev=section.querySelector('.gallery-prev'),next=section.querySelector('.gallery-next');
  const count=section.querySelector('.gallery-count'),bar=section.querySelector('#collection-progress');
  cards.forEach(card=>{
    const toggle=card.querySelector('.project-toggle'),panel=card.querySelector('.project-details');
    if(!toggle)return;
    const setOpen=open=>{card.classList.toggle('is-open',open);panel.inert=!open;toggle.setAttribute('aria-expanded',String(open));toggle.querySelector('span').textContent=open?'Close':'Explore';};
    toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
    card.addEventListener('pointerenter',event=>{if(innerWidth>=800&&event.pointerType==='mouse'&&matchMedia('(hover:hover)').matches)setOpen(true);});
    card.addEventListener('pointerleave',()=>{if(!card.contains(document.activeElement))setOpen(false);});
    card.addEventListener('focusout',()=>queueMicrotask(()=>{if(!card.contains(document.activeElement)&&!card.matches(':hover'))setOpen(false);}));
    card.addEventListener('keydown',event=>{if(event.key==='Escape'){setOpen(false);toggle.focus();event.stopPropagation();}});
  });
  const mm=gsap.matchMedia();
  mm.add({desktop:'(min-width:800px)',compact:'(max-width:799px)',reduce:'(prefers-reduced-motion:reduce)'},context=>{
    const pinned=context.conditions.desktop&&!context.conditions.reduce;
    let trigger=null,current=0;
    const max=()=>Math.max(0,track.scrollWidth-innerWidth);
    const step=()=>cards[1].offsetLeft-cards[0].offsetLeft;
    const update=x=>{
      current=Math.min(cards.length-1,Math.round(x/step()));
      const lastVisible=Math.min(cards.length,Math.floor((x+innerWidth-cards[0].offsetLeft)/step())+1);
      count.textContent=`${String(current+1).padStart(2,'0')}–${String(lastVisible).padStart(2,'0')} / ${cards.length}`;
      prev.disabled=x<2;next.disabled=x>=max()-2;
      bar.style.transform=`scaleX(${max()?x/max():1})`;
      if(pinned) cards.forEach(card=>{const left=card.offsetLeft-x;card.inert=left+card.offsetWidth<80||left>innerWidth-80;});
    };
    const navigate=delta=>{
      const x=delta>0?Math.min(max(),(current+1)*step()):Math.max(0,(current-1)*step());
      if(pinned&&trigger) window.dispatchEvent(new CustomEvent('portfolio:navigate-scroll',{detail:{top:trigger.start+x}}));
      else track.scrollTo({left:x,behavior:reducedMotion?'instant':'smooth'});
    };
    const back=()=>navigate(-1),forward=()=>navigate(1),onScroll=()=>update(track.scrollLeft);
    prev.addEventListener('click',back);next.addEventListener('click',forward);
    if(pinned){
      track.removeAttribute('data-lenis-prevent');
      const tween=gsap.to(track,{x:()=>-max(),ease:'none',scrollTrigger:{trigger:pin,start:'top top',end:()=>`+=${Math.round(max())}`,pin:true,scrub:true,anticipatePin:1,invalidateOnRefresh:true,onUpdate:self=>update(self.progress*max()),onRefresh:self=>update(self.progress*max())}});
      trigger=tween.scrollTrigger;
    } else {track.removeAttribute('data-lenis-prevent');track.setAttribute('data-lenis-prevent-touch','');track.addEventListener('scroll',onScroll,{passive:true});}
    update(0);
    return()=>{prev.removeEventListener('click',back);next.removeEventListener('click',forward);track.removeEventListener('scroll',onScroll);track.removeAttribute('data-lenis-prevent-touch');cards.forEach(card=>card.inert=false);};
  });
}

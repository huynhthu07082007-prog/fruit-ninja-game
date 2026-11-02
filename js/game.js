(()=>{
const canvas=document.getElementById('game-canvas');if(!canvas)return;
const ctx=canvas.getContext('2d'),stage=document.getElementById('game-stage');
const $=id=>document.getElementById(id);
const scoreEl=$('score'),levelEl=$('level'),timeEl=$('time'),livesEl=$('lives'),bestEl=$('best'),progressEl=$('level-progress');
const overlay=$('game-overlay'),titleEl=$('overlay-title'),textEl=$('overlay-text'),startBtn=$('start-btn');
const fruits=['🍉','🍊','🍎','🍋','🍍','🍓','🥝','🍑','🍇'];
let W=0,H=0,items=[],particles=[],trail=[],score=0,level=1,lives=3,timeLeft=60,running=false,last=0,spawnTimer=0,raf=0,timer=null;
let pointer={x:-100,y:-100,down:false},best=Number(localStorage.getItem('fruitSlashBest')||0);
bestEl.textContent=best;
function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
window.addEventListener('resize',resize);resize();
function thresholds(l){return l===1?100:l===2?200:l===3?350:l===4?500:l===5?700:700+(l-6)*250;}
function updateHud(){scoreEl.textContent=score;levelEl.textContent=level;timeEl.textContent=timeLeft;livesEl.textContent=lives;const prev=level===1?0:thresholds(level-1);const next=thresholds(level);progressEl.style.width=Math.max(0,Math.min(100,(score-prev)/(next-prev)*100))+'%';}
function levelCheck(){let changed=false;while(score>=thresholds(level)){level++;changed=true;}if(changed){levelEl.textContent=level;const toast=document.createElement('div');toast.className='level-toast';toast.textContent='LEVEL '+level+'!';stage.appendChild(toast);setTimeout(()=>toast.remove(),1100);}}
function spawn(){const radius=27+Math.random()*9;const x=radius+Math.random()*(W-radius*2);const speed=-(5+Math.random()*2+level*.55);items.push({x,y:H+radius,vx:(Math.random()-.5)*3,vy:speed,r:radius,emoji:fruits[Math.floor(Math.random()*fruits.length)],spin:(Math.random()-.5)*.05,angle:0,kind:'fruit',cut:false});if(level>=3&&Math.random()<Math.min(.08+(level-3)*.025,.2)){items.push({x:W-x,y:H+radius,vx:(Math.random()-.5)*2,vy:speed*1.02,r:25,emoji:'💣',angle:0,kind:'bomb',cut:false});}}
function burst(item){for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*4;particles.push({x:item.x,y:item.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:35,color:item.kind==='bomb'?'#ff6b35':['#ffcc4d','#ff6b35','#7ee081','#f86c9b'][Math.floor(Math.random()*4)]});}}
function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointermove',e=>{const p=pointerPos(e);pointer.x=p.x;pointer.y=p.y;trail.push({x:p.x,y:p.y,life:12});if(trail.length>12)trail.shift();if(running)checkCuts(p);});
canvas.addEventListener('pointerdown',e=>{pointer.down=true;const p=pointerPos(e);pointer.x=p.x;pointer.y=p.y;});
canvas.addEventListener('pointerup',()=>pointer.down=false);
function checkCuts(p){for(let i=items.length-1;i>=0;i--){const it=items[i];if(it.cut)continue;const dx=p.x-it.x,dy=p.y-it.y;if(dx*dx+dy*dy<(it.r+9)*(it.r+9)){it.cut=true;burst(it);if(it.kind==='bomb'){lives--;updateHud();if(lives<=0)endGame();}else{score+=10;levelCheck();updateHud();}}}}
function draw(){ctx.clearRect(0,0,W,H);
ctx.save();ctx.globalAlpha=.12;for(let i=0;i<30;i++){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc((i*97)%W,(i*61)%H,1.3,0,Math.PI*2);ctx.fill();}ctx.restore();
items.forEach(it=>{if(it.cut)return;ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.angle);ctx.font=(it.r*2)+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#0008';ctx.shadowBlur=9;ctx.fillText(it.emoji,0,0);ctx.restore();});
particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/35);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});
if(trail.length>1){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fff';ctx.shadowColor='#8be9ff';ctx.shadowBlur=16;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(trail[0].x,trail[0].y);for(let i=1;i<trail.length;i++)ctx.lineTo(trail[i].x,trail[i].y);ctx.stroke();ctx.strokeStyle='#a7f4ff';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
}
function loop(ts){if(!running)return;const dt=Math.min((ts-last)/16.67||1,2);last=ts;spawnTimer+=dt;if(spawnTimer>Math.max(24,68-level*5)){spawn();spawnTimer=0;}
for(let i=items.length-1;i>=0;i--){const it=items[i];it.x+=it.vx*dt;it.y+=it.vy*dt;it.vy+=.17*dt;it.angle+=it.spin*dt;if(it.cut||it.y>H+80)items.splice(i,1);}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.12*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
trail.forEach(p=>p.life-=dt);trail=trail.filter(p=>p.life>0);draw();raf=requestAnimationFrame(loop);}
function start(){cancelAnimationFrame(raf);clearInterval(timer);items=[];particles=[];trail=[];score=0;level=1;lives=3;timeLeft=60;spawnTimer=0;running=true;updateHud();overlay.classList.add('hidden');last=performance.now();raf=requestAnimationFrame(loop);timer=setInterval(()=>{if(!running)return;timeLeft--;updateHud();if(timeLeft<=0)endGame();},1000);}
function endGame(){if(!running)return;running=false;clearInterval(timer);cancelAnimationFrame(raf);draw();if(score>best){best=score;localStorage.setItem('fruitSlashBest',best);bestEl.textContent=best;}
let rows=[];try{rows=JSON.parse(localStorage.getItem('fruitSlashScores')||'[]')}catch(e){}rows.push({name:'Người chơi',score,level,date:new Date().toLocaleString('vi-VN')});rows.sort((a,b)=>b.score-a.score);localStorage.setItem('fruitSlashScores',JSON.stringify(rows.slice(0,10)));
titleEl.textContent='KẾT THÚC!';textEl.textContent=`Bạn đạt ${score} điểm và chinh phục Level ${level}. Kỷ lục: ${best} điểm.`;startBtn.textContent='CHƠI LẠI';overlay.classList.remove('hidden');}
startBtn.addEventListener('click',start);
updateHud();draw();
})();

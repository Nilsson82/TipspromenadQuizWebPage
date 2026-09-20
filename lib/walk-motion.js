(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WalkMotion=api;})(globalThis,function(){
 function remaining(deadline,now){return Math.max(0,Math.ceil((deadline-now)/1000));}
 function distance(a,b){const rad=Math.PI/180,dLat=(b.latitude-a.latitude)*rad,dLon=(b.longitude-a.longitude)*rad;const h=Math.min(1,Math.sin(dLat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dLon/2)**2);return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
 function advance(previous,current,total){
  if(![current.latitude,current.longitude,current.accuracy,current.time].every(Number.isFinite)||Math.abs(current.latitude)>90||Math.abs(current.longitude)>180||current.accuracy<0||current.accuracy>30)return{previous,total};
  if(!previous)return{previous:current,total};
  const elapsed=(current.time-previous.time)/1000;
  if(elapsed<=0)return{previous,total};
  if(elapsed>30)return{previous:current,total};
  const metres=distance(previous,current);
  // Retain the baseline over small samples so ordinary slow walking accumulates.
  if(metres<Math.max(3,current.accuracy/2))return{previous,total};
  return{previous:current,total:metres/elapsed<4?total+metres:total};
 }
 return{remaining,distance,advance};
});

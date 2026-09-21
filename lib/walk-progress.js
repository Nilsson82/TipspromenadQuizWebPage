/* Progress belongs to an attempt, never to a screen instance. Both means AND. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WalkProgress=api;})(globalThis,function(){
 function requirements(quiz,native){return{seconds:quiz.walk==='time'?quiz.walkValue:quiz.walk==='both'?quiz.timeSeconds:0,metres:native&&['distance','both'].includes(quiz.walk)?quiz.walkValue:0};}
 function open(state,now){state.gates??={};const key=String(state.index);return state.gates[key]??=( {startedAt:now,elapsed:0,distance:0} );}
 function status(quiz,gate,now,native){const req=requirements(quiz,native);gate.elapsed=Math.max(gate.elapsed||0,Math.max(0,(now-gate.startedAt)/1000));return{...req,elapsed:Math.min(req.seconds,Math.floor(gate.elapsed)),distance:Math.min(req.metres,Math.floor(gate.distance||0)),ready:gate.elapsed>=req.seconds&&(gate.distance||0)>=req.metres};}
 function canAdvance(state,now,native){if(!Number.isInteger(state.answers[state.index]))return false;if(state.index<state.unlocked)return true;return status(state.quiz,open(state,now),now,native).ready;}
 return{requirements,open,status,canAdvance};
});

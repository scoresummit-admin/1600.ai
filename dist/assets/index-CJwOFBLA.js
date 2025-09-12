var q=Object.defineProperty;var F=(l,n,s)=>n in l?q(l,n,{enumerable:!0,configurable:!0,writable:!0,value:s}):l[n]=s;var g=(l,n,s)=>F(l,typeof n!="symbol"?n+"":n,s);import{r as P,g as T,a as D}from"./vendor-C8w-UNLI.js";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver(e=>{for(const o of e)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&t(r)}).observe(document,{childList:!0,subtree:!0});function s(e){const o={};return e.integrity&&(o.integrity=e.integrity),e.referrerPolicy&&(o.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?o.credentials="include":e.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function t(e){if(e.ep)return;e.ep=!0;const o=s(e);fetch(e.href,o)}})();var N={exports:{}},y={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var j;function W(){if(j)return y;j=1;var l=P(),n=Symbol.for("react.element"),s=Symbol.for("react.fragment"),t=Object.prototype.hasOwnProperty,e=l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function r(i,c,d){var m,u={},h=null,x=null;d!==void 0&&(h=""+d),c.key!==void 0&&(h=""+c.key),c.ref!==void 0&&(x=c.ref);for(m in c)t.call(c,m)&&!o.hasOwnProperty(m)&&(u[m]=c[m]);if(i&&i.defaultProps)for(m in c=i.defaultProps,c)u[m]===void 0&&(u[m]=c[m]);return{$$typeof:n,type:i,key:h,ref:x,props:u,_owner:e.current}}return y.Fragment=s,y.jsx=r,y.jsxs=r,y}var _;function L(){return _||(_=1,N.exports=W()),N.exports}var a=L(),p=P();const V=T(p);var w={},k;function U(){if(k)return w;k=1;var l=D();return w.createRoot=l.createRoot,w.hydrateRoot=l.hydrateRoot,w}var J=U();const z=T(J);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=l=>l.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Y=l=>l.replace(/^([A-Z])|[\s-_]+(\w)/g,(n,s,t)=>t?t.toUpperCase():s.toLowerCase()),M=l=>{const n=Y(l);return n.charAt(0).toUpperCase()+n.slice(1)},I=(...l)=>l.filter((n,s,t)=>!!n&&n.trim()!==""&&t.indexOf(n)===s).join(" ").trim(),G=l=>{for(const n in l)if(n.startsWith("aria-")||n==="role"||n==="title")return!0};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Q={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=p.forwardRef(({color:l="currentColor",size:n=24,strokeWidth:s=2,absoluteStrokeWidth:t,className:e="",children:o,iconNode:r,...i},c)=>p.createElement("svg",{ref:c,...Q,width:n,height:n,stroke:l,strokeWidth:t?Number(s)*24/Number(n):s,className:I("lucide",e),...!o&&!G(i)&&{"aria-hidden":"true"},...i},[...r.map(([d,m])=>p.createElement(d,m)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=(l,n)=>{const s=p.forwardRef(({className:t,...e},o)=>p.createElement(K,{ref:o,iconNode:n,className:I(`lucide-${H(M(l))}`,`lucide-${l}`,t),...e}));return s.displayName=M(l),s};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=[["path",{d:"M12 18V5",key:"adv99a"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",key:"1e3is1"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",key:"1gqd8o"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77",key:"iwvgf7"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464",key:"efp6ie"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",key:"1gq6am"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464",key:"k1g0md"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77",key:"q97ue3"}]],X=f("brain",Z);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]],te=f("calculator",ee);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],ae=f("camera",se);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],$=f("circle-check-big",ne);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],S=f("circle-x",re);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],ie=f("clock",oe);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],le=f("code-xml",ce);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["circle",{cx:"10",cy:"12",r:"2",key:"737tya"}],["path",{d:"m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22",key:"wt3hpn"}]],me=f("file-image",de);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],A=f("image",he);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],pe=f("send",ue);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],ge=f("target",fe);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],ye=f("upload",xe);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],we=f("x",ve);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Ne=f("zap",be),je=({onImageUploaded:l,isLoading:n})=>{const[s,t]=p.useState(!1),[e,o]=p.useState(null),r=p.useRef(null),i=h=>{h.preventDefault(),h.stopPropagation(),h.type==="dragenter"||h.type==="dragover"?t(!0):h.type==="dragleave"&&t(!1)},c=h=>{h.preventDefault(),h.stopPropagation(),t(!1),h.dataTransfer.files&&h.dataTransfer.files[0]&&m(h.dataTransfer.files[0])},d=h=>{h.target.files&&h.target.files[0]&&m(h.target.files[0])},m=async h=>{if(!h.type.startsWith("image/")){alert("Please upload an image file");return}const x=URL.createObjectURL(h);o(x);const b=new FileReader;b.onload=async()=>{const O=b.result.split(",")[1];l(O)},b.readAsDataURL(h)},u=()=>{o(null),r.current&&(r.current.value="")};return a.jsxs("div",{className:"space-y-4",children:[e&&a.jsxs("div",{className:"relative",children:[a.jsx("img",{src:e,alt:"SAT Question Preview",className:"max-w-full h-auto rounded-lg border border-slate-200"}),a.jsx("button",{onClick:u,className:"absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-50",disabled:n,children:a.jsx(we,{className:"w-4 h-4"})})]}),a.jsxs("div",{className:`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${s?"border-primary-400 bg-primary-50":"border-slate-300 hover:border-slate-400"} ${n?"opacity-50 pointer-events-none":""}`,onDragEnter:i,onDragLeave:i,onDragOver:i,onDrop:c,children:[a.jsx("input",{ref:r,type:"file",accept:"image/*",onChange:d,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer",disabled:n}),a.jsxs("div",{className:"space-y-3",children:[a.jsxs("div",{className:"flex justify-center space-x-2",children:[a.jsx(ye,{className:"w-8 h-8 text-slate-400"}),a.jsx(ae,{className:"w-8 h-8 text-slate-400"}),a.jsx(me,{className:"w-8 h-8 text-slate-400"})]}),a.jsxs("div",{children:[a.jsx("p",{className:"text-slate-600 font-medium",children:"Upload SAT Question Screenshot"}),a.jsx("p",{className:"text-sm text-slate-500 mt-1",children:"Drag and drop or click to select an image"})]}),a.jsx("div",{className:"text-xs text-slate-400",children:"Supports: JPG, PNG, WebP • Max 10MB"})]})]}),a.jsxs("div",{className:"text-xs text-slate-500 bg-primary-50 p-3 rounded-lg",children:[a.jsx("strong",{children:"Vision AI will read your image directly:"}),a.jsxs("ul",{className:"mt-1 space-y-1 list-disc list-inside",children:[a.jsx("li",{children:"Use high-resolution, clear images"}),a.jsx("li",{children:"Ensure good lighting and contrast"}),a.jsx("li",{children:"Crop to show only the question area"}),a.jsx("li",{children:"Include all answer choices and diagrams"})]})]})]})},_e=({onSubmit:l,isLoading:n})=>{const[s,t]=p.useState(""),[e,o]=p.useState("EBRW"),[r,i]=p.useState(!1),c=()=>{s&&l(s,e)},d=m=>{t(m),i(!0)};return a.jsxs("div",{className:"card p-6 space-y-6",children:[a.jsxs("div",{children:[a.jsxs("h2",{className:"text-xl font-semibold text-slate-800 flex items-center gap-2",children:[a.jsx(A,{className:"w-5 h-5"}),"Upload SAT Question"]}),a.jsx("p",{className:"text-sm text-slate-600 mt-1",children:"Upload a clear image of your SAT question. Our vision AI will read and solve it directly."})]}),a.jsx(je,{onImageUploaded:d,isLoading:n}),r&&a.jsxs("div",{className:"bg-primary-50 rounded-lg p-4 space-y-4",children:[a.jsxs("div",{className:"flex items-center gap-2 text-primary-700",children:[a.jsx(A,{className:"w-5 h-5"}),a.jsx("span",{className:"font-medium",children:"Image uploaded successfully"})]}),a.jsx("p",{className:"text-sm text-primary-600",children:"Ready to analyze with vision AI models"}),a.jsxs("div",{className:"flex gap-4 pt-2",children:[a.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[a.jsx("input",{type:"radio",className:"text-primary-600",checked:e==="EBRW",onChange:()=>o("EBRW")}),"EBRW"]}),a.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[a.jsx("input",{type:"radio",className:"text-primary-600",checked:e==="MATH",onChange:()=>o("MATH")}),"Math"]})]}),a.jsx("div",{className:"pt-4 border-t border-slate-200",children:a.jsx("button",{type:"button",onClick:c,disabled:n||!s,className:"btn-primary w-full flex items-center justify-center gap-2",children:n?a.jsxs(a.Fragment,{children:[a.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Analyzing with Vision AI..."]}):a.jsxs(a.Fragment,{children:[a.jsx(pe,{className:"w-4 h-4"}),"Solve with Vision AI"]})})})]})]})},ke=({solution:l})=>{if(!l)return null;const n=t=>t>=.9?"text-success-600":t>=.7?"text-warning-600":"text-error-600",s=t=>t>=.9?"badge-success":t>=.7?"badge-warning":"badge-error";return a.jsxs("div",{className:"card p-6 space-y-6",children:[a.jsxs("div",{className:"flex items-center justify-between",children:[a.jsx("h2",{className:"text-xl font-semibold text-slate-800",children:"Solution"}),a.jsxs("span",{className:`badge ${s(l.confidence)}`,children:[Math.round(l.confidence*100),"% confident"]})]}),a.jsxs("div",{className:"bg-primary-50 p-4 rounded-lg",children:[a.jsx("div",{className:"flex items-center gap-3 mb-2",children:a.jsxs("div",{className:"text-2xl font-bold text-primary-600",children:["Answer: ",l.answer]})}),a.jsx("p",{className:"text-slate-700",children:l.shortExplanation})]}),a.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-600",children:[a.jsxs("span",{className:"badge bg-slate-100 text-slate-700",children:[l.section," • ",l.subdomain.replace("_"," ")]}),a.jsxs("span",{className:"flex items-center gap-1",children:[a.jsx(ie,{className:"w-4 h-4"}),(l.timeMs/1e3).toFixed(1),"s"]})]}),a.jsxs("div",{className:"space-y-3",children:[a.jsx("h3",{className:"font-medium text-slate-800",children:"Checks"}),a.jsx("div",{className:"grid grid-cols-1 gap-2",children:l.evidenceOrChecks.map((t,e)=>a.jsxs("div",{className:"flex items-center gap-2 text-sm",children:[a.jsx($,{className:"w-4 h-4 text-success-500 flex-shrink-0"}),a.jsx("span",{className:"text-slate-600",children:t})]},e))})]}),a.jsxs("div",{className:"space-y-3",children:[a.jsx("h3",{className:"font-medium text-slate-800",children:l.timeMs>=1e3?`${(l.timeMs/1e3).toFixed(1)}s`:`${l.timeMs}ms`}),a.jsxs("div",{className:"text-sm text-slate-600",children:[l.modelVotes.length," model",l.modelVotes.length!==1?"s":""]}),a.jsx("div",{className:"space-y-2",children:l.modelVotes.map((t,e)=>a.jsxs("div",{className:"bg-slate-50 p-3 rounded-lg",children:[a.jsxs("div",{className:"flex items-center justify-between mb-2",children:[a.jsx("span",{className:"font-medium text-slate-800",children:t.model}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("span",{className:`font-medium ${n(t.confidence)}`,children:t.final}),a.jsxs("span",{className:"text-sm text-slate-500",children:[Math.round(t.confidence*100),"%"]})]})]}),a.jsx("p",{className:"text-sm text-slate-600 mb-2",children:t.meta.explanation}),t.meta.pythonResult&&a.jsx("div",{className:"mt-2",children:a.jsx("div",{className:"flex items-center gap-1 text-xs text-slate-500 mb-1",children:t.meta.pythonResult.ok?a.jsxs(a.Fragment,{children:[a.jsx(le,{className:"w-3 h-3 text-success-500"}),a.jsxs("span",{children:["🐍 Python: ",t.meta.pythonResult.result]})]}):a.jsxs(a.Fragment,{children:[a.jsx(S,{className:"w-3 h-3 text-error-500"}),a.jsxs("span",{children:["Python failed: ",t.meta.pythonResult.error]})]})})})]},e))})]}),a.jsxs("div",{className:"space-y-3",children:[a.jsx("h3",{className:"font-medium text-slate-800",children:"Verification"}),a.jsxs("div",{className:`p-3 rounded-lg ${l.verifier.passed?"bg-success-50":"bg-error-50"}`,children:[a.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[l.verifier.passed?a.jsx($,{className:"w-4 h-4 text-success-600"}):a.jsx(S,{className:"w-4 h-4 text-error-600"}),a.jsxs("span",{className:`font-medium ${l.verifier.passed?"text-success-800":"text-error-800"}`,children:["Verification ",l.verifier.passed?"Passed":"Failed"]}),a.jsxs("span",{className:"text-sm text-slate-600",children:["(",Math.round(l.verifier.score*100),"%)"]})]}),l.verifier.notes.map((t,e)=>a.jsxs("div",{className:"text-sm text-slate-700",children:["✓ ",t]},e))]})]}),l.modelVotes.some(t=>t.meta.python)&&a.jsxs("div",{className:"space-y-3",children:[a.jsxs("h3",{className:"font-medium text-slate-800 flex items-center gap-2",children:[a.jsx(te,{className:"w-4 h-4"}),"🐍 Python Verification Code"]}),l.modelVotes.filter(t=>t.meta.python).map((t,e)=>{var o;return a.jsxs("div",{className:"bg-slate-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto",children:[a.jsx("pre",{children:t.meta.python}),((o=t.meta.pythonResult)==null?void 0:o.ok)&&a.jsxs("div",{className:"mt-2 text-blue-300",children:["Result: ",t.meta.pythonResult.result]})]},e)})]})]})};class Me{constructor(){}async routeItem(n,s){console.log("📍 SATRouter starting classification...");const t=s||"EBRW",e=this.getDefaultSubdomain(t),o={section:t,subdomain:e,imageBase64:n.imageBase64,ocrText:"",fullText:"",question:"",choices:[],isGridIn:!1,hasFigure:!!n.imageBase64};return console.log(`📍 Routed as: ${t}/${e}`),o}getDefaultSubdomain(n){return n==="MATH"?"algebra":"information_ideas"}}async function B(l,n,s={}){throw new Error("VITE_OPENROUTER_API_KEY not configured")}const E=`You are an expert SAT Evidence-Based Reading & Writing (EBRW) solver.

Output Contract (strict)
Return ONLY a single JSON object (no prose, no markdown).
Do NOT include chain-of-thought. Keep explanations short, evidence-anchored.
If multiple passages or figures are present, cite evidence from the correct source.

Required JSON
{
"answer": "A|B|C|D",
"confidence_0_1": number,
"short_explanation": "≤2 sentences, evidence-based and concise.",
"evidence": ["verbatim quote(s) ≤ ~20 words each or line refs"],
"elimination_notes": {
"A": "why wrong (if not chosen)",
"B": "…",
"C": "…",
"D": "…"
}
}

Core Policy
Quote-then-decide: Find the smallest text span(s) that prove the correct choice. Prefer direct paraphrase over inference.
Eliminate systematically using a distractor taxonomy:
Out-of-scope (not supported anywhere)
Too strong/absolute (always, never, must)
Opposite/reverses relation
Partially true but misses the main point
Wrong focus (minor detail treated as main idea)

Calibration (confidence_0_1):
0.95–0.85: direct support (quote/paraphrase aligns cleanly)
0.75–0.65: inference with one reasonable step
0.55–0.45: weak or ambiguous support

No hallucinations: Every claim must be traceable to quoted evidence or standard grammar rules.

Domain Playbooks
Information & Ideas: Identify claim plus textual support; prefer options that subsume all the key elements of the passage’s statement (who, what, how, why). Avoid over-narrow or over-broad phrasings.
Craft & Structure: Track function of a paragraph or sentence (introduce, contrast, qualify, concede), tone (neutral, critical, analytical), and pivot cues (however, although, meanwhile). For vocabulary in context, prefer the sense that fits local syntax and discourse role, not the most common sense.
Expression of Ideas: Optimize clarity and concision without losing meaning; maintain tone and register; keep logical sequencing and transitions (cause→effect, contrast, example, concession).

Standard English Conventions (rule pack):
Sentence boundaries and comma splice: Independent clauses need period, semicolon, or comma plus FANBOYS; colon introduces explanation or list; dash pair or comma pair encloses nonrestrictive.
Agreement: Subject–verb; pronoun–antecedent (number, person, clarity). Indefinite pronouns (each, everyone) are singular.
Pronouns and case: who/whom; I/me; ambiguous references are wrong.
Verb tense and sequence: timeline consistency; conditional or subjunctive ("If I were..."); simple versus perfect aspect for completed action.
Modifiers: place next to the noun they modify; avoid danglers; maintain parallelism in lists or comparisons.
Comparison and idiom: fewer/less, between/among, adopt/adapt, compared with vs to, as/like, means of, different from.
Punctuation essentials: nonrestrictive equals comma pair; restrictive equals no commas; semicolon joins related independent clauses; colon after an independent clause only.
Apostrophes: singular vs plural possession; it's/its.
Concision rule: When two choices are both grammatical and preserve meaning, choose the shortest.

Final Check (before output)
The chosen answer must be directly supported by your evidence list.
Elimination notes should name a specific flaw category (see taxonomy).
Output the JSON only.`,v=["anthropic/claude-opus-4.1","openai/gpt-5","x-ai/grok-4"];class $e{constructor(){}async solve(n){const s=Date.now(),t=4e4;console.log(`🔄 EBRW solver starting concurrent quartet (${t}ms timeout)...`);try{const e=Math.min(t*.8,32e3),o=await this.raceForResults(n,e,t);if(console.log(`🔄 EBRW models completed: ${o.length}/${v.length} successful`),o.length===0)throw new Error("All EBRW models failed");const r=await this.selectBestEBRWResult(o);return console.log(`✅ EBRW solved: ${r.final} (${r.confidence.toFixed(2)}) in ${Date.now()-s}ms`),r}catch(e){throw console.error("EBRW solver error:",e),e}}async raceForResults(n,s,t){const e=[],o=v.map((r,i)=>this.solveWithModelSafe(n,r,s).then(c=>({result:c,index:i,model:r})));return new Promise((r,i)=>{let c=0,d=!1;const m=setTimeout(()=>{d||(d=!0,e.length>0?(console.log(`⏱️ EBRW timeout with ${e.length} results, proceeding...`),r(e)):i(new Error("EBRW total timeout with no results")))},t);o.forEach(u=>{u.then(({result:h})=>{if(!d&&h.confidence>.1&&(e.push(h),console.log(`✅ EBRW ${h.model} completed: ${h.final} (${h.confidence.toFixed(2)})`),e.length>=3||c>=v.length-1)){d=!0,clearTimeout(m),console.log(`🚀 EBRW early return with ${e.length} results`),r(e);return}c++,c>=v.length&&!d&&(d=!0,clearTimeout(m),r(e))}).catch(h=>{console.warn("EBRW model failed:",h),c++,c>=v.length&&!d&&(d=!0,clearTimeout(m),r(e))})})})}async solveWithModelSafe(n,s,t){try{return await this.solveWithModel(n,s,t)}catch(e){return console.warn(`🔄 EBRW ${s} failed:`,e),{final:"A",confidence:.1,meta:{method:"fallback",explanation:`${s} failed to respond`,checks:["model_failure"]},model:s}}}async solveWithModel(n,s,t){console.log(`🔄 EBRW solving with ${s} (${t}ms timeout)...`);const e=[];n.imageBase64?e.push({role:"user",content:[{type:"text",text:`${E}

Please solve this SAT EBRW question. Extract the question text and answer choices from the image, then provide your solution.

Domain: ${n.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`},{type:"image_url",image_url:{url:`data:image/jpeg;base64,${n.imageBase64}`}}]}):e.push({role:"user",content:`${E}

Problem: ${n.question}

Choices:
${n.choices.map((d,m)=>`${String.fromCharCode(65+m)}) ${d}`).join(`
`)}

Domain: ${n.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`});const o=await B(s,e,{});let r;try{const d=o.text.replace(/```json\s*|\s*```/g,"").trim();r=JSON.parse(d)}catch(d){throw console.error(`${s} JSON parse error:`,d),new Error(`Invalid JSON response from ${s}`)}const i=r.answer||"A";let c=r.confidence||.5;return r.evidence&&Array.isArray(r.evidence)&&r.evidence.length>0&&(c=Math.min(.95,c+.1)),{final:i,confidence:Math.max(.1,Math.min(1,c)),meta:{method:"evidence_based",explanation:r.explanation,evidence:r.evidence||[],elimination_notes:r.elimination,checks:["evidence_extraction","choice_elimination"]},model:s}}async selectBestEBRWResult(n){if(n.length===1)return n[0];const s=new Map,t=new Map;n.forEach(r=>{const i=r.final;s.set(i,(s.get(i)||0)+1),t.has(i)||t.set(i,[]),t.get(i).push(r)});let e=0,o="";for(const[r,i]of s)i>e&&(e=i,o=r);return e>1?t.get(o).reduce((i,c)=>c.confidence>i.confidence?c:i):n.reduce((r,i)=>i.confidence>r.confidence?i:r)}}async function Se(l,n){let t="";for(let e=0;e<2;e++)try{const o=new AbortController,r=setTimeout(()=>o.abort(),6e3),i=await fetch("/api/py/exec",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:l,inputs:n}),signal:o.signal});if(clearTimeout(r),(i.status===429||i.status>=500)&&(t=`HTTP ${i.status}: ${i.statusText}`,e<1)){await new Promise(d=>setTimeout(d,1e3*(e+1)));continue}return i.ok?await i.json():{ok:!1,error:`HTTP ${i.status}: ${i.statusText}`}}catch(o){if(t=o instanceof Error?o.message:"Unknown error",o instanceof Error&&o.name==="AbortError")return{ok:!1,error:"Python execution timeout (6s)"};if(e<1){await new Promise(r=>setTimeout(r,1e3*(e+1)));continue}}return{ok:!1,error:`Failed after 2 attempts: ${t}`}}const C=`You are an expert SAT Math solver.

Output & Safety Contract
Return ONLY a single JSON object (no extra text or markdown).
Keep explanation ≤2 sentences, no chain-of-thought.
Provide executable Python that works in a restricted sandbox:
No imports (import statements may be blocked).
Pre-injected modules available: sympy as sympy, np (NumPy), math, Fraction from fractions, statistics.
Set a final variable result to either the numeric value (for grid-in) or the selected letter ('A'|'B'|'C'|'D').
Prefer exact math: sympy.Rational, sympy.sqrt, sympy.nsimplify.
No file, network, or plotting. Keep runtime small.

Required JSON
{
"answer": "A|B|C|D|<numeric>",
"confidence_0_1": number,
"method": "symbolic|numeric|hybrid",
"short_explanation": "≤2 sentences",
"python": "# code that computes the final numeric quantity and assigns result"
}

Solve Policy
Parse and formalize variables, constraints, and what is asked.
Compute exactly when feasible (fractions or radicals). If numeric, use rationals or high precision then nsimplify.
Verify:
Substitute back or check constraints (domains: denominators ≠ 0, radicands ≥ 0, log arguments > 0).
If MCQ, compute the target value independently in Python; you may choose the letter in JSON after reasoning (Python should not rely on choices being present).

Formatting
Fractions in lowest terms; radicals simplified; π kept symbolic unless decimal is needed.
For grid-in: produce a plain number (integer, fraction like -3/4, or decimal). No units.

Topic Playbooks
Algebra: linear forms, slopes and intercepts, systems (eliminate or solve), absolute value cases, piecewise boundaries.
Advanced Math: quadratics (vertex or discriminant), polynomials (roots, factors, rational root theorem), rational functions (asymptotes, domains), exponentials and logs (change of base), inverse or compose.
PSDA: ratios, rates, percent, weighted average or mixtures, median or mean, two-way tables, linear models (slope = rate), unit conversions.
Geometry/Trig: similar triangles, circle arc or sector, angle chasing, area or volume, distance or midpoint, Pythagorean and special triangles, basic sin or cos in right triangles, coordinate geometry.

Python Template
# Pre-injected: sympy, np, math, Fraction, statistics
# Do NOT import. Keep prints minimal.

# 1) Define symbols or quantities
x = sympy.Symbol('x')

# 2) Compute target
expr = (x + 3)*(x - 5)
sol = sympy.solve(sympy.Eq(expr, 0), x)

# 3) Choose final numeric value if grid-in; otherwise compute the key quantity.
# Set result at the end:
result = sol  # or a number like Fraction(3,5) or float/int

Final step: Output the JSON only.`,R=["openai/gpt-5","x-ai/grok-4","anthropic/claude-4.1-sonnet"];class Ae{constructor(){}async solve(n){const s=Date.now(),t=6e4;console.log(`🔄 Math solver starting concurrent trio (${t}ms overall)...`);try{const e=Math.min(t-5e3,55e3),o=await this.runConcurrentModels(n,e);if(console.log(`🔄 Math models completed: ${o.length}/${R.length} successful`),o.length===0)throw new Error("All Math models failed");const r=await this.selectBestMathResult(o);return console.log(`✅ Math solved: ${r.final} (${r.confidence.toFixed(2)}) in ${Date.now()-s}ms`),r}catch(e){throw console.error("Math solver error:",e),e}}async runConcurrentModels(n,s){const t=R.map(o=>this.solveWithModelSafe(n,o,s));return(await Promise.allSettled(t)).filter(o=>o.status==="fulfilled").map(o=>o.value)}async solveWithModelSafe(n,s,t){try{return await this.solveWithModel(n,s,t)}catch(e){return console.warn(`🔄 Math ${s} failed:`,e),{final:n.choices.length>0?"A":"0",confidence:.1,meta:{method:"fallback",explanation:`${s} failed to respond`,python:`# ${s} failed
result = "${n.choices.length>0?"A":"0"}"`,pythonResult:{ok:!1,error:"Model timeout/error"},checks:["model_failure"]},model:s}}}async solveWithModel(n,s,t){console.log(`🔄 Math solving with ${s} (${t}ms timeout)...`);const e=[];if(n.imageBase64){const u=n.choices.length===0?"This is a grid-in question - provide the numeric answer.":"This is a multiple choice question - choose A, B, C, or D.";e.push({role:"user",content:[{type:"text",text:`${C}

Please solve this SAT Math question. Extract the problem from the image and solve it.

${u}

MUST include working Python code that sets 'result' variable.

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`},{type:"image_url",image_url:{url:`data:image/jpeg;base64,${n.imageBase64}`}}]})}else{const u=n.choices.length===0?`Problem: ${n.question}

This is a grid-in question - provide the numeric answer.`:`Problem: ${n.question}

Choices:
${n.choices.map((h,x)=>`${String.fromCharCode(65+x)}) ${h}`).join(`
`)}`;e.push({role:"user",content:`${C}

${u}

MUST include working Python code that sets 'result' variable.

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`})}const o=await B(s,e,{...s.startsWith("openai/")?{provider:{order:["azure","openai"]}}:{}});let r;try{const m=o.text.replace(/```json\s*|\s*```/g,"").trim();r=JSON.parse(m)}catch(m){throw console.error(`${s} JSON parse error:`,m),new Error(`Invalid JSON response from ${s}`)}let i=r.answer,c=r.confidence||.5,d={ok:!1,error:"No Python code"};if(r.python)try{const m=await Se(r.python);if(d=m,m.ok){const u=String(m.result).trim();if(console.log(`🐍 ${s} Python result: ${u}`),this.compareAnswers(u,i,n.choices))console.log(`✅ ${s} Python result matches model answer`),c=Math.min(.95,c+.1);else{const h=this.findMatchingChoice(u,n.choices);h?(console.log(`🔄 ${s} Python result matches choice ${h}, overriding model answer`),i=h,c=Math.min(.95,c+.15)):(console.log(`⚠️ ${s} Python result (${u}) doesn't match model answer (${i}) or any choice`),c*=.8)}}else console.log(`❌ ${s} Python execution failed: ${d.error}`),c*=.85}catch(m){console.error(`${s} Python execution error:`,m),c*=.85}else console.log(`⚠️ ${s} No Python code provided`),c*=.8;return{final:i,confidence:Math.max(.1,Math.min(1,c)),meta:{method:r.method,explanation:r.explanation,python:r.python,pythonResult:d,checks:["python_execution","symbolic_verification"]},model:s}}async selectBestMathResult(n){if(n.length===1)return n[0];const s=n.filter(t=>{var e;return(e=t.meta.pythonResult)==null?void 0:e.ok});if(s.length>0){const t=new Map,e=new Map;s.forEach(i=>{const c=i.final;t.set(c,(t.get(c)||0)+1),e.has(c)||e.set(c,[]),e.get(c).push(i)});let o=0,r="";for(const[i,c]of t)c>o&&(o=c,r=i);return o>1?e.get(r).reduce((c,d)=>d.confidence>c.confidence?d:c):s.reduce((i,c)=>c.confidence>i.confidence?c:i)}return n.reduce((t,e)=>e.confidence>t.confidence?e:t)}compareAnswers(n,s,t){const e=n.trim().toLowerCase(),o=s.trim().toLowerCase();if(e===o)return!0;if(/^[a-d]$/i.test(s)){const c=s.toUpperCase().charCodeAt(0)-65;if(c>=0&&c<t.length){const d=this.extractMathExpression(t[c]);return this.compareMathExpressions(e,d)}}const r=parseFloat(e),i=parseFloat(o);return!isNaN(r)&&!isNaN(i)?Math.abs(r-i)<.001:this.compareMathExpressions(e,o)}findMatchingChoice(n,s){const t=n.trim();for(let e=0;e<s.length;e++){const o=s[e],r=String.fromCharCode(65+e),i=this.extractMathExpression(o);if(this.compareMathExpressions(t,i))return r}return null}extractMathExpression(n){return n.replace(/[()]/g,"").replace(/^\w+\)\s*/,"").replace(/^\w+\.\s*/,"").replace(/22%/g,"2*x**2").replace(/32%/g,"3*x**2").replace(/(\d+)%/g,"$1*x**2").replace(/(\d+)x/g,"$1*x").replace(/x(\d+)/g,"x**$1").replace(/\s+/g,"").trim()}compareMathExpressions(n,s){try{const t=this.extractPolynomialCoefficients(n),e=this.extractPolynomialCoefficients(s);return t&&e?Math.abs(t.x2-e.x2)<.001&&Math.abs(t.x1-e.x1)<.001&&Math.abs(t.x0-e.x0)<.001:n.replace(/\s/g,"")===s.replace(/\s/g,"")}catch{return!1}}extractPolynomialCoefficients(n){try{const s=n.match(/([+-]?\d*)\*?x\*\*2/),t=n.match(/([+-]?\d*)\*?x(?!\*)/),e=n.match(/([+-]?\d+)(?![*x])/),o=s?s[1]===""||s[1]==="+"?1:s[1]==="-"?-1:parseFloat(s[1]):0,r=t?t[1]===""||t[1]==="+"?1:t[1]==="-"?-1:parseFloat(t[1]):0,i=e?parseFloat(e[1]):0;return{x2:o,x1:r,x0:i}}catch{return null}}}class Ee{constructor(){}async verify(n,s){console.log("🔍 EBRW verifier starting...");const t=[];let e=.8,o=!0;const r=[];return s.meta.evidence&&Array.isArray(s.meta.evidence)&&s.meta.evidence.length>0?(e+=.1,t.push("evidence_provided"),r.push("Evidence extracted from passage")):(e-=.2,r.push("No evidence provided - may indicate weak reasoning")),s.meta.elimination_notes&&(e+=.1,t.push("choice_elimination"),r.push("Wrong choices were eliminated")),s.confidence>=.7?(e+=.1,t.push("high_confidence"),r.push("High model confidence")):s.confidence<.5&&(e-=.2,o=!1,r.push("Low confidence suggests uncertainty")),/^[A-D]$/.test(s.final)?(t.push("valid_answer_format"),r.push("Answer format is valid")):(e-=.3,o=!1,r.push("Invalid answer format")),(n.subdomain==="craft_structure"||n.subdomain==="information_ideas")&&(!s.meta.evidence||s.meta.evidence.length===0)&&(e-=.2,r.push("Missing evidence for text analysis question")),e=Math.max(0,Math.min(1,e)),o=o&&e>=.6,console.log(`🔍 EBRW verification: ${o?"PASSED":"FAILED"} (${e.toFixed(2)})`),{passed:o,score:e,notes:r,checks:t}}}class Ce{constructor(){}async verify(n,s){var i,c,d,m;console.log("🔍 Math verifier starting...");const t=[];let e=.7,o=!0;const r=[];if((i=s.meta.pythonResult)!=null&&i.ok){e+=.2,t.push("python_verified"),r.push("Python code executed successfully");const u=String(s.meta.pythonResult.result).trim();this.compareAnswers(u,s.final,n.choices)&&(e+=.1,t.push("python_matches_answer"),r.push("Python result confirms final answer"))}else s.meta.python?(e-=.1,r.push("Python code provided but failed to execute")):(e-=.2,r.push("No Python verification code provided"));if(s.confidence>=.8?(e+=.1,t.push("high_confidence"),r.push("High solver confidence")):s.confidence<.5&&(e-=.2,o=!1,r.push("Low confidence suggests uncertainty")),n.choices.length>0)/^[A-D]$/.test(s.final)?(t.push("valid_mc_format"),r.push("Valid multiple choice answer format")):(e-=.3,o=!1,r.push("Invalid multiple choice answer format"));else{const u=parseFloat(s.final);isNaN(u)?(e-=.3,o=!1,r.push("Invalid numeric answer format")):(t.push("valid_numeric_format"),r.push("Valid numeric answer format"))}return n.subdomain==="algebra"?s.meta.method==="symbolic"&&(e+=.05,t.push("symbolic_algebra"),r.push("Used symbolic algebra approach")):n.subdomain==="geometry_trigonometry"&&((c=s.meta.explanation)!=null&&c.includes("angle")||(d=s.meta.explanation)!=null&&d.includes("triangle")||(m=s.meta.explanation)!=null&&m.includes("area"))&&(e+=.05,t.push("geometric_reasoning"),r.push("Shows geometric reasoning")),e=Math.max(0,Math.min(1,e)),o=o&&e>=.6,console.log(`🔍 Math verification: ${o?"PASSED":"FAILED"} (${e.toFixed(2)})`),{passed:o,score:e,notes:r,checks:t}}compareAnswers(n,s,t){const e=n.trim().toLowerCase(),o=s.trim().toLowerCase();if(e===o)return!0;const r=parseFloat(e),i=parseFloat(o);return!isNaN(r)&&!isNaN(i)?Math.abs(r-i)<.001:!1}}class Re{constructor(){}async aggregate(n,s,t,e){console.log("🎯 Aggregating results...");let o=s.confidence;t.passed?o=Math.min(1,o*(1+t.score*.2)):o=o*Math.max(.5,t.score);const r=Date.now()-e,i={answer:s.final,confidence:o,section:n.section,subdomain:n.subdomain,timeMs:r,modelVotes:[s],verifier:t,shortExplanation:s.meta.explanation||"Solution found using advanced reasoning.",evidenceOrChecks:[...s.meta.checks||[],...t.checks||[]]};return console.log(`🎯 Final aggregated answer: ${i.answer} (${(i.confidence*100).toFixed(1)}%)`),i}}class Pe{constructor(){g(this,"router");g(this,"ebrwSolver");g(this,"mathSolver");g(this,"ebrwVerifier");g(this,"mathVerifier");g(this,"aggregator");g(this,"metrics");this.router=new Me,this.ebrwSolver=new $e,this.mathSolver=new Ae,this.ebrwVerifier=new Ee,this.mathVerifier=new Ce,this.aggregator=new Re,this.metrics={total_questions:0,correct_answers:0,accuracy_rate:0,avg_latency_ms:0,p95_latency_ms:0,escalation_rate:0,model_usage:{"openai/gpt-5":0,"x-ai/grok-4":0,"anthropic/claude-opus-4.1":0,"anthropic/claude-4.1-sonnet":0}}}async solveQuestion(n,s,t){const e=Date.now();try{console.log("🎯 SAT Engine starting pipeline...");const o={source:"screenshot",choices:[],imageBase64:n,isGridIn:!1};console.log("📍 Router phase starting...");const r=await this.router.routeItem(o,s);console.log(`📍 Routed as: ${r.section}/${r.subdomain}`),console.log(`🔄 ${r.section} solver phase starting...`);let i;r.section==="EBRW"?i=await this.ebrwSolver.solve(r):i=await this.mathSolver.solve(r),console.log(`✅ Solver completed: ${i.final} (${i.confidence.toFixed(2)})`),console.log("🔍 Verifier phase starting...");let c;r.section==="EBRW"?c=await this.ebrwVerifier.verify(r,i):c=await this.mathVerifier.verify(r,i),console.log(`🔍 Verification: ${c.passed?"PASSED":"FAILED"} (${c.score.toFixed(2)})`),console.log("🎯 Aggregator phase starting...");const d=await this.aggregator.aggregate(r,i,c,e);this.updateMetrics(d,t,e);const m=Date.now()-e;return console.log(`🏁 SAT Engine completed in ${m}ms: ${d.answer} (${d.confidence.toFixed(2)})`),d}catch(o){throw console.error("❌ SAT Engine pipeline error:",o),o}}updateMetrics(n,s,t){if(this.metrics.total_questions++,s&&n.answer===s&&this.metrics.correct_answers++,this.metrics.accuracy_rate=this.metrics.correct_answers/this.metrics.total_questions,t){const e=Date.now()-t;this.metrics.avg_latency_ms=(this.metrics.avg_latency_ms*(this.metrics.total_questions-1)+e)/this.metrics.total_questions,this.metrics.p95_latency_ms=Math.max(this.metrics.p95_latency_ms,e)}n.modelVotes.forEach(e=>{e.model in this.metrics.model_usage&&this.metrics.model_usage[e.model]++}),n.modelVotes.length>1&&(this.metrics.escalation_rate=(this.metrics.escalation_rate*(this.metrics.total_questions-1)+1)/this.metrics.total_questions)}getMetrics(){return{...this.metrics}}}const Te=new Pe;function Ie(){const[l,n]=p.useState(null),[s,t]=p.useState(!1),e=async(o,r,i)=>{t(!0),n(null);try{const c=await Te.solveQuestion(o,r,i);n(c)}catch(c){console.error("Error solving question:",c),alert("Failed to solve question. Please try again.")}finally{t(!1)}};return a.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-slate-50 to-blue-50",children:[a.jsx("div",{className:"sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 z-40",children:a.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:a.jsxs("div",{className:"flex items-center justify-between h-16",children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl",children:a.jsx(X,{className:"w-6 h-6 text-white"})}),a.jsxs("div",{children:[a.jsx("h1",{className:"text-xl font-bold text-slate-800",children:"1600.ai"}),a.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"SAT Perfect Score AI"})]})]}),a.jsx("div",{className:"flex items-center gap-6",children:a.jsxs("div",{className:"hidden md:flex items-center gap-4 text-sm",children:[a.jsxs("div",{className:"flex items-center gap-1",children:[a.jsx(Ne,{className:"w-4 h-4 text-warning-600"}),a.jsx("span",{className:"text-slate-600",children:"Sub-30s latency"})]}),a.jsxs("div",{className:"flex items-center gap-1",children:[a.jsx(ge,{className:"w-4 h-4 text-success-600"}),a.jsx("span",{className:"text-slate-600",children:"≥1580 target"})]})]})})]})})}),a.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:a.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-8",children:[a.jsx("div",{className:"space-y-6",children:a.jsx(_e,{onSubmit:e,isLoading:s})}),a.jsxs("div",{className:"space-y-6",children:[s&&a.jsxs("div",{className:"card p-8 text-center",children:[a.jsx("div",{className:"animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"}),a.jsx("h3",{className:"text-lg font-semibold text-slate-800 mb-2",children:"Solving..."}),a.jsx("p",{className:"text-slate-600",children:"Running concurrent model inference with verification"})]}),a.jsx(ke,{solution:l})]})]})})]})}z.createRoot(document.getElementById("root")).render(a.jsx(V.StrictMode,{children:a.jsx(Ie,{})}));

var q=Object.defineProperty;var F=(l,a,e)=>a in l?q(l,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[a]=e;var y=(l,a,e)=>F(l,typeof a!="symbol"?a+"":a,e);import{r as P,g as T,a as D}from"./vendor-C8w-UNLI.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))o(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function e(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(t){if(t.ep)return;t.ep=!0;const r=e(t);fetch(t.href,r)}})();var N={exports:{}},w={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var j;function W(){if(j)return w;j=1;var l=P(),a=Symbol.for("react.element"),e=Symbol.for("react.fragment"),o=Object.prototype.hasOwnProperty,t=l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,r={key:!0,ref:!0,__self:!0,__source:!0};function n(c,i,d){var m,u={},h=null,f=null;d!==void 0&&(h=""+d),i.key!==void 0&&(h=""+i.key),i.ref!==void 0&&(f=i.ref);for(m in i)o.call(i,m)&&!r.hasOwnProperty(m)&&(u[m]=i[m]);if(c&&c.defaultProps)for(m in i=c.defaultProps,i)u[m]===void 0&&(u[m]=i[m]);return{$$typeof:a,type:c,key:h,ref:f,props:u,_owner:t.current}}return w.Fragment=e,w.jsx=n,w.jsxs=n,w}var $;function L(){return $||($=1,N.exports=W()),N.exports}var s=L(),g=P();const V=T(g);var b={},M;function U(){if(M)return b;M=1;var l=D();return b.createRoot=l.createRoot,b.hydrateRoot=l.hydrateRoot,b}var J=U();const z=T(J);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=l=>l.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Y=l=>l.replace(/^([A-Z])|[\s-_]+(\w)/g,(a,e,o)=>o?o.toUpperCase():e.toLowerCase()),_=l=>{const a=Y(l);return a.charAt(0).toUpperCase()+a.slice(1)},I=(...l)=>l.filter((a,e,o)=>!!a&&a.trim()!==""&&o.indexOf(a)===e).join(" ").trim(),G=l=>{for(const a in l)if(a.startsWith("aria-")||a==="role"||a==="title")return!0};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Q={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=g.forwardRef(({color:l="currentColor",size:a=24,strokeWidth:e=2,absoluteStrokeWidth:o,className:t="",children:r,iconNode:n,...c},i)=>g.createElement("svg",{ref:i,...Q,width:a,height:a,stroke:l,strokeWidth:o?Number(e)*24/Number(a):e,className:I("lucide",t),...!r&&!G(c)&&{"aria-hidden":"true"},...c},[...n.map(([d,m])=>g.createElement(d,m)),...Array.isArray(r)?r:[r]]));/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=(l,a)=>{const e=g.forwardRef(({className:o,...t},r)=>g.createElement(K,{ref:r,iconNode:a,className:I(`lucide-${H(_(l))}`,`lucide-${l}`,o),...t}));return e.displayName=_(l),e};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=[["path",{d:"M12 18V5",key:"adv99a"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",key:"1e3is1"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",key:"1gqd8o"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77",key:"iwvgf7"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464",key:"efp6ie"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",key:"1gq6am"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464",key:"k1g0md"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77",key:"q97ue3"}]],X=x("brain",Z);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]],te=x("calculator",ee);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],ae=x("camera",se);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],k=x("circle-check-big",ne);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],S=x("circle-x",oe);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],ie=x("clock",re);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],le=x("code-xml",ce);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["circle",{cx:"10",cy:"12",r:"2",key:"737tya"}],["path",{d:"m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22",key:"wt3hpn"}]],me=x("file-image",de);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const he=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],A=x("image",he);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ue=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],pe=x("send",ue);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],ge=x("target",fe);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],ye=x("upload",xe);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],ve=x("x",we);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Ne=x("zap",be),je=({onImageUploaded:l,isLoading:a})=>{const[e,o]=g.useState(!1),[t,r]=g.useState(null),n=g.useRef(null),c=h=>{h.preventDefault(),h.stopPropagation(),h.type==="dragenter"||h.type==="dragover"?o(!0):h.type==="dragleave"&&o(!1)},i=h=>{h.preventDefault(),h.stopPropagation(),o(!1),h.dataTransfer.files&&h.dataTransfer.files[0]&&m(h.dataTransfer.files[0])},d=h=>{h.target.files&&h.target.files[0]&&m(h.target.files[0])},m=async h=>{if(!h.type.startsWith("image/")){alert("Please upload an image file");return}const f=URL.createObjectURL(h);r(f);const p=new FileReader;p.onload=async()=>{const O=p.result;l(O)},p.readAsDataURL(h)},u=()=>{r(null),n.current&&(n.current.value="")};return s.jsxs("div",{className:"space-y-4",children:[t&&s.jsxs("div",{className:"relative",children:[s.jsx("img",{src:t,alt:"SAT Question Preview",className:"max-w-full h-auto rounded-lg border border-slate-200"}),s.jsx("button",{onClick:u,className:"absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-50",disabled:a,children:s.jsx(ve,{className:"w-4 h-4"})})]}),s.jsxs("div",{className:`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${e?"border-primary-400 bg-primary-50":"border-slate-300 hover:border-slate-400"} ${a?"opacity-50 pointer-events-none":""}`,onDragEnter:c,onDragLeave:c,onDragOver:c,onDrop:i,children:[s.jsx("input",{ref:n,type:"file",accept:"image/*",onChange:d,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer",disabled:a}),s.jsxs("div",{className:"space-y-3",children:[s.jsxs("div",{className:"flex justify-center space-x-2",children:[s.jsx(ye,{className:"w-8 h-8 text-slate-400"}),s.jsx(ae,{className:"w-8 h-8 text-slate-400"}),s.jsx(me,{className:"w-8 h-8 text-slate-400"})]}),s.jsxs("div",{children:[s.jsx("p",{className:"text-slate-600 font-medium",children:"Upload SAT Question Screenshot"}),s.jsx("p",{className:"text-sm text-slate-500 mt-1",children:"Drag and drop or click to select an image"})]}),s.jsx("div",{className:"text-xs text-slate-400",children:"Supports: JPG, PNG, WebP • Max 10MB"})]})]}),s.jsxs("div",{className:"text-xs text-slate-500 bg-primary-50 p-3 rounded-lg",children:[s.jsx("strong",{children:"Vision AI will read your image directly:"}),s.jsxs("ul",{className:"mt-1 space-y-1 list-disc list-inside",children:[s.jsx("li",{children:"Use high-resolution, clear images"}),s.jsx("li",{children:"Ensure good lighting and contrast"}),s.jsx("li",{children:"Crop to show only the question area"}),s.jsx("li",{children:"Include all answer choices and diagrams"})]})]})]})},$e=({onSubmit:l,isLoading:a})=>{const[e,o]=g.useState(""),[t,r]=g.useState("EBRW"),[n,c]=g.useState(!1),i=()=>{e&&l(e,t)},d=m=>{o(m),c(!0)};return s.jsxs("div",{className:"card p-6 space-y-6",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-xl font-semibold text-slate-800 flex items-center gap-2",children:[s.jsx(A,{className:"w-5 h-5"}),"Upload SAT Question"]}),s.jsx("p",{className:"text-sm text-slate-600 mt-1",children:"Upload a clear image of your SAT question. Our vision AI will read and solve it directly."})]}),s.jsx(je,{onImageUploaded:d,isLoading:a}),n&&s.jsxs("div",{className:"bg-primary-50 rounded-lg p-4 space-y-4",children:[s.jsxs("div",{className:"flex items-center gap-2 text-primary-700",children:[s.jsx(A,{className:"w-5 h-5"}),s.jsx("span",{className:"font-medium",children:"Image uploaded successfully"})]}),s.jsx("p",{className:"text-sm text-primary-600",children:"Ready to analyze with vision AI models"}),s.jsxs("div",{className:"flex gap-4 pt-2",children:[s.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[s.jsx("input",{type:"radio",className:"text-primary-600",checked:t==="EBRW",onChange:()=>r("EBRW")}),"EBRW"]}),s.jsxs("label",{className:"flex items-center gap-2 text-sm",children:[s.jsx("input",{type:"radio",className:"text-primary-600",checked:t==="MATH",onChange:()=>r("MATH")}),"Math"]})]}),s.jsx("div",{className:"pt-4 border-t border-slate-200",children:s.jsx("button",{type:"button",onClick:i,disabled:a||!e,className:"btn-primary w-full flex items-center justify-center gap-2",children:a?s.jsxs(s.Fragment,{children:[s.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Analyzing with Vision AI..."]}):s.jsxs(s.Fragment,{children:[s.jsx(pe,{className:"w-4 h-4"}),"Solve with Vision AI"]})})})]})]})},Me=({solution:l})=>{if(!l)return null;const a=e=>e>=.9?"badge-success":e>=.7?"badge-warning":"badge-error";return s.jsxs("div",{className:"card p-6 space-y-6",children:[s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsx("h2",{className:"text-xl font-semibold text-slate-800",children:"Solution"}),s.jsxs("span",{className:`badge ${a(l.confidence)}`,children:[Math.round(l.confidence*100),"% confident"]})]}),s.jsxs("div",{className:"bg-primary-50 p-4 rounded-lg",children:[s.jsx("div",{className:"flex items-center gap-3 mb-2",children:s.jsxs("div",{className:"text-2xl font-bold text-primary-600",children:["Answer: ",l.answer]})}),s.jsx("p",{className:"text-slate-700",children:l.shortExplanation})]}),s.jsxs("div",{className:"flex items-center gap-4 text-sm text-slate-600",children:[s.jsxs("span",{className:"badge bg-slate-100 text-slate-700",children:[l.section," • ",l.subdomain.replace("_"," ")]}),s.jsxs("span",{className:"flex items-center gap-1",children:[s.jsx(ie,{className:"w-4 h-4"}),(l.timeMs/1e3).toFixed(1),"s"]})]}),s.jsxs("div",{className:"space-y-3",children:[s.jsx("h3",{className:"font-medium text-slate-800",children:"Checks"}),s.jsx("div",{className:"grid grid-cols-1 gap-2",children:l.evidenceOrChecks.map((e,o)=>s.jsxs("div",{className:"flex items-center gap-2 text-sm",children:[s.jsx(k,{className:"w-4 h-4 text-success-500 flex-shrink-0"}),s.jsx("span",{className:"text-slate-600",children:e})]},o))})]}),s.jsxs("div",{className:"space-y-3",children:[s.jsx("h3",{className:"font-medium text-slate-800",children:"Model Results"}),s.jsxs("div",{className:"text-sm text-slate-600 mb-2",children:["Solved in ",l.timeMs>=1e3?`${(l.timeMs/1e3).toFixed(1)}s`:`${l.timeMs}ms`]}),s.jsxs("div",{className:"text-sm text-slate-600",children:[l.modelVotes.length," model",l.modelVotes.length!==1?"s":""]}),s.jsx("div",{className:"space-y-2",children:l.modelVotes.map((e,o)=>s.jsxs("div",{className:"bg-slate-50 p-3 rounded-lg",children:[s.jsxs("div",{className:"flex items-center justify-between mb-2",children:[s.jsx("span",{className:"font-medium text-slate-800",children:e.model.replace("anthropic/","").replace("openai/","").replace("x-ai/","")}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("span",{className:`font-bold text-lg ${e.final===l.answer?"text-success-600":"text-slate-400"}`,children:e.final}),s.jsxs("span",{className:"text-sm text-slate-500",children:[Math.round(e.confidence*100),"%"]}),e.final===l.answer&&s.jsx("span",{className:"text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full",children:"✓ Winner"})]})]}),s.jsx("p",{className:"text-sm text-slate-600 mb-2",children:e.meta.explanation}),e.meta.pythonResult&&s.jsx("div",{className:"mt-2",children:s.jsx("div",{className:"flex items-center gap-1 text-xs text-slate-500 mb-1",children:e.meta.pythonResult.ok?s.jsxs(s.Fragment,{children:[s.jsx(le,{className:"w-3 h-3 text-success-500"}),s.jsxs("span",{children:["🐍 Python: ",e.meta.pythonResult.result]})]}):s.jsxs(s.Fragment,{children:[s.jsx(S,{className:"w-3 h-3 text-error-500"}),s.jsxs("span",{children:["Python failed: ",e.meta.pythonResult.error]})]})})})]},o))})]}),s.jsxs("div",{className:"space-y-3",children:[s.jsx("h3",{className:"font-medium text-slate-800",children:"Verification"}),s.jsxs("div",{className:`p-3 rounded-lg ${l.verifier.passed?"bg-success-50":"bg-error-50"}`,children:[s.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[l.verifier.passed?s.jsx(k,{className:"w-4 h-4 text-success-600"}):s.jsx(S,{className:"w-4 h-4 text-error-600"}),s.jsxs("span",{className:`font-medium ${l.verifier.passed?"text-success-800":"text-error-800"}`,children:["Verification ",l.verifier.passed?"Passed":"Failed"]}),s.jsxs("span",{className:"text-sm text-slate-600",children:["(",Math.round(l.verifier.score*100),"%)"]})]}),l.verifier.notes.map((e,o)=>s.jsxs("div",{className:"text-sm text-slate-700",children:["✓ ",e]},o))]})]}),l.modelVotes.some(e=>e.meta.python)&&s.jsxs("div",{className:"space-y-3",children:[s.jsxs("h3",{className:"font-medium text-slate-800 flex items-center gap-2",children:[s.jsx(te,{className:"w-4 h-4"}),"🐍 Python Verification Code"]}),l.modelVotes.filter(e=>e.meta.python).map((e,o)=>{var t;return s.jsxs("div",{className:"bg-slate-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto",children:[s.jsx("pre",{children:e.meta.python}),((t=e.meta.pythonResult)==null?void 0:t.ok)&&s.jsxs("div",{className:"mt-2 text-blue-300",children:["Result: ",e.meta.pythonResult.result]})]},o)})]})]})};class _e{constructor(){}async routeItem(a,e){console.log("📍 SATRouter starting classification...");const o=e||"EBRW",t=this.getDefaultSubdomain(o),r={section:o,subdomain:t,imageBase64:a.imageBase64,ocrText:"",fullText:"",question:"",choices:[],isGridIn:!1,hasFigure:!!a.imageBase64};return console.log(`📍 Routed as: ${o}/${t}`),r}getDefaultSubdomain(a){return a==="MATH"?"algebra":"information_ideas"}}async function B(l,a,e={}){throw new Error("VITE_OPENROUTER_API_KEY not configured")}const E=`You are an expert SAT Evidence-Based Reading & Writing (EBRW) solver.

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
Output the JSON only.`,v=["anthropic/claude-opus-4.1","openai/gpt-5","x-ai/grok-4"];class ke{constructor(){}async solve(a){const e=Date.now(),o=6e4;console.log(`🔄 EBRW solver starting concurrent trio (${o}ms timeout)...`);try{const t=Math.min(o*.9,5e4),r=await this.raceForResults(a,t,o);if(console.log(`🔄 EBRW models completed: ${r.length}/${v.length} successful`),console.log("🔄 EBRW individual results:",r.map(c=>`${c.model}: ${c.final} (${(c.confidence*100).toFixed(1)}%)`)),r.length===0)throw new Error("All EBRW models failed");const n=await this.selectBestEBRWResult(r);return console.log(`✅ EBRW solved: ${n.final} (${n.confidence.toFixed(2)}) in ${Date.now()-e}ms`),n}catch(t){throw console.error("EBRW solver error:",t),t}}async raceForResults(a,e,o){const t=[],r=v.map((n,c)=>this.solveWithModelSafe(a,n,e).then(i=>({result:i,index:c,model:n})));return new Promise((n,c)=>{let i=0,d=!1;const m=setTimeout(()=>{d||(d=!0,t.length>0?(console.log(`⏱️ EBRW timeout after ${o}ms with ${t.length} results, proceeding...`),n(t)):c(new Error("EBRW total timeout with no results")))},o);r.forEach(u=>{u.then(({result:h})=>{!d&&h.confidence>.1?(t.push(h),console.log(`✅ EBRW ${h.model} completed: ${h.final} (${h.confidence.toFixed(2)})`),i++,i>=v.length&&(d=!0,clearTimeout(m),console.log(`🚀 EBRW all models completed with ${t.length} results`),n(t))):(i++,i>=v.length&&!d&&(d=!0,clearTimeout(m),n(t)))}).catch(h=>{console.warn("🔄 EBRW model failed:",h),i++,i>=v.length&&!d&&(d=!0,clearTimeout(m),n(t))})})})}async solveWithModelSafe(a,e,o){try{return await this.solveWithModel(a,e,o)}catch(t){return console.warn(`🔄 EBRW ${e} failed:`,t),{final:"A",confidence:.1,meta:{method:"fallback",explanation:`${e} failed to respond`,checks:["model_failure"]},model:e}}}async solveWithModel(a,e,o){console.log(`🔄 EBRW solving with ${e} (${o}ms timeout)...`);const t=[];a.imageBase64?t.push({role:"user",content:[{type:"text",text:`${E}

Please solve this SAT EBRW question. Extract the question text and answer choices from the image, then provide your solution.

Domain: ${a.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`},{type:"image_url",image_url:{url:a.imageBase64}}]}):t.push({role:"user",content:`${E}

Problem: ${a.question}

Choices:
${a.choices.map((d,m)=>`${String.fromCharCode(65+m)}) ${d}`).join(`
`)}

Domain: ${a.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`});const r=await B(e,t,{});let n;try{const d=r.text.replace(/```json\s*|\s*```/g,"").trim();n=JSON.parse(d)}catch(d){throw console.error(`${e} JSON parse error:`,d),new Error(`Invalid JSON response from ${e}`)}const c=n.answer||"A";let i=n.confidence||.5;return n.evidence&&Array.isArray(n.evidence)&&n.evidence.length>0&&(i=Math.min(.95,i+.1)),{final:c,confidence:Math.max(.1,Math.min(1,i)),meta:{method:"evidence_based",explanation:n.explanation,evidence:n.evidence||[],elimination_notes:n.elimination,checks:["evidence_extraction","choice_elimination"]},model:e}}async selectBestEBRWResult(a){if(a.length===1)return a[0];const e=new Map,o=new Map;a.forEach(c=>{const i=c.final;e.set(i,(e.get(i)||0)+1),o.has(i)||o.set(i,[]),o.get(i).push(c)});let t=0,r="";for(const[c,i]of e)i>t&&(t=i,r=c);return console.log("🔄 EBRW vote breakdown:",Array.from(e.entries()).map(([c,i])=>`${c}: ${i} votes`)),console.log(`🔄 EBRW majority winner: ${r} with ${t} votes`),o.get(r).reduce((c,i)=>i.confidence>c.confidence?i:c)}}async function Se(l,a){let o="";for(let t=0;t<2;t++)try{const r=new AbortController,n=setTimeout(()=>r.abort(),6e3),c=await fetch("/api/py/exec",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:l,inputs:a}),signal:r.signal});if(clearTimeout(n),(c.status===429||c.status>=500)&&(o=`HTTP ${c.status}: ${c.statusText}`,t<1)){await new Promise(d=>setTimeout(d,1e3*(t+1)));continue}return c.ok?await c.json():{ok:!1,error:`HTTP ${c.status}: ${c.statusText}`}}catch(r){if(o=r instanceof Error?r.message:"Unknown error",r instanceof Error&&r.name==="AbortError")return{ok:!1,error:"Python execution timeout (6s)"};if(t<1){await new Promise(n=>setTimeout(n,1e3*(t+1)));continue}}return{ok:!1,error:`Failed after 2 attempts: ${o}`}}const R=`You are an expert SAT Math solver.

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

Final step: Output the JSON only.`,C=["openai/gpt-5","x-ai/grok-4","anthropic/claude-4.1-sonnet"];class Ae{constructor(){}async solve(a){const e=Date.now(),o=75e3;console.log(`🔄 Math solver starting concurrent trio (${o}ms overall)...`);try{const t=Math.min(o-5e3,65e3),r=await this.runConcurrentModels(a,t);if(console.log(`🔄 Math models completed: ${r.length}/${C.length} successful`),console.log("🔄 Math individual results:",r.map(c=>`${c.model}: ${c.final} (${(c.confidence*100).toFixed(1)}%)`)),r.length===0)throw new Error("All Math models failed");const n=await this.selectBestMathResult(r);return console.log(`✅ Math solved: ${n.final} (${n.confidence.toFixed(2)}) in ${Date.now()-e}ms`),n}catch(t){throw console.error("Math solver error:",t),t}}async runConcurrentModels(a,e){const o=C.map(async r=>{try{const n=await this.solveWithModelSafe(a,r,e);return console.log(`✅ Math ${r} completed: ${n.final} (${n.confidence.toFixed(2)})`),n}catch(n){return console.warn(`❌ Math ${r} failed:`,n),null}});return(await Promise.allSettled(o)).filter(r=>r.status==="fulfilled").map(r=>r.value).filter(r=>r!==null)}async solveWithModelSafe(a,e,o){try{return await this.solveWithModel(a,e,o)}catch(t){return console.warn(`🔄 Math ${e} failed:`,t),{final:a.choices.length>0?"A":"0",confidence:.1,meta:{method:"fallback",explanation:`${e} failed to respond`,python:`# ${e} failed
result = "${a.choices.length>0?"A":"0"}"`,pythonResult:{ok:!1,error:"Model timeout/error"},checks:["model_failure"]},model:e}}}async solveWithModel(a,e,o){console.log(`🔄 Math solving with ${e} (${o}ms timeout)...`);const t=[];if(a.imageBase64){const u=a.choices.length===0?"This is a grid-in question - provide the numeric answer.":"This is a multiple choice question - choose A, B, C, or D.";t.push({role:"user",content:[{type:"text",text:`${R}

Please solve this SAT Math question. Extract the problem from the image and solve it.

${u}

MUST include working Python code that sets 'result' variable.

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`},{type:"image_url",image_url:{url:a.imageBase64}}]})}else{const u=a.choices.length===0?`Problem: ${a.question}

This is a grid-in question - provide the numeric answer.`:`Problem: ${a.question}

Choices:
${a.choices.map((h,f)=>`${String.fromCharCode(65+f)}) ${h}`).join(`
`)}`;t.push({role:"user",content:`${R}

${u}

MUST include working Python code that sets 'result' variable.

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`})}const r=await B(e,t,{...e.startsWith("openai/")?{provider:{order:["azure","openai"]}}:{}});let n;try{const m=r.text.replace(/```json\s*|\s*```/g,"").trim();n=JSON.parse(m)}catch(m){throw console.error(`${e} JSON parse error:`,m),new Error(`Invalid JSON response from ${e}`)}let c=n.answer,i=n.confidence||.5,d={ok:!1,error:"No Python code"};if(n.python)try{const m=await Se(n.python);if(d=m,m.ok){const u=String(m.result).trim();if(console.log(`🐍 ${e} Python result: ${u}`),this.compareAnswers(u,c,a.choices))console.log(`✅ ${e} Python result matches model answer`),i=Math.min(.95,i+.1);else{const h=this.findMatchingChoice(u,a.choices);h?(console.log(`🔄 ${e} Python result matches choice ${h}, overriding model answer`),c=h,i=Math.min(.95,i+.15)):(console.log(`⚠️ ${e} Python result (${u}) doesn't match model answer (${c}) or any choice`),i*=.8)}}else console.log(`❌ ${e} Python execution failed: ${d.error}`),i*=.85}catch(m){console.error(`${e} Python execution error:`,m),i*=.85}else console.log(`⚠️ ${e} No Python code provided`),i*=.8;return{final:c,confidence:Math.max(.1,Math.min(1,i)),meta:{method:n.method,explanation:n.explanation,python:n.python,pythonResult:d,checks:["python_execution","symbolic_verification"]},model:e}}async selectBestMathResult(a){if(a.length===1)return a[0];const e=a.filter(i=>{var d;return(d=i.meta.pythonResult)==null?void 0:d.ok});if(e.length>0){console.log(`🔄 Math ${e.length} results have Python verification`);const i=new Map,d=new Map;e.forEach(f=>{const p=f.final;i.set(p,(i.get(p)||0)+1),d.has(p)||d.set(p,[]),d.get(p).push(f)});let m=0,u="";for(const[f,p]of i)p>m&&(m=p,u=f);return console.log("🔄 Math verified vote breakdown:",Array.from(i.entries()).map(([f,p])=>`${f}: ${p} votes`)),console.log(`🔄 Math verified majority winner: ${u} with ${m} votes`),d.get(u).reduce((f,p)=>p.confidence>f.confidence?p:f)}console.log(`🔄 Math no Python verification, using all ${a.length} results for majority vote`);const o=new Map,t=new Map;a.forEach(i=>{const d=i.final;o.set(d,(o.get(d)||0)+1),t.has(d)||t.set(d,[]),t.get(d).push(i)});let r=0,n="";for(const[i,d]of o)d>r&&(r=d,n=i);return console.log("🔄 Math all results vote breakdown:",Array.from(o.entries()).map(([i,d])=>`${i}: ${d} votes`)),console.log(`🔄 Math all results majority winner: ${n} with ${r} votes`),t.get(n).reduce((i,d)=>d.confidence>i.confidence?d:i)}compareAnswers(a,e,o){const t=a.trim().toLowerCase(),r=e.trim().toLowerCase();if(t===r)return!0;if(/^[a-d]$/i.test(e)){const i=e.toUpperCase().charCodeAt(0)-65;if(i>=0&&i<o.length){const d=this.extractMathExpression(o[i]);return this.compareMathExpressions(t,d)}}const n=parseFloat(t),c=parseFloat(r);return!isNaN(n)&&!isNaN(c)?Math.abs(n-c)<.001:this.compareMathExpressions(t,r)}findMatchingChoice(a,e){const o=a.trim();for(let t=0;t<e.length;t++){const r=e[t],n=String.fromCharCode(65+t),c=this.extractMathExpression(r);if(this.compareMathExpressions(o,c))return n}return null}extractMathExpression(a){return a.replace(/[()]/g,"").replace(/^\w+\)\s*/,"").replace(/^\w+\.\s*/,"").replace(/22%/g,"2*x**2").replace(/32%/g,"3*x**2").replace(/(\d+)%/g,"$1*x**2").replace(/(\d+)x/g,"$1*x").replace(/x(\d+)/g,"x**$1").replace(/\s+/g,"").trim()}compareMathExpressions(a,e){try{const o=this.extractPolynomialCoefficients(a),t=this.extractPolynomialCoefficients(e);return o&&t?Math.abs(o.x2-t.x2)<.001&&Math.abs(o.x1-t.x1)<.001&&Math.abs(o.x0-t.x0)<.001:a.replace(/\s/g,"")===e.replace(/\s/g,"")}catch{return!1}}extractPolynomialCoefficients(a){try{const e=a.match(/([+-]?\d*)\*?x\*\*2/),o=a.match(/([+-]?\d*)\*?x(?!\*)/),t=a.match(/([+-]?\d+)(?![*x])/),r=e?e[1]===""||e[1]==="+"?1:e[1]==="-"?-1:parseFloat(e[1]):0,n=o?o[1]===""||o[1]==="+"?1:o[1]==="-"?-1:parseFloat(o[1]):0,c=t?parseFloat(t[1]):0;return{x2:r,x1:n,x0:c}}catch{return null}}}class Ee{constructor(){}async verify(a,e){console.log("🔍 EBRW verifier starting...");const o=[];let t=.8,r=!0;const n=[];return e.meta.evidence&&Array.isArray(e.meta.evidence)&&e.meta.evidence.length>0?(t+=.1,o.push("evidence_provided"),n.push("Evidence extracted from passage")):(t-=.2,n.push("No evidence provided - may indicate weak reasoning")),e.meta.elimination_notes&&(t+=.1,o.push("choice_elimination"),n.push("Wrong choices were eliminated")),e.confidence>=.7?(t+=.1,o.push("high_confidence"),n.push("High model confidence")):e.confidence<.5&&(t-=.2,r=!1,n.push("Low confidence suggests uncertainty")),/^[A-D]$/.test(e.final)?(o.push("valid_answer_format"),n.push("Answer format is valid")):(t-=.3,r=!1,n.push("Invalid answer format")),(a.subdomain==="craft_structure"||a.subdomain==="information_ideas")&&(!e.meta.evidence||e.meta.evidence.length===0)&&(t-=.2,n.push("Missing evidence for text analysis question")),t=Math.max(0,Math.min(1,t)),r=r&&t>=.6,console.log(`🔍 EBRW verification: ${r?"PASSED":"FAILED"} (${t.toFixed(2)})`),{passed:r,score:t,notes:n,checks:o}}}class Re{constructor(){}async verify(a,e){var c,i,d,m;console.log("🔍 Math verifier starting...");const o=[];let t=.7,r=!0;const n=[];if((c=e.meta.pythonResult)!=null&&c.ok){t+=.2,o.push("python_verified"),n.push("Python code executed successfully");const u=String(e.meta.pythonResult.result).trim();this.compareAnswers(u,e.final,a.choices)&&(t+=.1,o.push("python_matches_answer"),n.push("Python result confirms final answer"))}else e.meta.python?(t-=.1,n.push("Python code provided but failed to execute")):(t-=.2,n.push("No Python verification code provided"));if(e.confidence>=.8?(t+=.1,o.push("high_confidence"),n.push("High solver confidence")):e.confidence<.5&&(t-=.2,r=!1,n.push("Low confidence suggests uncertainty")),a.choices.length>0)/^[A-D]$/.test(e.final)?(o.push("valid_mc_format"),n.push("Valid multiple choice answer format")):(t-=.3,r=!1,n.push("Invalid multiple choice answer format"));else{const u=parseFloat(e.final);isNaN(u)?(t-=.3,r=!1,n.push("Invalid numeric answer format")):(o.push("valid_numeric_format"),n.push("Valid numeric answer format"))}return a.subdomain==="algebra"?e.meta.method==="symbolic"&&(t+=.05,o.push("symbolic_algebra"),n.push("Used symbolic algebra approach")):a.subdomain==="geometry_trigonometry"&&((i=e.meta.explanation)!=null&&i.includes("angle")||(d=e.meta.explanation)!=null&&d.includes("triangle")||(m=e.meta.explanation)!=null&&m.includes("area"))&&(t+=.05,o.push("geometric_reasoning"),n.push("Shows geometric reasoning")),t=Math.max(0,Math.min(1,t)),r=r&&t>=.6,console.log(`🔍 Math verification: ${r?"PASSED":"FAILED"} (${t.toFixed(2)})`),{passed:r,score:t,notes:n,checks:o}}compareAnswers(a,e,o){const t=a.trim().toLowerCase(),r=e.trim().toLowerCase();if(t===r)return!0;const n=parseFloat(t),c=parseFloat(r);return!isNaN(n)&&!isNaN(c)?Math.abs(n-c)<.001:!1}}class Ce{constructor(){}async aggregate(a,e,o,t){console.log(`🎯 Aggregating results for final answer: ${e.final} with ${e.confidence.toFixed(3)} confidence`);let r=e.confidence;o.passed?(r=Math.min(1,r*(1+o.score*.2)),console.log(`🎯 Verification passed, boosted confidence to ${r.toFixed(3)}`)):(r=r*Math.max(.5,o.score),console.log(`🎯 Verification failed, reduced confidence to ${r.toFixed(3)}`));const n=Date.now()-t,c={answer:e.final,confidence:r,section:a.section,subdomain:a.subdomain,timeMs:n,modelVotes:[e],verifier:o,shortExplanation:e.meta.explanation||"Solution found using advanced reasoning.",evidenceOrChecks:[...e.meta.checks||[],...o.checks||[]]};return console.log(`🎯 Final aggregated answer: ${c.answer} (${(c.confidence*100).toFixed(1)}%)`),c}}class Pe{constructor(){y(this,"router");y(this,"ebrwSolver");y(this,"mathSolver");y(this,"ebrwVerifier");y(this,"mathVerifier");y(this,"aggregator");y(this,"metrics");this.router=new _e,this.ebrwSolver=new ke,this.mathSolver=new Ae,this.ebrwVerifier=new Ee,this.mathVerifier=new Re,this.aggregator=new Ce,this.metrics={total_questions:0,correct_answers:0,accuracy_rate:0,avg_latency_ms:0,p95_latency_ms:0,escalation_rate:0,model_usage:{"openai/gpt-5":0,"x-ai/grok-4":0,"anthropic/claude-opus-4.1":0,"anthropic/claude-4.1-sonnet":0}}}async solveQuestion(a,e,o){const t=Date.now();try{console.log("🎯 SAT Engine starting pipeline...");const r={source:"screenshot",choices:[],imageBase64:a,isGridIn:!1};console.log("📍 Router phase starting...");const n=await this.router.routeItem(r,e);console.log(`📍 Routed as: ${n.section}/${n.subdomain}`),console.log(`🔄 ${n.section} solver phase starting...`);let c;n.section==="EBRW"?c=await this.ebrwSolver.solve(n):c=await this.mathSolver.solve(n),console.log(`✅ Solver completed: ${c.final} (${c.confidence.toFixed(2)})`),console.log("🔍 Verifier phase starting...");let i;n.section==="EBRW"?i=await this.ebrwVerifier.verify(n,c):i=await this.mathVerifier.verify(n,c),console.log(`🔍 Verification: ${i.passed?"PASSED":"FAILED"} (${i.score.toFixed(2)})`),console.log("🎯 Aggregator phase starting...");const d=await this.aggregator.aggregate(n,c,i,t);this.updateMetrics(d,o,t);const m=Date.now()-t;return console.log(`🏁 SAT Engine completed in ${m}ms: ${d.answer} (${d.confidence.toFixed(2)})`),d}catch(r){throw console.error("❌ SAT Engine pipeline error:",r),r}}updateMetrics(a,e,o){if(this.metrics.total_questions++,e&&a.answer===e&&this.metrics.correct_answers++,this.metrics.accuracy_rate=this.metrics.correct_answers/this.metrics.total_questions,o){const t=Date.now()-o;this.metrics.avg_latency_ms=(this.metrics.avg_latency_ms*(this.metrics.total_questions-1)+t)/this.metrics.total_questions,this.metrics.p95_latency_ms=Math.max(this.metrics.p95_latency_ms,t)}a.modelVotes.forEach(t=>{t.model in this.metrics.model_usage&&this.metrics.model_usage[t.model]++}),a.modelVotes.length>1&&(this.metrics.escalation_rate=(this.metrics.escalation_rate*(this.metrics.total_questions-1)+1)/this.metrics.total_questions)}getMetrics(){return{...this.metrics}}}const Te=new Pe;function Ie(){const[l,a]=g.useState(null),[e,o]=g.useState(!1),t=async(r,n,c)=>{o(!0),a(null);try{const i=await Te.solveQuestion(r,n,c);a(i)}catch(i){console.error("Error solving question:",i),alert("Failed to solve question. Please try again.")}finally{o(!1)}};return s.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-slate-50 to-blue-50",children:[s.jsx("div",{className:"sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 z-40",children:s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:s.jsxs("div",{className:"flex items-center justify-between h-16",children:[s.jsxs("div",{className:"flex items-center gap-3",children:[s.jsx("div",{className:"p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl",children:s.jsx(X,{className:"w-6 h-6 text-white"})}),s.jsxs("div",{children:[s.jsx("h1",{className:"text-xl font-bold text-slate-800",children:"1600.ai"}),s.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"SAT Perfect Score AI"})]})]}),s.jsx("div",{className:"flex items-center gap-6",children:s.jsxs("div",{className:"hidden md:flex items-center gap-4 text-sm",children:[s.jsxs("div",{className:"flex items-center gap-1",children:[s.jsx(Ne,{className:"w-4 h-4 text-warning-600"}),s.jsx("span",{className:"text-slate-600",children:"Sub-30s latency"})]}),s.jsxs("div",{className:"flex items-center gap-1",children:[s.jsx(ge,{className:"w-4 h-4 text-success-600"}),s.jsx("span",{className:"text-slate-600",children:"≥1580 target"})]})]})})]})})}),s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:s.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-8",children:[s.jsx("div",{className:"space-y-6",children:s.jsx($e,{onSubmit:t,isLoading:e})}),s.jsxs("div",{className:"space-y-6",children:[e&&s.jsxs("div",{className:"card p-8 text-center",children:[s.jsx("div",{className:"animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"}),s.jsx("h3",{className:"text-lg font-semibold text-slate-800 mb-2",children:"Solving..."}),s.jsx("p",{className:"text-slate-600",children:"Running concurrent model inference with verification"})]}),s.jsx(Me,{solution:l})]})]})})]})}z.createRoot(document.getElementById("root")).render(s.jsx(V.StrictMode,{children:s.jsx(Ie,{})}));

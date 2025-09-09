# 1600.ai

**1600.ai** is an experimental research project aimed at building an AI system that can achieve a near-perfect score on the SAT (targeting ≥1580, ideally 1600) using cutting-edge large language models (LLMs), program-aided math solving, and evidence-based reasoning.

---

## 🚀 Overview

The goal of **1600.ai** is simple but ambitious:  
**zero (or near-zero) mistakes on the SAT.**

We’re testing the limits of LLMs by combining:
- **Multi-model routing & ensembling**: GPT-5, GPT-5 Thinking, o4-mini, Claude 3.5 Sonnet, Gemini 2.5, and Qwen2.5-Math.  
- **Tool-augmented math solving**: Program-of-Thought (PoT) with Python execution + verification.  
- **Evidence-based EBRW solving**: Extract claims, quote support, run verifier passes, eliminate distractors.  
- **Routing by domain**: Different models and strategies for Math vs. Evidence-Based Reading & Writing (EBRW).  
- **Verifier > voter**: Verified solutions trump raw majority vote.

---

## 🧩 SAT Domains Covered

**Evidence-Based Reading & Writing (EBRW)**
- Craft & Structure  
- Information & Ideas  
- Standard English Conventions (grammar, punctuation, usage)  
- Expression of Ideas (organization, concision, style)

**Math**
- Algebra  
- Advanced Math (nonlinear functions, quadratics, polynomials)  
- Problem-Solving & Data Analysis (ratios, percents, statistics)  
- Geometry & Trigonometry  
- Calculator active for all questions (modeled in pipeline)

---

## ⚙️ Architecture (high level)

1. **Router**  
   - Detects section + subdomain, normalizes input, sets time budget.

2. **Solver**  
   - **Math**: o4-mini (Python tool) → verify → escalate to GPT-5 Thinking if uncertain.  
   - **EBRW**: GPT-5 (low effort) → evidence span + grammar rule extraction → verified by Claude 3.5 Sonnet.  

3. **Verifier**  
   - Math: substitution, domain/unit checks, symbolic verification.  
   - EBRW: evidence existence + secondary judge pass.  

4. **Aggregator**  
   - Weighted blend of solver + verifier outputs.  
   - Escalate only on low confidence or model disagreement.

---

## ⏱️ Performance Targets

- **Accuracy**:  
  - ≥99.5% Math  
  - ≥99% EBRW  
  - Across official practice tests, ≤2 total errors → ≥1580 score.  

- **Latency**:  
  - p95 ≤ 30 seconds per question  
  - Escalations allowed but bounded

---

## 🔒 Ethics

This project is **for research and practice test evaluation only.**  
It is **not intended for use on live, official SAT administrations.**

---

## 📍 Roadmap

- [x] Research best-performing models & strategies  
- [x] Draft solver/verifier prompts  
- [ ] Build prototype pipeline (router → solver → verifier → aggregator)  
- [ ] Integrate into unified platform (LiteLLM / OpenRouter)  
- [ ] Run evaluation on official College Board practice tests  
- [ ] Optimize for latency + cost  

---

## 📚 References

- College Board Digital SAT structure & scoring  
- OpenAI o-series (o3, o4-mini) reasoning models  
- Anthropic Claude 3.5 Sonnet  
- Google Gemini 2.5 (Pro/Thinking)  
- Qwen2.5-Math-72B  
- Research on self-consistency, program-aided math solving, and MCQ verification  

---

### Maintainer
Built with ❤️ for research & experimentation.  

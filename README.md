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
   - **Math**: Concurrent trio (GPT-5, Grok-4, DeepSeek-R1) with Python verification → aggregate best result.  
   - **EBRW**: Concurrent quartet (O3, GPT-5, Grok-4, Claude Sonnet 4) → evidence extraction → verified by Claude/Grok.  

3. **Verifier**  
   - Math: substitution, domain/unit checks, symbolic verification.  
   - EBRW: evidence existence + secondary judge pass.  

4. **Aggregator**  
   - Weighted blend of solver + verifier outputs.  
   - Select best result from concurrent model outputs.

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
- [x] Build prototype pipeline (router → solver → verifier → aggregator)  
- [x] Integrate into unified platform (OpenRouter)  
- [ ] Run evaluation on official College Board practice tests  
- [ ] Optimize for latency + cost  

---

## 📚 References

- College Board Digital SAT structure & scoring  
- OpenAI models (O3, GPT-5) via OpenRouter
- Anthropic Claude Sonnet 4 via OpenRouter
- X.AI Grok-4 via OpenRouter
- DeepSeek R1 via OpenRouter
- Research on self-consistency, program-aided math solving, and MCQ verification  

---

### Maintainer
Built with ❤️ for research & experimentation.  

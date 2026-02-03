---
date: 2026-02-03 15:23:00 (Created)
title: Critical Analysis of FSRS UX Reconstruction
---

# 학습 시스템 비판적 분석 보고서 (Critical Analysis Report)

> [!NOTE]
> 본 보고서는 사용자 제안에 대한 맹목적 수용을 지양하고, **데이터 구조, 학습 심리학(Active Recall), UX 일관성** 관점에서 냉정하게 검토한 결과입니다.

## 1. 문법 학습 FSRS 연동: "단순화의 위험성"
- **분석**: 문법은 '문맥'과 '활용'이 핵심이므로 단어와 동일한 FSRS 가산 로직은 위험할 수 있음.
- **결론**: 문법 전용 가중치(Weights) 튜닝 및 차후 '활용형/빈칸 채우기' 퀴즈 인터페이스 확장을 위한 데이터 스키마 설계 필수.

## 2. 모달 UX - "True Quiz vs Friction"
- **분석**: 가이드를 100% 가리는 것은 정답을 모르는 상황(초기 학습)에서 'Friction' 발생 우려.
- **결론**: **안정도(Stability) 기반의 Adaptive Scaffolding**을 도입하여 초기에는 0.1~0.15의 가이드 투명도를 유지하고, 일정 안정도 이상에서만 0%(완전 은폐) 모드를 활성화. 로마자 및 의미는 캔버스를 가리지 않는 **Static Header**로 이관.

## 3. 분석 공간 재정의: "Mastery Board vs Analytics"
- **제안**: Mastery Board는 학습 맥락(리스트)에 통합, Analytics는 매크로 데이터 전용으로 분리.
- **결론**: 리스트 상단에 요약형 **'Mastery Cluster Map'**을 배치하고 개별 리스트 아이템에 **'Stability Aura'**를 부여하여 학습 맥락을 유지. Analytics는 전문적인 '망각 예측 트렌드' 공간으로 특화.

---
**Last Updated**: 2026-02-03

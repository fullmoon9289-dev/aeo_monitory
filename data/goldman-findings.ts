// Direct public HTTP observations, 2026-09-15. Review priorities, not AI performance or legal findings.
export const goldmanFindings = [
  {
    "id": "cost",
    "priority": "우선 확인",
    "title": "수술비의 기준·포함 항목·적용일을 맞추세요",
    "observation": "수술 안내와 의료정보 비용 문서의 아이틴드·유로리프트 안내 범위가 다릅니다. 비용 문서는 2026년 7월 고지를 출처로 쓰지만 비급여 페이지 표시 기준일은 2025년 12월 17일입니다.",
    "implication": "지점·재료·포함 항목 차이일 수 있으므로 어느 금액이 맞는지 단정하지 않습니다. 환자와 AI가 한 문서만 읽으면 서로 다른 안내를 받게 될 수 있습니다.",
    "action": "병원에서 현재 가격표를 확인하고 지점·보험 적용·재료비·포함 항목·적용일을 같은 기준으로 정리합니다. 수정 전 금액을 새 원고에 그대로 재사용하지 않습니다.",
    "owner": "병원 원무·운영 담당 + 홈페이지 담당",
    "sources": [
      {
        "label": "수술 안내",
        "url": "https://www.gold-man.com/prostate/bph-surgery"
      },
      {
        "label": "의료정보 비용 문서",
        "url": "https://www.gold-man.com/docs/prostate/bph-surgery-cost.html"
      },
      {
        "label": "비급여 안내",
        "url": "https://www.gold-man.com/support/pricing"
      }
    ]
  },
  {
    "id": "safety",
    "priority": "의료진 검수",
    "title": "치료 효과와 위험을 균형 있게 설명하세요",
    "observation": "수술 페이지의 아쿠아블레이션 소개에는 위험이 없다는 취지의 단정적 설명이 남아 있습니다. 아이틴드 설명의 해부학적 용어와 적용 대상도 의료진 확인이 필요합니다.",
    "implication": "치료의 일부 장점만 답변에 인용되면 개인차와 위험 설명이 빠질 수 있습니다. 이번 점검은 의료적 적합성이나 법 위반을 판정한 것이 아닙니다.",
    "action": "담당 의료진이 적용 대상·예외·위험·대안을 같은 문맥에서 확인하고, 절대적인 효과·안전 표현과 용어를 검토합니다.",
    "owner": "담당 의료진 + 콘텐츠 담당",
    "sources": [
      {
        "label": "수술 소개",
        "url": "https://www.gold-man.com/prostate/bph-surgery"
      }
    ]
  },
  {
    "id": "hours",
    "priority": "운영 정보 확인",
    "title": "야간 진료가 가능한 지점과 범위를 명확히 하세요",
    "observation": "요로결석 페이지는 24시간 진료·응급 쇄석을 안내합니다. 지점 안내와 비급여 페이지의 동적 상세 표는 텍스트 추출만으로 전체 내용을 확인하기 어렵습니다.",
    "implication": "정보가 없다는 판정이 아닙니다. 실제 화면과 현재 운영 범위를 함께 확인해야 환자가 방문 가능한 지점·시간·처치를 구분할 수 있습니다.",
    "action": "지점별 야간 가능 서비스, 전화 확인 절차와 운영 시간을 명시하고, 핵심 안내가 검색용 HTML에서도 읽히는지 확인합니다.",
    "owner": "병원 지점 운영 담당 + 홈페이지 담당",
    "sources": [
      {
        "label": "요로결석 안내",
        "url": "https://www.gold-man.com/stone/urinary-stone"
      },
      {
        "label": "지점 안내",
        "url": "https://www.gold-man.com/support/location"
      }
    ]
  },
  {
    "id": "journey",
    "priority": "기존 자산 활용",
    "title": "새 글보다 기존 질문형 문서 보완부터 시작하세요",
    "observation": "의료정보 홈에는 질문별 문서가 있고, 직접 확인한 수술 비용 문서에는 첫 답변·비교표·FAQ·근거 항목이 있습니다. 의료정보 사이트맵에는 106개 URL이 등록돼 있습니다.",
    "implication": "106개는 사이트맵 항목 수이지 검수 완료 콘텐츠 수가 아닙니다. 검색어와 관련된 기존 문서를 먼저 확인하면 같은 주제의 중복 발행을 줄일 수 있습니다.",
    "action": "실제 검색어 후보별로 기존 문서 유무를 확인하고, 첫 답변·최신 근거·검토일·진료 및 지점 안내 링크를 보완합니다. 조회 기간이 같은 검색 자료로 이후 변화를 관찰합니다.",
    "owner": "콘텐츠 담당 + 담당 의료진",
    "sources": [
      {
        "label": "의료정보 홈",
        "url": "https://www.gold-man.com/docs/"
      },
      {
        "label": "비용 문서",
        "url": "https://www.gold-man.com/docs/prostate/bph-surgery-cost.html"
      },
      {
        "label": "의료정보 사이트맵",
        "url": "https://www.gold-man.com/docs/sitemap.xml"
      }
    ]
  }
] as const;

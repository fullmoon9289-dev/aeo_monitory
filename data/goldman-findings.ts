export const goldmanFindings = [
  {
    id: 'staff', priority: '우선 수정', title: '의료진 수를 하나의 기준으로 맞추세요',
    observation: '대표 홈페이지와 의료진 소개 문서에는 11명, 전립선비대증 수술 페이지에는 12명으로 표시되어 있습니다.',
    implication: '같은 병원에 대한 서로 다른 숫자는 답변의 신뢰도를 떨어뜨릴 수 있습니다.',
    action: '현재 재직 명단을 확인한 뒤 대표·수술·의료정보 페이지의 숫자와 최종 확인일을 함께 맞춥니다.',
    owner: '병원 운영 담당 + 홈페이지 담당',
    sources: [{label:'대표 홈페이지',url:'https://www.gold-man.com/'},{label:'의료진 소개 문서',url:'https://www.gold-man.com/docs/team/medicalteam-overview.html'},{label:'수술 안내',url:'https://www.gold-man.com/prostate/bph-surgery'}],
  },
  {
    id: 'safety', priority: '의료진 검수', title: '수술의 장점과 위험 설명을 일관되게 정리하세요',
    observation: '수술 소개에는 부작용·합병증이 없다는 취지의 표현이 있지만, 같은 페이지의 FAQ에는 발생 가능한 합병증 안내가 있습니다.',
    implication: '일부 문장만 인용되면 치료 위험과 개인차가 빠질 수 있습니다.',
    action: '절대적인 안전 표현을 검토하고, 장점·적용 대상·한계·발생 가능한 위험을 같은 문맥에 배치합니다.',
    owner: '담당 의료진 + 콘텐츠 담당',
    sources: [{label:'수술 소개와 FAQ',url:'https://www.gold-man.com/prostate/bph-surgery'}],
  },
  {
    id: 'sitemap', priority: '수집 구조 보완', title: '두 사이트맵의 발견 경로를 정리하세요',
    observation: '대표 사이트맵은 72개 항목(고유 URL 70개), 의료정보 사이트맵은 104개 항목입니다. robots.txt에는 의료정보 사이트맵만 안내됩니다.',
    implication: '대표 진료 페이지와 의료정보 문서의 수집 경로를 함께 관리하기 좋습니다. 이 상태만으로 색인 누락을 판단할 수는 없습니다.',
    action: '대표 사이트맵도 robots.txt에 함께 안내하거나 사이트맵 인덱스로 묶고, 서치콘솔에서 두 범위의 제출·처리 상태를 확인합니다. 중복 항목도 정리합니다.',
    owner: '홈페이지 담당',
    sources: [{label:'robots.txt',url:'https://www.gold-man.com/robots.txt'},{label:'대표 사이트맵',url:'https://www.gold-man.com/sitemap.xml'},{label:'의료정보 사이트맵',url:'https://www.gold-man.com/docs/sitemap.xml'}],
  },
  {
    id: 'journey', priority: '기존 자산 활용', title: '기존 질문형 문서를 환자 동선에 연결하세요',
    observation: '의료정보 홈에는 치료 선택·수술 후 회복·증상 이해에 관한 질문형 문서 링크가 이미 정리되어 있습니다.',
    implication: '중복 글을 늘리기 전에 기존 답변의 정확성과 다음 행동 경로를 보완할 수 있습니다.',
    action: '질문별 문서를 열어 첫 답변·의료진 검토일·근거를 확인하고 관련 진료 설명과 지점 예약 안내를 연결합니다. 개별 질문 문서 본문은 추가 검토 대상입니다.',
    owner: '콘텐츠 담당 + 담당 의료진',
    sources: [{label:'의료정보 홈',url:'https://www.gold-man.com/docs/'},{label:'진료 안내',url:'https://www.gold-man.com/support/hours'}],
  },
] as const;

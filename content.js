document.addEventListener(
  "contextmenu",
  (e) => {
    // 1. 클릭한 이미지에서 가장 가까운 '상품 상자(li 또는 div)'를 찾습니다.
    const productCard = e.target.closest(
      "li, div[class*='prd'], div[class*='prod'], div[class*='item']",
    );

    if (productCard) {
      // 2. 그 상자 안에 숨겨져 있는 첫 번째 a 태그(진짜 상품 링크)를 찾아냅니다.
      const realLink = productCard.querySelector("a");
      window.lastClickedLink = realLink ? realLink.href : window.location.href;
    } else {
      // 3. 만약 상품 상자를 못 찾으면 기존 방식대로 가장 가까운 a 태그를 찾거나 현재 주소를 씁니다.
      window.lastClickedLink = e.target.closest("a")
        ? e.target.closest("a").href
        : window.location.href;
    }

    // 우클릭 방지 해제 코드
    e.stopPropagation();
  },
  true,
);

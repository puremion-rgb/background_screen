document.addEventListener(
  "contextmenu",
  (e) => {
    // 크롤링을 하지 않고, 클릭한 이미지의 '진짜 상품 상세페이지 주소'만 정확하게 추적합니다.
    const productCard = e.target.closest(
      "li, div[class*='prd'], div[class*='prod'], div[class*='item'], div[class*='card']",
    );

    let pageUrl = window.location.href;

    if (productCard) {
      const realLink = productCard.querySelector("a");
      if (realLink) pageUrl = realLink.href;
    } else {
      const closestLink = e.target.closest("a");
      if (closestLink) pageUrl = closestLink.href;
    }

    // 추적한 주소를 백그라운드에서 사용할 수 있도록 임시 저장합니다.
    chrome.storage.local.set({ lastClickedPageUrl: pageUrl });
  },
  true,
);

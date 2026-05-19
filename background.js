// 1. 우클릭 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-shopping-item",
    title: "Shopping Shot에 상품 추가",
    contexts: ["image"],
  });
});

// 2. 메뉴 클릭 시 실행
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "add-shopping-item") return;

  const imageUrl = info.srcUrl;
  const pageUrl = info.linkUrl || info.pageUrl;

  // popup으로 데이터 전달 (임시 저장 방식)
  const tempItem = {
    id: Date.now(),
    imgUrl: imageUrl,
    pageUrl: pageUrl,
    createdAt: new Date().toISOString(),
  };

  chrome.storage.local.set({ tempShoppingItem: tempItem }, () => {
    // popup 자동 열기 (없으면 사용자가 열면 됨)
    chrome.action.openPopup?.();
  });
});

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

  const tempItem = {
    id: Date.now(),
    imgUrl: imageUrl,
    pageUrl: pageUrl,
    createdAt: new Date().toISOString(),
  };

  chrome.storage.local.set({ tempShoppingItem: tempItem }, () => {
    if (tab?.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
});

// 확장프로그램 아이콘 클릭 시 사이드패널 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

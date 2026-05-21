chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-shopping-item",
    title: "Shopping Shot에 상품 추가",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "add-shopping-item") return;

  const imageUrl = info.srcUrl;

  chrome.storage.local.get(["lastClickedPageUrl", "shoppingList"], (data) => {
    const pageUrl = data.lastClickedPageUrl || info.linkUrl || info.pageUrl;
    const list = data.shoppingList || [];

    // memo와 colorTag 필드가 추가되었습니다.
    const newItem = {
      id: Date.now(),
      imgUrl: imageUrl,
      pageUrl: pageUrl,
      memo: "",
      colorTag: "",
    };

    const isDuplicate = list.some((v) => v.imgUrl === imageUrl);

    if (isDuplicate) {
      chrome.storage.local.set(
        { toastMessage: "이미 저장된 상품입니다." },
        () => {
          if (tab?.windowId) chrome.sidePanel.open({ windowId: tab.windowId });
        },
      );
    } else {
      // 새로운 항목을 맨 앞에 추가 (드래그 순서 유지를 위해 unshift 사용)
      list.unshift(newItem);
      chrome.storage.local.set(
        { shoppingList: list, toastMessage: "저장되었습니다." },
        () => {
          if (tab?.windowId) chrome.sidePanel.open({ windowId: tab.windowId });
        },
      );
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

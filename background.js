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
  if (info.menuItemId === "add-shopping-item") {
    const imageUrl = info.srcUrl;

    // 현재 웹페이지에 입력창 띄우기
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: () => {
          const title = prompt("상품 이름을 입력해주세요:", "새 상품");
          // 첫 번째 창에서 취소를 누르면 바로 null 반환하여 중단
          if (title === null) return "CANCEL_PROCESS";

          const price = prompt("가격을 입력해주세요 (숫자만):", "10000");
          // 두 번째 창에서 취소를 누르면 바로 null 반환하여 중단
          if (price === null) return "CANCEL_PROCESS";

          const realProductUrl = window.lastClickedLink || window.location.href;
          return { title, price, realProductUrl };
        },
      })
      .then((results) => {
        // 사용자가 어느 하나라도 [취소]를 눌렀다면 여기서 차단하여 저장하지 않습니다.
        if (
          !results ||
          !results[0] ||
          results[0].result === "CANCEL_PROCESS" ||
          !results[0].result
        ) {
          console.log("사용자가 입력을 취소하여 저장을 중단합니다.");
          return;
        }

        // [확인]을 정상적으로 누른 경우에만 데이터 가져오기
        const { title, price, realProductUrl } = results[0].result;

        // 혹시나 빈칸으로 확인을 눌렀을 때를 위한 안전장치 기본값
        const finalTitle = title.trim() === "" ? "상품명 없음" : title;
        const finalPrice = price.trim() === "" ? "0" : price;

        // 크롬 스토리지에 저장하기
        chrome.storage.local.get({ shoppingList: [] }, (data) => {
          const currentList = data.shoppingList;

          const newItem = {
            id: Date.now(),
            title: finalTitle,
            price: finalPrice,
            imgUrl: imageUrl,
            pageUrl: realProductUrl,
            date: new Date().toLocaleDateString(),
          };

          currentList.push(newItem);

          chrome.storage.local.set({ shoppingList: currentList }, () => {
            console.log("저장 성공:", newItem);
          });
        });
      });
  }
});

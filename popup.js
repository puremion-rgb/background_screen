document.addEventListener("DOMContentLoaded", () => {
  const shoppingListContainer = document.getElementById("shopping-list");
  const emptyMessage = document.getElementById("empty-message");
  const clearAllBtn = document.getElementById("clear-all-btn");

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      const confirmDelete = confirm("정말 장바구니를 모두 비우시겠습니까?");
      if (confirmDelete) {
        chrome.storage.local.set({ shoppingList: [] }, () => {
          window.location.reload();
        });
      }
    });
  }

  chrome.storage.local.get({ shoppingList: [] }, (data) => {
    const list = data.shoppingList;

    if (!list || list.length === 0) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";

      const formattedPrice = isNaN(item.price)
        ? item.price
        : Number(item.price).toLocaleString();
      const displayDate = item.date || new Date().toLocaleDateString();

      card.innerHTML = `
        <div class="card-link" data-url="${item.pageUrl}">
          <img src="${item.imgUrl}" class="card-img" alt="상품 이미지">
          <div class="card-info">
            <p class="card-title">${item.title}</p>
            <div class="card-price">${formattedPrice}원</div>
            <p class="card-date">${displayDate}</p>
          </div>
        </div>
<div class="card-action">
  <button class="edit-btn" data-id="${item.id}">수정</button>
  <button class="delete-btn" data-id="${item.id}">삭제</button>
</div>
      `;

      shoppingListContainer.appendChild(card);
    });

    const cardLinks = document.querySelectorAll(".card-link");
    cardLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetCard = e.target.closest(".card-link");
        const url = targetCard.getAttribute("data-url");
        if (url) {
          chrome.tabs.create({ url: url });
        }
      });
    });

    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const targetId = Number(e.target.getAttribute("data-id"));
        deleteItem(targetId);
      });
    });

    const editButtons = document.querySelectorAll(".edit-btn");

    editButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const targetId = Number(e.target.getAttribute("data-id"));
        editItem(targetId);
      });
    });
  });

  function deleteItem(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const currentList = data.shoppingList;
      const updatedList = currentList.filter((item) => item.id !== id);

      chrome.storage.local.set({ shoppingList: updatedList }, () => {
        window.location.reload();
      });
    });
  }

  function editItem(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const currentList = data.shoppingList;

      const targetItem = currentList.find((item) => item.id === id);

      if (!targetItem) return;

      // 기존 값 보여주기
      const newTitle = prompt("수정할 상품명을 입력하세요:", targetItem.title);

      if (newTitle === null) return;

      const newPrice = prompt("수정할 가격을 입력하세요:", targetItem.price);

      if (newPrice === null) return;

      // 데이터 수정
      targetItem.title = newTitle.trim() === "" ? "상품명 없음" : newTitle;

      targetItem.price = newPrice.trim() === "" ? "0" : newPrice;

      // 수정 날짜 업데이트
      targetItem.date = new Date().toLocaleDateString();

      chrome.storage.local.set({ shoppingList: currentList }, () => {
        console.log("수정 완료:", targetItem);
        window.location.reload();
      });
    });
  }
});

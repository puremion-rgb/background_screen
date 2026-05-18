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
});

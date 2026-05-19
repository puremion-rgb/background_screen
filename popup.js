document.addEventListener("DOMContentLoaded", () => {
  const shoppingListContainer = document.getElementById("shopping-list");
  const emptyMessage = document.getElementById("empty-message");
  const clearAllBtn = document.getElementById("clear-all-btn");

  // ===== 모달 요소 =====
  const editModal = document.getElementById("edit-modal");
  const editTitleInput = document.getElementById("edit-title");
  const editPriceInput = document.getElementById("edit-price");

  const saveEditBtn = document.getElementById("save-edit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  let currentEditId = null;

  // ===== 최초 렌더링 =====
  loadShoppingList();

  // ===== 전체 삭제 =====
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      const confirmDelete = confirm("정말 장바구니를 모두 비우시겠습니까?");

      if (confirmDelete) {
        chrome.storage.local.set({ shoppingList: [] }, () => {
          renderShoppingList([]);
        });
      }
    });
  }

  // ===== 이벤트 위임 =====
  shoppingListContainer.addEventListener("click", (e) => {
    // 삭제 버튼
    if (e.target.classList.contains("delete-btn")) {
      const targetId = Number(e.target.dataset.id);
      deleteItem(targetId);
      return;
    }

    // 수정 버튼
    if (e.target.classList.contains("edit-btn")) {
      const targetId = Number(e.target.dataset.id);
      openEditModal(targetId);
      return;
    }

    // 카드 클릭
    const cardLink = e.target.closest(".card-link");

    if (cardLink) {
      const url = cardLink.dataset.url;

      if (url) {
        chrome.tabs.create({ url });
      }
    }
  });

  // ===== 수정 저장 =====
  saveEditBtn.addEventListener("click", () => {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const currentList = data.shoppingList;

      const targetItem = currentList.find((item) => item.id === currentEditId);

      if (!targetItem) return;

      targetItem.title =
        editTitleInput.value.trim().slice(0, 50) || "상품명 없음";

      targetItem.price = Number(editPriceInput.value.replace(/,/g, "")) || 0;

      targetItem.date = new Date().toISOString();

      chrome.storage.local.set({ shoppingList: currentList }, () => {
        closeModal();
        renderShoppingList(currentList);
      });
    });
  });

  // ===== 수정 취소 =====
  cancelEditBtn.addEventListener("click", () => {
    closeModal();
  });

  // ===== ESC 닫기 =====
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // ===== 모달 바깥 클릭 닫기 =====
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
      closeModal();
    }
  });

  // ===== 리스트 불러오기 =====
  function loadShoppingList() {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      renderShoppingList(data.shoppingList);
    });
  }

  // ===== 리스트 렌더링 =====
  function renderShoppingList(list) {
    shoppingListContainer.innerHTML = "";

    if (!list || list.length === 0) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";

      const formattedPrice = Number(item.price).toLocaleString();

      const displayDate = item.date
        ? new Date(item.date).toLocaleDateString()
        : new Date().toLocaleDateString();

      card.innerHTML = `
        <div class="card-link" data-url="${item.pageUrl}">
          <img src="${item.imgUrl}" class="card-img" alt="상품 이미지">

          <div class="card-info">
            <p class="card-title">${item.title}</p>

            <div class="card-price">
              ${formattedPrice}원
            </div>

            <p class="card-date">
              ${displayDate}
            </p>
          </div>
        </div>

        <div class="card-action">
          <button class="edit-btn" data-id="${item.id}">
            수정
          </button>

          <button class="delete-btn" data-id="${item.id}">
            삭제
          </button>
        </div>
      `;

      shoppingListContainer.appendChild(card);
    });
  }

  // ===== 삭제 =====
  function deleteItem(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const updatedList = data.shoppingList.filter((item) => item.id !== id);

      chrome.storage.local.set({ shoppingList: updatedList }, () => {
        renderShoppingList(updatedList);
      });
    });
  }

  // ===== 수정 모달 열기 =====
  function openEditModal(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const targetItem = data.shoppingList.find((item) => item.id === id);

      if (!targetItem) return;

      currentEditId = id;

      editTitleInput.value = targetItem.title;

      editPriceInput.value = targetItem.price;

      editModal.classList.remove("hidden");
    });
  }

  // ===== 모달 닫기 =====
  function closeModal() {
    editModal.classList.add("hidden");

    editTitleInput.value = "";
    editPriceInput.value = "";

    currentEditId = null;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const shoppingListContainer = document.getElementById("shopping-list");
  const emptyMessage = document.getElementById("empty-message");
  const clearAllBtn = document.getElementById("clear-all-btn");

  const editModal = document.getElementById("edit-modal");
  const editTitleInput = document.getElementById("edit-title");
  const editPriceInput = document.getElementById("edit-price");

  const saveEditBtn = document.getElementById("save-edit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  let currentEditId = null;

  const addModal = document.getElementById("add-modal");
  const addTitleInput = document.getElementById("add-title");
  const addPriceInput = document.getElementById("add-price");
  const saveAddBtn = document.getElementById("save-add-btn");
  const cancelAddBtn = document.getElementById("cancel-add-btn");
  const previewImage = document.getElementById("preview-image");

  let pendingTempItem = null;

  loadShoppingList();
  loadTempItem(); // ⭐ 추가 핵심
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    if (changes.tempShoppingItem?.newValue) {
      loadTempItem();
    }
  });

  // =========================
  // 임시 데이터 불러오기
  // =========================
  function loadTempItem() {
    chrome.storage.local.get(["tempShoppingItem"], (data) => {
      const temp = data.tempShoppingItem;

      if (!temp) return;

      pendingTempItem = temp;

      previewImage.src = temp.imgUrl;

      addTitleInput.value = "";
      addPriceInput.value = "";

      addModal.classList.remove("hidden");
      chrome.storage.local.remove("tempShoppingItem");
    });
  }

  function clearTemp() {
    chrome.storage.local.remove("tempShoppingItem");
  }

  // =========================
  // 저장
  // =========================
  function saveItem(item) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;

      const newItem = {
        id: item.id || Date.now(),
        title: item.title,
        price: item.price,
        imgUrl: item.imgUrl,
        pageUrl: item.pageUrl,
        createdAt: item.createdAt,
        updatedAt: new Date().toISOString(),
      };

      list.push(newItem);

      chrome.storage.local.set({ shoppingList: list }, () => {
        renderShoppingList(list);
      });
    });
  }

  // =========================
  // 전체 삭제
  // =========================
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (!confirm("전체 삭제하시겠습니까?")) return;

      chrome.storage.local.set({ shoppingList: [] }, () => {
        renderShoppingList([]);
      });
    });
  }

  // =========================
  // 클릭 이벤트
  // =========================
  shoppingListContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      deleteItem(Number(e.target.dataset.id));
      return;
    }

    if (e.target.classList.contains("edit-btn")) {
      openEditModal(Number(e.target.dataset.id));
      return;
    }

    const card = e.target.closest(".card-link");
    if (card?.dataset.url) {
      chrome.tabs.create({ url: card.dataset.url });
    }
  });

  // =========================
  // 수정 저장
  // =========================
  saveEditBtn.addEventListener("click", () => {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;

      const item = list.find((v) => v.id === currentEditId);
      if (!item) return;

      item.title = editTitleInput.value.trim() || "상품명 없음";
      item.price = Number(editPriceInput.value.replace(/,/g, "")) || 0;
      item.updatedAt = new Date().toISOString();

      chrome.storage.local.set({ shoppingList: list }, () => {
        closeModal();
        renderShoppingList(list);
      });
    });
  });

  cancelEditBtn.addEventListener("click", closeModal);

  saveAddBtn.addEventListener("click", () => {
    if (!pendingTempItem) return;

    saveItem({
      ...pendingTempItem,
      title: addTitleInput.value.trim() || "상품명 없음",
      price: Number(addPriceInput.value.replace(/,/g, "")) || 0,
    });

    clearTemp();
    closeAddModal();
    loadShoppingList();
  });

  cancelAddBtn.addEventListener("click", () => {
    closeAddModal();
    clearTemp();
  });

  document.addEventListener("keydown", (e) => {
    // ESC → 닫기
    if (e.key === "Escape") {
      closeModal();
      closeAddModal();
    }

    // ENTER → 저장
    if (e.key === "Enter") {
      // 상품 추가 모달 열려있을 때
      if (!addModal.classList.contains("hidden")) {
        saveAddBtn.click();
      }

      // 수정 모달 열려있을 때
      if (!editModal.classList.contains("hidden")) {
        saveEditBtn.click();
      }
    }
  });

  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeModal();
  });

  // =========================
  // 리스트 로드
  // =========================
  function loadShoppingList() {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      renderShoppingList(data.shoppingList);
    });
  }

  // =========================
  // 렌더링
  // =========================
  function renderShoppingList(list) {
    shoppingListContainer.innerHTML = "";

    if (!list.length) {
      emptyMessage.style.display = "block";
      return;
    }

    emptyMessage.style.display = "none";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";

      const price = Number(item.price || 0).toLocaleString();

      const date = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString()
        : "";

      card.innerHTML = `
        <div class="card-link" data-url="${item.pageUrl}">
          <img src="${item.imgUrl}" class="card-img">

          <div class="card-info">
            <p class="card-title">${item.title}</p>
            <div class="card-price">${price}원</div>
            <p class="card-date">${date}</p>
          </div>
        </div>

        <div class="card-action">
          <button class="edit-btn" data-id="${item.id}">수정</button>
          <button class="delete-btn" data-id="${item.id}">삭제</button>
        </div>
      `;

      shoppingListContainer.appendChild(card);
    });
  }

  // =========================
  // 삭제
  // =========================
  function deleteItem(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const updated = data.shoppingList.filter((v) => v.id !== id);

      chrome.storage.local.set({ shoppingList: updated }, () => {
        renderShoppingList(updated);
      });
    });
  }

  // =========================
  // 수정 모달
  // =========================
  function openEditModal(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const item = data.shoppingList.find((v) => v.id === id);
      if (!item) return;

      currentEditId = id;
      editTitleInput.value = item.title;
      editPriceInput.value = item.price;

      editModal.classList.remove("hidden");
    });
  }

  function closeModal() {
    editModal.classList.add("hidden");
    editTitleInput.value = "";
    editPriceInput.value = "";
    currentEditId = null;
  }

  function closeAddModal() {
    addModal.classList.add("hidden");

    addTitleInput.value = "";
    addPriceInput.value = "";

    pendingTempItem = null;
  }

  addModal.addEventListener("click", (e) => {
    if (e.target === addModal) {
      closeAddModal();
      clearTemp();
    }
  });
});

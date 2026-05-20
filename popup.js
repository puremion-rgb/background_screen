document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // DOM
  // =========================

  const shoppingListContainer = document.getElementById("shopping-list");

  const emptyMessage = document.getElementById("empty-message");

  const clearAllBtn = document.getElementById("clear-all-btn");

  const searchInput = document.getElementById("search-input");

  const sortSelect = document.getElementById("sort-select");

  // 수정 모달
  const editModal = document.getElementById("edit-modal");

  const editTitleInput = document.getElementById("edit-title");

  const editPriceInput = document.getElementById("edit-price");

  const saveEditBtn = document.getElementById("save-edit-btn");

  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  // 추가 모달
  const addModal = document.getElementById("add-modal");

  const addTitleInput = document.getElementById("add-title");

  const addPriceInput = document.getElementById("add-price");

  const saveAddBtn = document.getElementById("save-add-btn");

  const cancelAddBtn = document.getElementById("cancel-add-btn");

  const previewImage = document.getElementById("preview-image");

  // =========================
  // 상태값
  // =========================

  let currentEditId = null;

  let pendingTempItem = null;

  let currentSearch = "";

  let currentSort = "latest";

  // =========================
  // 가격 자동 쉼표
  // =========================

  function formatPriceInput(input) {
    input.addEventListener("input", (e) => {
      let value = e.target.value;

      value = value.replace(/[^0-9]/g, "");

      value = Number(value).toLocaleString();

      if (value === "NaN") {
        value = "";
      }

      e.target.value = value;
    });
  }

  formatPriceInput(addPriceInput);
  formatPriceInput(editPriceInput);

  // =========================
  // 초기 실행
  // =========================

  loadShoppingList();
  loadTempItem();

  // =========================
  // 검색
  // =========================

  searchInput?.addEventListener("input", (e) => {
    currentSearch = e.target.value;

    loadShoppingList();
  });

  // =========================
  // 정렬
  // =========================

  sortSelect?.addEventListener("change", (e) => {
    currentSort = e.target.value;

    loadShoppingList();
  });

  // =========================
  // storage 감지
  // =========================

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
        id: Date.now(),

        title: item.title,

        price: item.price,

        imgUrl: item.imgUrl,

        pageUrl: item.pageUrl,

        createdAt: item.createdAt || new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      };

      list.push(newItem);

      chrome.storage.local.set({ shoppingList: list }, () => {
        loadShoppingList();
      });
    });
  }

  // =========================
  // 전체 삭제
  // =========================

  clearAllBtn?.addEventListener("click", () => {
    if (!confirm("전체 삭제하시겠습니까?")) return;

    chrome.storage.local.set({ shoppingList: [] }, () => {
      renderShoppingList([]);
    });
  });

  // =========================
  // 카드 클릭 이벤트
  // =========================

  shoppingListContainer.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("delete-btn") ||
      e.target.classList.contains("edit-btn")
    ) {
      e.stopPropagation();
    }

    // 삭제
    if (e.target.classList.contains("delete-btn")) {
      deleteItem(Number(e.target.dataset.id));

      return;
    }

    // 수정
    if (e.target.classList.contains("edit-btn")) {
      openEditModal(Number(e.target.dataset.id));

      return;
    }

    // 카드 클릭
    const card = e.target.closest(".card-link");

    if (card?.dataset.url) {
      chrome.tabs.create({
        url: card.dataset.url,
      });
    }
  });

  // =========================
  // 상품 추가 저장
  // =========================

  saveAddBtn.addEventListener("click", () => {
    if (!pendingTempItem) return;

    saveItem({
      ...pendingTempItem,

      title: addTitleInput.value.trim() || "상품명 없음",

      price: Number(addPriceInput.value.replace(/,/g, "")) || 0,
    });

    clearTemp();

    closeAddModal();
  });

  cancelAddBtn.addEventListener("click", () => {
    closeAddModal();

    clearTemp();
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

        loadShoppingList();
      });
    });
  });

  cancelEditBtn.addEventListener("click", closeModal);

  // =========================
  // 키 이벤트
  // =========================

  document.addEventListener("keydown", (e) => {
    // ESC
    if (e.key === "Escape") {
      closeModal();

      closeAddModal();
    }

    // ENTER
    if (e.key === "Enter") {
      if (!addModal.classList.contains("hidden")) {
        saveAddBtn.click();
      }

      if (!editModal.classList.contains("hidden")) {
        saveEditBtn.click();
      }
    }
  });

  // =========================
  // 리스트 로드
  // =========================

  function loadShoppingList() {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      let list = [...data.shoppingList];

      // 검색
      if (currentSearch.trim()) {
        list = list.filter((item) =>
          item.title.toLowerCase().includes(currentSearch.toLowerCase()),
        );
      }

      // 정렬
      if (currentSort === "lowPrice") {
        list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
      }

      if (currentSort === "highPrice") {
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
      }

      if (currentSort === "latest") {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      renderShoppingList(list);
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

      const date = formatRelativeDate(item.createdAt);

      card.innerHTML = `
        <div class="card-link"
          data-url="${item.pageUrl}">

          <img
            src="${item.imgUrl}"
            class="card-img"
            loading="lazy"
          >

          <div class="card-info">
            <p class="card-title">
              ${item.title}
            </p>

            <div class="card-price">
              ${price}원
            </div>

            <p class="card-date">
              ${date}
            </p>
          </div>
        </div>

        <div class="card-action">
          <button
            class="edit-btn"
            data-id="${item.id}">
            수정
          </button>

          <button
            class="delete-btn"
            data-id="${item.id}">
            삭제
          </button>
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
        loadShoppingList();
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

      editPriceInput.value = Number(item.price || 0).toLocaleString();

      editModal.classList.remove("hidden");
    });
  }

  // =========================
  // 모달 닫기
  // =========================

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

  // =========================
  // 상대 날짜
  // =========================

  function formatRelativeDate(dateString) {
    if (!dateString) return "";

    const now = new Date();

    const target = new Date(dateString);

    const diffMs = now - target;

    const diffMin = Math.floor(diffMs / (1000 * 60));

    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));

    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return "방금 전";

    if (diffMin < 60) return `${diffMin}분 전`;

    if (diffHour < 24) return `${diffHour}시간 전`;

    if (diffDay === 1) return "어제";

    if (diffDay < 7) return `${diffDay}일 전`;

    return target.toLocaleDateString();
  }

  // =========================
  // 모달 배경 클릭
  // =========================

  addModal.addEventListener("click", (e) => {
    if (e.target === addModal) {
      closeAddModal();

      clearTemp();
    }
  });

  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
      closeModal();
    }
  });
});

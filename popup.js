document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("shopping-list");
  const emptyMessage = document.getElementById("empty-message");
  const searchInput = document.getElementById("search-input");
  const toast = document.getElementById("toast");

  // 모달
  const confirmModal = document.getElementById("confirm-modal");
  const editModal = document.getElementById("edit-modal");
  const memoInput = document.getElementById("memo-input");

  let currentEditId = null;
  let currentSearch = "";

  loadShoppingList();
  checkPendingToast();

  // 🛠️ 보완 1: toastMessage 삭제 행위가 불필요하게 리스트를 재로딩하지 않도록 조건 분기 강화
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    // shoppingList가 실제로 변경되었을 때만 화면을 리로드합니다.
    if (changes.shoppingList) {
      loadShoppingList();
    }

    if (changes.toastMessage?.newValue) {
      showToast(changes.toastMessage.newValue);
      chrome.storage.local.remove("toastMessage");
    }
  });

  function checkPendingToast() {
    chrome.storage.local.get(["toastMessage"], (data) => {
      if (data.toastMessage) {
        showToast(data.toastMessage);
        chrome.storage.local.remove("toastMessage");
      }
    });
  }

  searchInput?.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    loadShoppingList();
  });

  // --- 전체 삭제 모달 ---
  document.getElementById("clear-all-btn")?.addEventListener("click", () => {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      if (data.shoppingList.length === 0)
        return showToast("삭제할 상품이 없습니다.");
      confirmModal.classList.remove("hidden");
    });
  });
  document
    .getElementById("confirm-cancel-btn")
    ?.addEventListener("click", () => confirmModal.classList.add("hidden"));
  document
    .getElementById("confirm-delete-btn")
    ?.addEventListener("click", () => {
      chrome.storage.local.set({ shoppingList: [] }, () => {
        confirmModal.classList.add("hidden");
        showToast("전체 삭제되었습니다.");
      });
    });

  // --- 편집 모달 (메모 및 태그) ---
  const colorDots = document.querySelectorAll(".color-dot-select");
  colorDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      colorDots.forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
    });
  });

  document
    .getElementById("edit-cancel-btn")
    ?.addEventListener("click", () => editModal.classList.add("hidden"));
  document.getElementById("edit-save-btn")?.addEventListener("click", () => {
    const selectedColor =
      document.querySelector(".color-dot-select.active")?.dataset.color || "";
    const memoText = memoInput.value.trim();

    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;
      const target = list.find((v) => v.id === currentEditId);
      if (target) {
        target.memo = memoText;
        target.colorTag = selectedColor;
        chrome.storage.local.set({ shoppingList: list }, () => {
          editModal.classList.add("hidden");
          showToast("저장되었습니다.");
        });
      }
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === confirmModal) confirmModal.classList.add("hidden");
    if (e.target === editModal) editModal.classList.add("hidden");
  });

  // --- 카드 클릭 이벤트 제어 (위임) ---
  container.addEventListener("click", (e) => {
    const target = e.target;

    if (target.closest(".btn-del")) {
      const id = Number(target.closest(".btn-del").dataset.id);
      deleteItem(id);
      return;
    }
    if (target.closest(".btn-edit")) {
      const id = Number(target.closest(".btn-edit").dataset.id);
      openEditModal(id);
      return;
    }
    const cardLink = target.closest(".card-link");
    if (cardLink && !target.closest(".action-group")) {
      chrome.tabs.create({ url: cardLink.dataset.url });
    }
  });

  function openEditModal(id) {
    currentEditId = id;
    // 🛠️ 보완 2: 모달을 열기 전에 기존에 입력되어 있던 서식을 깨끗하게 초기화
    memoInput.value = "";
    colorDots.forEach((d) => d.classList.remove("active"));

    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const item = data.shoppingList.find((v) => v.id === id);
      if (!item) return;

      memoInput.value = item.memo || "";
      colorDots.forEach((d) => {
        if (d.dataset.color === (item.colorTag || "")) {
          d.classList.add("active");
        }
      });
      editModal.classList.remove("hidden");
    });
  }

  function deleteItem(id) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const updated = data.shoppingList.filter((v) => v.id !== id);
      chrome.storage.local.set({ shoppingList: updated }, () =>
        showToast("삭제되었습니다."),
      );
    });
  }

  let draggedItemId = null;

  function loadShoppingList() {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      let list = data.shoppingList;

      if (currentSearch) {
        list = list.filter((item) => {
          const memo = item.memo ? item.memo.toLowerCase() : "";
          return memo.includes(currentSearch);
        });
      }

      renderShoppingList(list);
    });
  }

  function renderShoppingList(list) {
    container.innerHTML = "";
    if (!list.length) {
      emptyMessage.innerHTML = currentSearch
        ? `'${currentSearch}'에 대한 결과가 없습니다.`
        : `스크랩한 상품이 없습니다.<br />상품 이미지에서 우클릭해 보세요!`;
      emptyMessage.style.display = "block";
      return;
    }
    emptyMessage.style.display = "none";

    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;

      const tooltip = item.memo ? item.memo : "클릭하여 쇼핑몰로 이동";
      const colorTagHtml = item.colorTag
        ? `<div class="card-color-tag" style="background-color: ${item.colorTag};"></div>`
        : "";

      card.innerHTML = `
        <div class="card-link" data-url="${item.pageUrl}">
          <div class="action-group">
            <button class="icon-btn btn-edit" data-id="${item.id}" title="수정">✎</button>
            <button class="icon-btn btn-del" data-id="${item.id}" title="삭제">✕</button>
          </div>
          ${colorTagHtml}
          <div class="card-img-wrap" title="${tooltip}" style="width: 100%; height: 100%;">
            <img src="${item.imgUrl}" class="card-img" loading="lazy" draggable="false" onerror="this.src='icon.png'; this.style.objectFit='contain'; this.style.padding='20px'; background='#ffffff';">
          </div>
        </div>
      `;

      card.addEventListener("dragstart", (e) => {
        draggedItemId = item.id;
        card.classList.add("dragging");
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        const droppedOnItemId = item.id;
        if (draggedItemId && draggedItemId !== droppedOnItemId) {
          reorderList(draggedItemId, droppedOnItemId);
        }
      });

      container.appendChild(card);
    });
  }

  function reorderList(fromId, toId) {
    chrome.storage.local.get({ shoppingList: [] }, (data) => {
      const list = data.shoppingList;
      const fromIndex = list.findIndex((v) => v.id === fromId);
      const toIndex = list.findIndex((v) => v.id === toId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [movedItem] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, movedItem);

        // 🛠️ 보완 3: 순서 교체 후 스토리지가 성공적으로 세팅되면 화면을 즉시 동기화하도록 콜백 추가
        chrome.storage.local.set({ shoppingList: list }, () => {
          loadShoppingList();
        });
      }
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.classList.add("hidden"), 250);
    }, 2000);
  }
});
